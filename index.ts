import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { findRecentFilingDates, findCIK } from "./src/edgar";

const run = async (event: APIGatewayProxyEvent, context: Context) => {
  const time = new Date();
  console.log(
    `typescript cron function "${context.functionName}" ran at ${time}`
  );
};

const findFilings = async (event: APIGatewayProxyEvent, context: Context) => {
  const companies = [
    { name: "HeyKiddo", cik: "0001978342" },
    { name: "HeyKiddo" },
    { name: "OnTheGoga" },
    { name: "Roar for good", cik: "0001643039" },
  ];
  const dates = companies.map((company) => findRecentFilingDates(company));

  Promise.all(dates).then((values) => {
    console.log({ dates: values });
  });
};

export { findFilings, run };
