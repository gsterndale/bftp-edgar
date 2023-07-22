import { describe, expect, test } from "@jest/globals";
import { Portfolio } from "../src/portfolio";

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

describe("addCompanyFilings", () => {
  let portfolio: Portfolio;

  beforeEach(() => {
    portfolio = new Portfolio();
  });

  test("adds new filing records to company", async () => {
    let company: Company = {
      id: "001Hu00002uSBSLIA4",
      name: "Salesforce, Inc.",
      cik: "0001108524",
      filings: [],
    };
    let randomNumber = `123-${new Date().getTime()}`;
    let newFilings: Filing[] = [
      {
        number: randomNumber,
        form: "D",
        date: "2000-01-01",
      },
    ];

    expect.assertions(2);
    const filings = await portfolio.addCompanyFilings(company, newFilings);
    expect(filings.length).toBeGreaterThan(0);
    expect(filings[0].id).not.toBeUndefined();
  });
});
