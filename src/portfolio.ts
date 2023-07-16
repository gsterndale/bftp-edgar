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
};

type AccountRecord = Record & {
  Name: string;
  CIK__c?: string;
};

class Portfolio {
  private static async conn() {
    const conn = new Connection({ loginUrl: URL });
    await conn.login(USERNAME, PASSWORD + SECURITYTOKEN, (err) => {
      if (err) return console.error(err);
    });
    return conn;
  }

  async companies(): Promise<Company[]> {
    let conn = await Portfolio.conn();
    const records =
      ((await conn
        .sobject("Account")
        .find({ Active__c: "Yes" })
        .execute()) as AccountRecord[]) || [];

    return records.map((record) => {
      return {
        name: record.Name,
        cik: record.CIK__c,
      };
    });
  }
}
export { Portfolio };
