import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { EDGAR } from "./src/edgar";
import { Portfolio } from "./src/portfolio";

const findCIKs = async (event: APIGatewayProxyEvent, context: Context) => {
  const portfolio = new Portfolio();
  const companies = await portfolio.companies({ active: true, cik: null });
  console.log(companies);

  // If any are found, send an email alert with the suggested CIK(s)
};

const findFilings = async (event: APIGatewayProxyEvent, context: Context) => {
  const portfolio = new Portfolio();
  const companies = await portfolio.companies({ active: true });
  const edgar = new EDGAR();
  companies.map((company) =>
    edgar.findNewFilings(company).then((filings) => {
      // Send an email alert and store them in SF
      // https://www.serverless.com/examples/aws-ses-serverless-example
      console.log({ [company.name]: filings });
    })
  );
};

export { findFilings, findCIKs };
