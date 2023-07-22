import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { EDGAR } from "./src/edgar";
import { Portfolio } from "./src/portfolio";

const edgar = new EDGAR();
const portfolio = new Portfolio();

const findCIKs = async (event: APIGatewayProxyEvent, context: Context) => {
  const companies = await portfolio.companies({ active: true, cik: null });
  Promise.all(
    companies.map((company) => {
      edgar.findCIK(company.name).then((cik) => {
        if (!cik) return;
        portfolio.addCompanyCIK(company, cik).then(() => {
          console.log({ [company.name]: cik });
        });
      });
    })
  );
};

const findFilings = async (event: APIGatewayProxyEvent, context: Context) => {
  const companies = await portfolio.companies({ active: true });
  // .filter((company) => company.name === "Salesforce, Inc.");
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
