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
    return accounts.map((record) => Portfolio.accountToCompany(record));
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
    const records = await query.execute(undefined, (err, records) => {
      if (err) throw new Error(err.message);
      return records;
    });
    return records || [];
  }

  private static accountToCompany(record: AccountRecord): Company {
    const filings = (record.Filings__r || { records: [] })
      .records as FilingRecord[];
    return {
      id: record.Id,
      name: record.Name,
      cik: record.CIK__c,
      active: record.Active__c,
      filings: filings.map((record) => this.filingRecordToFiling(record)),
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
