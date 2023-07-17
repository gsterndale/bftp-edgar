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
  const dates = companies.map((company) =>
    edgar.findRecentFilingDates(company).then((dates) => {
      // TODO pick a storage mechanism (SalesForce or some AWS data store)
      // DynamoDB? https://github.com/serverless/examples/blob/v3/aws-node-express-dynamodb-api/serverless.yml
      // Query storage for known filing dates
      // Determine if any dates found are unknown
      // if unknown, send an email alert and store them
      // https://www.serverless.com/examples/aws-ses-serverless-example
      return { name: company.name, dates };
    })
  );

  Promise.all(dates).then((values) => {
    console.log(values);
  });
};

export { findFilings, findCIKs };
