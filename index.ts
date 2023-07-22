import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { EDGAR } from "./src/edgar";
import { Portfolio } from "./src/portfolio";

const findCIKs = async (event: APIGatewayProxyEvent, context: Context) => {
  const portfolio = new Portfolio();
  const companies = await portfolio.companies({ active: true, cik: null });
  console.log(companies);
};

const findFilings = async (event: APIGatewayProxyEvent, context: Context) => {
  const portfolio = new Portfolio();
  const companies = await portfolio.companies({ active: true });
  //companies = companies.filter((company) => company.name === "HeyKiddo");
  const edgar = new EDGAR();
  Promise.all(
    companies.map((company) =>
      edgar.findNewFilings(company).then((newFilings) => {
        portfolio
          .addCompanyFilings(company, newFilings)
          .then((addedFilings) => {
            console.log({ [company.name]: addedFilings });
          });
      })
    )
  );
};

export { findFilings, findCIKs };
