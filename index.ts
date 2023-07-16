import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { EDGAR } from "./src/edgar";
import { Portfolio } from "./src/portfolio";

const run = async (event: APIGatewayProxyEvent, context: Context) => {
  const time = new Date();
  console.log(
    `typescript cron function "${context.functionName}" ran at ${time}`
  );
};

const findFilings = async (event: APIGatewayProxyEvent, context: Context) => {
  const portfolio = new Portfolio();
  const companies = await portfolio.companies();
  const edgar = new EDGAR();
  const dates = companies.map((company) =>
    edgar.findRecentFilingDates(company).then((dates) => {
      return { name: company.name, dates };
    })
  );

  Promise.all(dates).then((values) => {
    console.log(values);
  });
};

export { findFilings, run };
