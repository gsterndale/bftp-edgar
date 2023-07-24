import { describe, expect, test } from "@jest/globals";
import { EDGAR } from "../src/edgar";
import fs from "fs";
import path from "path";

EDGAR.rateLimit = 10000000;

type Path = string;
type URLPattern = RegExp | string;
type FixtureOptions = {
  json?: Function | object;
  text?: Function | string;
  jsonPath?: Path;
  textPath?: Path;
};
const ogFetch = global.fetch;
const mockedFetches: { [key: string]: any } = {};
const mockFetch = (
  pattern: URLPattern,
  fixture: FixtureOptions = {},
  options: ResponseInit = {}
) => {
  var body: BodyInit | string | null = null;

  if (fixture.jsonPath !== undefined)
    body = fs
      .readFileSync(path.resolve(__dirname, fixture.jsonPath as string))
      .toString();

  if (fixture.textPath !== undefined)
    body = fs
      .readFileSync(path.resolve(__dirname, fixture.textPath as string))
      .toString();

  mockedFetches[pattern.toString()] = {
    pattern: pattern,
    response: new Response(body, options),
  };
};

global.fetch = jest.fn((url: string, init: RequestInit = {}) => {
  const mockedFetch = Object.values(mockedFetches).find((mockedFetch) => {
    return typeof mockedFetch.pattern === "string"
      ? url === mockedFetch.pattern
      : url.match(mockedFetch.pattern);
  });
  if (mockedFetch) {
    return Promise.resolve(mockedFetch.response);
  } else {
    console.warn(`No matching pattern for: ${url}`);
    return ogFetch(url, init);
  }
}) as jest.Mock;

describe("finding a company's CIK by name", () => {
  let edgar: EDGAR;

  beforeEach(() => {
    mockFetch(/company=Salesforce.*atom/, { textPath: "salesforce.xml" });
    edgar = new EDGAR();
  });

  test("is not empty", async () => {
    expect.assertions(1);
    const cik = await edgar.findCIK("Salesforce, Inc.");
    expect(cik).toBe("0001108524");
  });
});

describe("finding new filings for a company", () => {
  let edgar: EDGAR;

  beforeEach(() => {
    edgar = new EDGAR();
  });

  test("is not empty for a company by name", async () => {
    mockFetch(/company=Salesforce.*atom/, { textPath: "salesforce.xml" });
    let company: Company = {
      name: "Salesforce, Inc.",
      filings: [],
    };
    expect.assertions(2);
    const filings = await edgar.findNewFilings(company);
    expect(filings.length).toBeGreaterThanOrEqual(1);
    const numbers = filings.map((filing) => filing.number);
    expect(numbers.includes("0001127602-23-019366")).toBeTruthy();
  });

  test("is not empty for a company by CIK", async () => {
    mockFetch(/CIK0001108524.json/, { jsonPath: "CIK0001108524.json" });
    let company: Company = {
      name: "Salesforce, Inc.",
      cik: "0001108524",
      filings: [],
    };
    expect.assertions(2);
    const filings = await edgar.findNewFilings(company);
    expect(filings.length).toBeGreaterThanOrEqual(1);
    const numbers = filings.map((filing) => filing.number);
    expect(numbers.includes("0001127602-23-019366")).toBeTruthy();
  });

  test("does not include filings already known", async () => {
    mockFetch(/CIK0001108524.json/, { jsonPath: "CIK0001108524.json" });
    const number = "0001127602-23-019366";
    let company: Company = {
      name: "Salesforce, Inc.",
      cik: "0001108524",
      filings: [{ number: number, form: "4", date: "2023-06-23" }],
    };
    expect.assertions(2);
    const newFilings = await edgar.findNewFilings(company);
    expect(newFilings.length).toBeGreaterThanOrEqual(1);
    const numbers = newFilings.map((filing) => filing.number);
    expect(numbers.includes(number)).not.toBeTruthy();
  });
});
