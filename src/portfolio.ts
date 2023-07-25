import { Condition } from "aws-lambda";
import { Connection, Record, RecordResult, SuccessResult } from "jsforce";

// The following SalesForce info is stored in ENV vars:
const SECURITYTOKEN = process.env.SF_SECURITY_TOKEN || "";
const USERNAME = process.env.SF_USERNAME || "";
const PASSWORD = process.env.SF_PASSWORD || "";
const URL = process.env.SF_URL || "";

type FilingRecord = {
  Id?: string;
  Form__c: string; // Form Type e.g. D or D/A
  Date__c: string; // YYYY-MM-DD e.g. 2022-02-16
  Name: string; // Unique SEC Filing Number
  Account__c: string; // AccountRecord ID
};

type Relationship = {
  totalSize: number;
  records: Record[];
};

type AccountRecord = {
  Id?: string;
  Name: string;
  CIK__c?: string;
  Active__c?: "Yes" | "No";
  Filings__r?: Relationship;
};

type Conditions = {
  active?: boolean | null;
  cik?: boolean | null | string;
  name?: boolean | null | string;
};
const defaultConditions: Conditions = { active: true };

type SOQL = {
  Active__c?: string | object | null;
  CIK__c?: string | object | null;
  Name?: string | object | null;
};

class Portfolio {
  private conn = new Connection({ loginUrl: URL });

  async companies(conditions = defaultConditions): Promise<Company[]> {
    const soql = Portfolio.conditionsToSOQL(conditions);
    const accounts = (await this.query("Account", soql)) as AccountRecord[];
    return accounts.map((record) => Portfolio.accountRecordToCompany(record));
  }

  async addCompanyFilings(
    company: Company,
    filings: Filing[]
  ): Promise<Filing[]> {
    return Promise.all(
      filings.map(async (filing) => {
        const result = await this.create(
          "Filing__c",
          Portfolio.filingToFilingRecord(filing, company)
        );
        filing.id = result.id;
        return filing;
      })
    );
  }

  async addCompanyCIK(company: Company, cik: string): Promise<string> {
    const updatedCompany: Company = { ...company, cik: cik };
    const record = Portfolio.companyToAccountRecord(updatedCompany);
    const fields = { Id: record.Id, CIK__c: record.CIK__c };
    await this.update("Account", fields);
    return cik;
  }

  async validateSchema(): Promise<boolean> {
    let conn = await this.authenticatedConn();
    const accountDescription = await conn.sobject("Account").describe((err) => {
      if (err) throw new Error(err.message);
    });
    const accountFields = accountDescription.fields;

    const activeField = accountFields.find((fld) => fld.name === "Active__c");
    if (!activeField) throw new Error("No Active field on Account");
    if (activeField.type !== "picklist")
      throw new Error(
        `Account Active field type is ${activeField.type} not picklist`
      );
    const plvs = activeField.picklistValues || [];
    if (!plvs.map((plv) => plv.value).includes("Yes"))
      throw new Error(
        `Account Active field picklist values do not include "Yes"`
      );

    const cikField = accountFields.find((fld) => fld.name === "CIK__c");
    if (!cikField) throw new Error("No CIK field on Account");
    if (cikField.type !== "string")
      throw new Error(`Account CIK field type is ${cikField.type} not text`);

    if (cikField.length < 10)
      throw new Error(
        `Account CIK field length is ${cikField.length} which is less than 10`
      );

    const filingDescription = await conn
      .sobject("Filing__c")
      .describe((err) => {
        if (err) throw new Error(err.message);
      });
    const filingFields = filingDescription.fields;

    const nameField = filingFields.find((fld) => fld.name === "Name");
    if (!nameField) throw new Error("No Name field on Filing");
    if (!nameField.nameField)
      throw new Error("Filing Name field is not actually the nameField");
    if (nameField.type !== "string")
      throw new Error(`Filing Name field type is ${nameField.type} not text`);

    const accountField = filingFields.find((fld) => fld.name === "Account__c");
    if (!accountField) throw new Error("No Account field on Filing");
    if (accountField.type !== "reference")
      throw new Error(
        `Filing Account field type is ${accountField.type} not Master-Detail Relationship`
      );
    if (accountField.relationshipName !== "Account__r")
      throw new Error(
        `Filing Account field relationshipName is ${accountField.relationshipName} not Account__r`
      );

    const formField = filingFields.find((fld) => fld.name === "Form__c");
    if (!formField) throw new Error("No Form field on Filing");
    if (formField.type !== "string")
      throw new Error(`Filing Form field type is ${formField.type} not text`);

    const dateField = filingFields.find((fld) => fld.name === "Date__c");
    if (!dateField) throw new Error("No Date field on Filing");
    if (dateField.type !== "date")
      throw new Error(`Filing Date field type is ${dateField.type} not date`);

    return true;
  }

