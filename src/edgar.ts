import { XMLParser } from "fast-xml-parser";
import Bottleneck from "bottleneck";

const UA = process.env.EDGAR_UA || "";

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

class EDGAR {
  static rateLimit: number = parseFloat(process.env.EDGAR_RATE_LIMIT ?? "10"); // requests per second
  static limiter = new Bottleneck({
    minTime: (1.0 / this.rateLimit) * 1000, // ms
  });

  async findFilings(company: Company): Promise<Filing[]> {
    return EDGAR.fetchFilingsByCIK(company.cik);
  }

  static async fetchFilingsByCIK(cik: string): Promise<Filing[]> {
    return EDGAR.fetchSubmissions(cik).then((submissions) => {
      return submissions.filings.recent.filingDate.reduce(
        (memo: Filing[], date: string, index: number) => {
          const filing: Filing = {
            cik: cik,
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

  private static fetchOptions = {
    headers: { "User-Agent": UA },
  };

  private static async fetchSubmissions(cik: string): Promise<Submissions> {
    if (!cik) throw new Error(`${cik} CIK`);
    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    return this.request(url).then(
      (response) => response.json() as Promise<Submissions>
    );
  }

  private static async request(
    url: string,
    options = this.fetchOptions
  ): Promise<Response> {
    console.log({ url, options });
    return this.limiter
      .schedule(() => fetch(url, options))
      .then((response) => {
        if (!response.ok) return Promise.reject(response);
        console.log({ response });
        return response;
      })
      .catch((response) => {
        response.text().then((body: string) => {
          const message = [
            url,
            response.status,
            response.statusText,
            body,
          ].join("\n");
          console.warn(message);
        });
        return Promise.reject(response);
      });
  }
}
export { EDGAR };
