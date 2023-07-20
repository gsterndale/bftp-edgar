import { Condition } from "aws-lambda";
import { Connection, Record } from "jsforce";

// SalesForce assumptions:
// Custom CIK text field on Account
// Custom Active text field on Account with value "Yes"
// Security token generated for the user authenticating
// Custom Object created for Filing with the following required fields:
//   - File Number, text
//   - Account, Master-Detail Relationship
//   - Form, picklist with values D, D/A
//   - Date, date
// The following SalesForce info is stored in ENV vars:
const SECURITYTOKEN = process.env.SF_SECURITY_TOKEN || "";
const USERNAME = process.env.SF_USERNAME || "";
const PASSWORD = process.env.SF_PASSWORD || "";
const URL = process.env.SF_URL || "";

type Company = {
  name: string;
  cik?: string;
  active?: string;
  filings: Filing[];
};

type Filing = {
  type: string; // Form Type e.g. D or D/A
  date: string; // YYYY-MM-DD e.g. 2022-02-16
  number: string; // Unique SEC Filing Number
};

type FilingRecord = {
  Form__c: string; // Form Type e.g. D or D/A
  Date__c: string; // YYYY-MM-DD e.g. 2022-02-16
  Name: string; // Unique SEC Filing Number
};

type Relationship = {
  totalSize: number;
  records: Record[];
};

type AccountRecord = {
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

  private async authenticatedConn() {
    await this.conn.login(USERNAME, PASSWORD + SECURITYTOKEN, (err) => {
      if (err) return console.error(err);
    });
    return this.conn;
  }

  private async query(sobject: string, soql: SOQL): Promise<Record[]> {
    let conn = await this.authenticatedConn();
    const query = conn.sobject(sobject).find(soql).include("Filings__r"); // include child relationship records in query result.
    const records = await query.execute();
    return records || [];
  }

  private static accountToCompany(record: AccountRecord): Company {
    const filings = (record.Filings__r || { records: [] })
      .records as FilingRecord[];
    const temp = {
      name: record.Name,
      cik: record.CIK__c,
      active: record.Active__c,
      filings: filings.map((record) => this.filingRecordToFiling(record)),
    };

    return temp;
  }

  private static filingRecordToFiling(record: FilingRecord): Filing {
    return {
      form: record.Form__c,
      date: record.Date__c,
      number: record.Name,
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
