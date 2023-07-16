import { describe, expect, test } from "@jest/globals";
import { Portfolio } from "../src/portfolio";

// TODO mock Salesforce requests?

describe("companies", () => {
  let portfolio: Portfolio;

  beforeEach(() => {
    portfolio = new Portfolio();
  });

  test("is not empty", async () => {
    expect.assertions(2);
    const companies = await portfolio.companies();
    expect(companies.length).toBeGreaterThan(0);
    expect(companies[0].name).toMatch(/.+/);
  });
});
