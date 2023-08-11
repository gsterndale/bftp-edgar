import { describe, expect, test } from "@jest/globals";
import { EDGAR } from "../src/edgar";

EDGAR.rateLimit = 10000000;

import soFetch from "./soFetch";
const gretchen = soFetch({
  missingEntryStrategy: "error",
  recordNewEntries: false,
});
beforeAll(() => {
  gretchen.start();
});

describe("finding new filings for a company", () => {
  test("is not empty for a company by CIK", async () => {
    const edgar = new EDGAR();
    let company: Company = {
      name: "Salesforce, Inc.",
      cik: "0001108524",
    };
    expect.assertions(2);
    const filings = await edgar.findFilings(company);
    expect(filings.length).toBeGreaterThanOrEqual(1);
    const numbers = filings.map((filing) => filing.number);
    expect(numbers.includes("0001127602-23-019366")).toBeTruthy();
  });
});
