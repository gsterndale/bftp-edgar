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
