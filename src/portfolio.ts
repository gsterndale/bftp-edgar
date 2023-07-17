import { Condition } from "aws-lambda";
import { Connection, Record } from "jsforce";

// SalesForce assumptions:
// Custom CIK text field on Account
// Custom Active text field on Account with value "Yes"
// Security token generated for the user authenticating
// The following SalesForce info is stored in ENV vars:
const SECURITYTOKEN = process.env.SF_SECURITY_TOKEN || "";
const USERNAME = process.env.SF_USERNAME || "";
const PASSWORD = process.env.SF_PASSWORD || "";
const URL = process.env.SF_URL || "";

type Company = {
  name: string;
  cik?: string;
  active?: string;
};

type AccountRecord = Record & {
  Name: string;
  CIK__c?: string;
  Active__c?: "Yes" | "No";
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
    const query = conn.sobject("Account").find(soql);
    const records = await query.execute();
    return records || [];
  }

  private static accountToCompany(account: AccountRecord): Company {
    return {
      name: account.Name,
      cik: account.CIK__c,
      active: account.Active__c,
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
