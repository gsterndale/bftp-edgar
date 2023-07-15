import { XMLParser } from "fast-xml-parser";

const UA = "Ben Franklin Technology Partners rick.genzer@sep.benfranklin.org";

type SearchCriteria = {
  name?: string;
  cik?: string;
  form?: string;
  date?: Date;
};

type TSubmissions = {
  cik: string;
  name: string;
  filings: {
    recent: {
      filingDate: string[];
      form: string[];
    };
  };
};

type TEntry = {
  content: {
    "filing-date": string;
    "filing-type": string;
  };
};

type TCompanyResponse = {
  feed: {
    "company-info": {
      cik: string;
    };
    entry: TEntry | TEntry[];
  };
};

const fetchSubmissions = async (cik: string): Promise<TSubmissions> => {
  if (!cik) throw new Error(`${cik} CIK`);
  const URL = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const response = await fetch(URL, {
    headers: { "User-Agent": UA },
  });
  if (!response.ok) throw new Error(response.statusText);
  return await (response.json() as Promise<TSubmissions>);
};

const fetchCompanyByName = async (name: string): Promise<string> => {
  const URL = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${name}&type=&dateb=&owner=include&start=0&count=40&output=atom`;
  const response = await fetch(URL, {
    headers: { "User-Agent": UA },
  });
  if (!response.ok) throw new Error(response.statusText);
  return await (response.text() as Promise<string>);
};

const fetchCompanyResponse = async (name: string) => {
  const parser = new XMLParser({ parseTagValue: false });
  return fetchCompanyByName(name).then((xmlString) => {
    return parser.parse(xmlString) as TCompanyResponse;
  });
};

const fetchCIKByName = async (name: string): Promise<string> => {
  return fetchCompanyResponse(name).then((response) => {
    return response.feed["company-info"].cik;
  });
};

const fetchEntriesByName = async (name: string): Promise<TEntry[]> => {
  return fetchCompanyResponse(name).then((response) => {
    return [response.feed.entry].flat();
  });
};

const findRecentFilingDates = async (
  criteria: SearchCriteria = { date: new Date() }
): Promise<string[]> => {
  if (criteria.cik == undefined && criteria.name) {
    return fetchEntriesByName(criteria.name).then((entries) =>
      entries.reduce((memo: string[], entry) => {
        if (entry && entry.content && entry.content["filing-date"])
          memo.push(entry.content["filing-date"]);
        return memo;
      }, [])
    );
  } else if (criteria.cik) {
    return fetchSubmissions(criteria.cik).then(
      (submissions) => submissions.filings.recent.filingDate
    );
  } else {
    throw new Error("No CIK provided");
  }
};

const findCIK = async (name: string) => {
  return fetchCIKByName(name);
};

export { findRecentFilingDates, findCIK };