  private async update(
    sobject: string,
    fields: Record
  ): Promise<SuccessResult> {
    let conn = await this.authenticatedConn();
    if (!fields.Id) throw new Error(`Id required to update ${sobject}`);
    const result = await conn.sobject(sobject).update(fields, (err) => {
      if (err) throw new Error(err.message);
    });
    if (result.success && result.id !== undefined) {
      return result;
    } else {
      throw new Error("Error updating object");
    }
  }

  private async create(
    sobject: string,
    fields: object
  ): Promise<SuccessResult> {
    let conn = await this.authenticatedConn();
    const result = await conn.sobject(sobject).create(fields, (err) => {
      if (err) throw new Error(err.message);
    });
    if (result.success && result.id !== undefined) {
      return result;
    } else {
      throw new Error("Error creating object");
    }
  }

  private async authenticatedConn() {
    await this.conn.login(USERNAME, PASSWORD + SECURITYTOKEN, (err) => {
      if (err) throw new Error(err.message);
    });
    return this.conn;
  }

  private async query(sobject: string, soql: SOQL): Promise<Record[]> {
    let conn = await this.authenticatedConn();
    const query = conn.sobject(sobject).find(soql).include("Filings__r"); // include child relationship records in query result.
    const records = await query.execute(undefined, (err) => {
      if (err) throw new Error(err.message);
    });
    return records || [];
  }

  private static accountRecordToCompany(record: AccountRecord): Company {
    const filingRecords = (record.Filings__r || { records: [] })
      .records as FilingRecord[];
    return {
      id: record.Id,
      name: record.Name,
      cik: record.CIK__c,
      active: record.Active__c,
      filings: filingRecords.map((record) => this.filingRecordToFiling(record)),
    };
  }

  private static companyToAccountRecord(company: Company): AccountRecord {
    return {
      Id: company.id,
      Name: company.name,
      CIK__c: company.cik,
      Active__c: company.active as "Yes" | "No" | undefined,
    };
  }

  private static filingRecordToFiling(record: FilingRecord): Filing {
    return {
      id: record.Id,
      form: record.Form__c,
      date: record.Date__c,
      number: record.Name,
    };
  }

  private static filingToFilingRecord(
    filing: Filing,
    company: Company
  ): FilingRecord {
    if (company.id === undefined)
      throw new Error(`Company ${company.name} has no ID`);
    return {
      Id: filing.id,
      Name: filing.number,
      Form__c: filing.form,
      Date__c: filing.date,
      Account__c: company.id,
    };
  }

  private static conditionsToSOQL(conditions: Conditions): SOQL {
    var soql: SOQL = {};
    soql.Active__c = (() => {
      switch (conditions.active) {
        case true:
          return "Yes";
        case false:
          return "No";
        case null:
          return null;
      }
    })();

    soql.CIK__c = (() => {
      switch (conditions.cik) {
        case true:
          return { $ne: null };
        case false:
          return null;
        case null:
          return null;
        default:
          return conditions.cik;
      }
    })();

    soql.Name = (() => {
      switch (conditions.name) {
        case true:
          return { $ne: null };
        case false:
          return null;
        case null:
          return null;
        default:
          return conditions.name;
      }
    })();

    return soql;
  }
}

export { Portfolio };
