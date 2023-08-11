import * as fs from "node:fs";
import { stringify, parse } from "csv/sync"; // For simplicity we're using syncronous APIs
import { EDGAR } from "./src/edgar";

const run = async (inputPath: string, outputPath: string = "filings.csv") => {
  const companyCSVContent = fs.readFileSync(inputPath);
  const companyRows = parse(companyCSVContent, {
    columns: true,
    skip_empty_lines: true,
  });
  const edgar = new EDGAR();
  var filings: Filing[] = [];
  for (const row of companyRows) {
    const company: Company = {
      name: row["Account Name"],
      cik: row["CIK Number"],
    };
    const companyFilings = await edgar.findFilings(company);
    filings.push(...companyFilings);
  }
  const filingCSVContent = stringify(filings, {
    header: true,
    quoted: true,
    columns: [
      { key: "cik", header: "CIK Number" },
      { key: "number", header: "File number" },
      { key: "date", header: "Filing date" },
      { key: "form", header: "Filing type" },
    ],
  });
  fs.writeFileSync(outputPath, filingCSVContent);
};

if (process.argv.length < 3) throw new Error("No CSV file specified.");
run(process.argv[2], process.argv[3]);
