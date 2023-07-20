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
    };
  };
};

type Entry = {
  content: {
    "filing-date": string;
    "filing-type": string;
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
  async fetchSubmissions(cik: string): Promise<Submissions> {
    if (!cik) throw new Error(`${cik} CIK`);
    const URL = `https://data.sec.gov/submissions/CIK${cik}.json`;
    const response = await fetch(URL, {
      headers: { "User-Agent": UA },
    });
    if (!response.ok) throw new Error(response.statusText);
    return await (response.json() as Promise<Submissions>);
  }

  async fetchCompanyByName(name: string): Promise<string> {
    const URL = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${name}&type=&dateb=&owner=include&start=0&count=40&output=atom`;
    const response = await fetch(URL, {
      headers: { "User-Agent": UA },
    });
    if (!response.ok) throw new Error(response.statusText);
    return await (response.text() as Promise<string>);
  }

  async fetchCompanyResponse(name: string) {
    const parser = new XMLParser({ parseTagValue: false });
    return this.fetchCompanyByName(name).then((xmlString) => {
      return parser.parse(xmlString) as CompanyResponse;
    });
  }

  async fetchCIKByName(name: string): Promise<string> {
    return this.fetchCompanyResponse(name).then((response) => {
      return response.feed["company-info"].cik;
    });
  }

  async fetchEntriesByName(name: string): Promise<Entry[]> {
    return this.fetchCompanyResponse(name).then((response) => {
      return [response.feed.entry].flat();
    });
  }

  async findRecentFilingDates(
    criteria: SearchCriteria = { date: new Date() }
  ): Promise<string[]> {
    if (criteria.cik == undefined && criteria.name) {
      return this.fetchEntriesByName(criteria.name).then((entries) =>
        entries.reduce((memo: string[], entry) => {
          if (entry && entry.content && entry.content["filing-date"])
            memo.push(entry.content["filing-date"]);
          return memo;
        }, [])
      );
    } else if (criteria.cik) {
      return this.fetchSubmissions(criteria.cik).then(
        (submissions) => submissions.filings.recent.filingDate
      );
    } else {
      throw new Error("No CIK provided");
    }
  }

  async findCIK(name: string) {
    return this.fetchCIKByName(name);
  }
}
export { EDGAR };
