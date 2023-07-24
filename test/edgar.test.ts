import { describe, expect, test } from "@jest/globals";
import { EDGAR } from "../src/edgar";
import fs from "fs";
import path from "path";

EDGAR.rateLimit = 10000000;

import soFetch from "./soFetch";
const gretchen = soFetch({});

beforeAll(() => {
  gretchen.start();
});

describe("finding a company's CIK by name", () => {
  let edgar: EDGAR;

  beforeEach(() => {
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
