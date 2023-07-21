import { XMLParser } from "fast-xml-parser";

const UA = process.env.EDGAR_UA || "";

type SearchCriteria = {
  name?: string;
  cik?: string;
  form?: string;
  date?: Date;
};

type Submissions = {
  cik: string;
  name: string;
  filings: {
    recent: {
      filingDate: string[];
      form: string[];
      accessionNumber: string[];
    };
  };
};

type Entry = {
  content: {
    "filing-date": string;
    "filing-type": string;
    "accession-number": string;
  };
};

type CompanyResponse = {
  feed: {
    "company-info": {
      cik: string;
    };
    entry: Entry | Entry[];
  };
};

class EDGAR {
  async findNewFilings(company: Company): Promise<Filing[]> {
    let filings: Filing[] = [];
    if (!company.cik || company.cik === "") {
      filings = await EDGAR.fetchFilingsByName(company.name);
    } else if (company.cik) {
      filings = await EDGAR.fetchFilingsByCIK(company.cik);
    } else {
      throw new Error(`No CIK provided for ${company.name}`);
    }

    const existingStrings = company.filings.map((filing) =>
      EDGAR.filingString(filing)
    );
    return filings.filter(
      (found) => !existingStrings.includes(EDGAR.filingString(found))
    );
  }

  private static filingString(filing: Filing) {
    return `${filing.form}-${filing.date}-${filing.number}`;
  }

  private static async fetchFilingsByCIK(cik: string): Promise<Filing[]> {
    return EDGAR.fetchSubmissions(cik).then((submissions) => {
      return submissions.filings.recent.filingDate.reduce(
        (memo: Filing[], date: string, index: number) => {
          const filing: Filing = {
            date: date,
            form: submissions.filings.recent.form[index],
            number: submissions.filings.recent.accessionNumber[index],
          };
          memo.push(filing);
          return memo;
        },
        []
      );
    });
  }

  private static async fetchFilingsByName(name: string): Promise<Filing[]> {
    return this.fetchEntriesByName(name).then((entries) =>
      entries.reduce((memo: Filing[], entry) => {
        if (entry && entry.content && entry.content["filing-date"]) {
          const filing: Filing = {
            form: entry.content["filing-type"],
            date: entry.content["filing-date"],
            number: entry.content["accession-number"],
          };
          memo.push(filing);
        }
        return memo;
      }, [])
    );
  }

  async findRecentFilingDates(
    criteria: SearchCriteria = { date: new Date() }
  ): Promise<string[]> {
    if (criteria.cik == undefined && criteria.name) {
      return EDGAR.fetchEntriesByName(criteria.name).then((entries) =>
        entries.reduce((memo: string[], entry) => {
          if (entry && entry.content && entry.content["filing-date"])
            memo.push(entry.content["filing-date"]);
          return memo;
        }, [])
      );
    } else if (criteria.cik) {
      return EDGAR.fetchSubmissions(criteria.cik).then(
        (submissions) => submissions.filings.recent.filingDate
      );
    } else {
      throw new Error("No CIK provided");
    }
  }

  async findCIK(name: string) {
    return this.fetchCIKByName(name);
  }

  private static async fetchSubmissions(cik: string): Promise<Submissions> {
    if (!cik) throw new Error(`${cik} CIK`);
    const URL = `https://data.sec.gov/submissions/CIK${cik}.json`;
    const response = await fetch(URL, {
      headers: { "User-Agent": UA },
    });
    if (!response.ok) throw new Error(response.statusText);
    return await (response.json() as Promise<Submissions>);
  }

  private static async fetchCompanyByName(name: string): Promise<string> {
    const URL = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${name}&type=&dateb=&owner=include&start=0&count=40&output=atom`;
    const response = await fetch(URL, {
      headers: { "User-Agent": UA },
    });
    if (!response.ok) throw new Error(response.statusText);
    return await (response.text() as Promise<string>);
  }

  private static async fetchCompanyResponse(name: string) {
    const parser = new XMLParser({ parseTagValue: false });
    return EDGAR.fetchCompanyByName(name).then((xmlString) => {
      return parser.parse(xmlString) as CompanyResponse;
    });
  }

  private async fetchCIKByName(name: string): Promise<string> {
    return EDGAR.fetchCompanyResponse(name).then((response) => {
      return response.feed["company-info"].cik;
    });
  }

  private static async fetchEntriesByName(name: string): Promise<Entry[]> {
    return EDGAR.fetchCompanyResponse(name).then((response) => {
      return [response.feed.entry].flat();
    });
  }
}
export { EDGAR };
