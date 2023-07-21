import { describe, expect, test } from "@jest/globals";
import { EDGAR } from "../src/edgar";

// TODO mock EDGAR requests?

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
      name: "HeyKiddo",
      filings: [],
    };
    expect.assertions(2);
    const filings = await edgar.findNewFilings(company);
    expect(filings.length).toBeGreaterThanOrEqual(1);
    expect(filings[0].number).toBe("021-485261");
  });

  test("is not empty for a company by CIK", async () => {
    let company: Company = {
      name: "HeyKiddo",
      cik: "0001978342",
      filings: [],
    };
    expect.assertions(2);
    const filings = await edgar.findNewFilings(company);
    expect(filings.length).toBeGreaterThanOrEqual(1);
    const numbers = filings.map((filing) => filing.number);
    expect(numbers.includes("021-485261")).toBeTruthy();
  });

  test("does not include filings already known", async () => {
    const number = "021-433765";
    let company: Company = {
      name: "ROAR for Good",
      cik: "0001643039",
      filings: [{ number: number, form: "D", date: "2022-2-16" }],
    };
    expect.assertions(2);
    const filings = await edgar.findNewFilings(company);
    expect(filings.length).toBeGreaterThanOrEqual(1);
    const numbers = filings.map((filing) => filing.number);
    expect(numbers.includes(number)).not.toBeTruthy();
  });
});
