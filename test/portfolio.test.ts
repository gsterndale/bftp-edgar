import { describe, expect, test } from "@jest/globals";
import { sobject, Record } from "./fauxforce";
import { Portfolio } from "../src/portfolio";

describe("companies", () => {
  let portfolio: Portfolio;
  let account: Record;

  beforeEach(() => {
    portfolio = new Portfolio();
    account = {
      Id: "123",
      Name: "Acme Inc",
      CIK__c: "0",
      Active__c: "Yes",
      Filings__r: { records: [], totalSize: 0 },
    };
    sobject["Account"].records = [account];
  });

  test("is not empty", async () => {
    expect.assertions(2);
    const companies = await portfolio.companies();
    expect(companies.length).toBeGreaterThan(0);
    expect(companies[0].name).toBe(account.Name);
  });
});

describe("addCompanyFilings", () => {
  let portfolio: Portfolio;

  beforeEach(() => {
    sobject["Filing__c"].result = {
      success: true,
      id: "xyz123",
    };
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

describe("validate SalesForce Object & Field schema", () => {
  let portfolio: Portfolio;
  beforeEach(() => {
    sobject["Account"].fields = [
      {
        name: "Active__c",
        type: "picklist",
        label: "Active",
        nameField: false,
        custom: true,
        picklistValues: [{ value: "Yes", active: true, defaultValue: true }],
      },
      {
        name: "CIK__c",
        type: "string",
        label: "CIK",
        nameField: false,
        custom: true,
      },
    ];
    sobject["Filing__c"].fields = [
      {
        name: "Name",
        type: "string",
        label: "Name",
        nameField: true,
        custom: false,
      },
      {
        name: "Account__c",
        type: "reference",
        label: "Account",
        nameField: false,
        custom: true,
        relationshipName: "Account__r",
      },
      {
        name: "Form__c",
        type: "string",
        label: "Form",
        nameField: false,
        custom: true,
      },
      {
        name: "Date__c",
        type: "date",
        label: "Date",
        nameField: false,
        custom: true,
      },
    ];
    portfolio = new Portfolio();
  });
  test("should be truthy", async () => {
    const success = await portfolio.validateSchema();
    expect(success).toBeTruthy();
  });
});
