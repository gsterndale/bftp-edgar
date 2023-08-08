import { google } from "googleapis";

const GOOGLE_SERVICE_ACCOUNT_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY =
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

type FilingMap = {
  [key: string]: Filing[];
};

type Row = any[];

class Portfolio {
  async companies(): Promise<Company[]> {
    const companyRows = await this.getRows("Companies!A2:D");
    const filingRows = await this.getRows("Filings!A2:D");
    const filingsByCIK = filingRows.reduce((memo, filingRow, index) => {
      const cik = filingRow[0] as string;
      if (memo[cik] === undefined) memo[cik] = [];
      memo[cik].push(this.rowToFiling(filingRow, index + 2)); // adding two because of header row and 1-indexed
      return memo;
    }, {} as FilingMap);
    const companies: Company[] = companyRows.map((row, index) => {
      const cik = row[3] as string;
      const filings = filingsByCIK[cik] || [];
      const name = row[2] as string;
      return { id: index + 2, name: name, cik: cik, filings: filings };
    });
    return companies;
  }

  async addFilings(filings: Filing[]): Promise<Filing[]> {
    const rows = filings.map((filing: Filing) => this.filingToRow(filing));
    const updatedRows = await this.appendRows("Filings!A2:D", rows);
    const updatedFilings = updatedRows.map((row: any[]) => {
      return this.rowToFiling(row);
    });
    return updatedFilings;
  }
  async addCompanyCIK(company: Company, cik: string) {
    this.updateRows(`Companies!D${company.id}:D`, [[cik]]);
  }

  private async updateRows(range: string, rows: Row[]) {
    this.sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      includeValuesInResponse: true,
      requestBody: {
        values: rows,
      },
    });
  }

  private async appendRows(range: string, rows: Row[]) {
    if (rows.length === 0) return [];
    return this.sheets.spreadsheets.values
      .append({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: range,
        valueInputOption: "USER_ENTERED",
        includeValuesInResponse: true,
        requestBody: {
          values: rows,
        },
      })
      .then((resp) => {
        return resp.data.updates?.updatedData?.values || [];
      })
      .catch((reason) => {
        throw new Error(reason);
      });
  }

  private async getRows(range: string) {
    return this.sheets.spreadsheets.values
      .get({
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        range: range,
      })
      .then((res) => {
        return res.data.values || [];
      })
      .catch((reason) => {
        throw new Error(reason);
      });
  }

  private client = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  private sheets = google.sheets({
    version: "v4",
    auth: this.client,
  });

  private filingToRow(filing: Filing): Row {
    return [filing.cik, filing.number, filing.date, filing.form];
  }

  private rowToFiling(row: Row, index?: number): Filing {
    return {
      id: index,
      cik: row[0],
      number: row[1],
      date: row[2],
      form: row[3],
    };
  }
}
export { Portfolio };
