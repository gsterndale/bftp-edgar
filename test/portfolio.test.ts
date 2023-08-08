import { describe, expect, test } from "@jest/globals";
import { Portfolio } from "../src/portfolio";

describe("companies", () => {
  let portfolio: Portfolio;

  beforeEach(() => {
    portfolio = new Portfolio();
  });

  test("is not empty", async () => {
    const companies = await portfolio.companies();
    expect(companies.length).toBeGreaterThan(0);
  });
});

describe("addCompanyFilings", () => {
  let portfolio: Portfolio;

  beforeEach(() => {
    portfolio = new Portfolio();
  });

  test("adds new filing records", async () => {
    let randomNumber = `123-${new Date().getTime()}`;
    let newFilings: Filing[] = [
      {
        number: randomNumber,
        form: "D",
        date: "2000-01-01",
      },
    ];

    expect.assertions(2);
    const filings = await portfolio.addFilings(newFilings);
    expect(filings.length).toBeGreaterThan(0);
    expect(filings[0].number).toEqual(randomNumber);
  });
});
