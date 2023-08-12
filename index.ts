import * as fs from "node:fs";
import * as path from "path";
import * as os from "os";
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
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${filings.length} filings found.`);
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
  process.stdout.write(`\nWritten to ${outputPath}\n`);
};

let inputPath: string;
const inputPathOrCIK = process.argv[2];
if (inputPathOrCIK === undefined)
  throw new Error("No CSV file or CIK specified.");
const exists = fs.existsSync(inputPathOrCIK);
if (exists) {
  inputPath = inputPathOrCIK;
} else {
  const companyCSVContent = stringify(
    [["CIK Number"]].concat(inputPathOrCIK.split(",").map((cik) => [cik]))
  );
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "EDGAR"));
  inputPath = path.join(tmpDir, "companies.csv");
  console.log(`Writing CIK(s) to ${inputPath}`);
  fs.writeFileSync(inputPath, companyCSVContent);
}
const outputPath = process.argv[3]; // may be undefined
run(inputPath, outputPath);
