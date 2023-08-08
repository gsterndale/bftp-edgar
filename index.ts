import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { EDGAR } from "./src/edgar";
import { Portfolio } from "./src/portfolio";

const edgar = new EDGAR();
const portfolio = new Portfolio();

const findCIKs = async (event: APIGatewayProxyEvent, context: Context) => {
  var companies = await portfolio.companies();
  companies = companies.filter((company) => company.cik === undefined);
  Promise.all(
    companies.map((company) => {
      edgar.findCIK(company.name).then((cik) => {
        console.log({ [company.name]: cik });
        if (!cik) return;
        portfolio.addCompanyCIK(company, cik);
      });
    })
  );
};

const findFilings = async (event: APIGatewayProxyEvent, context: Context) => {
  var companies = await portfolio.companies();
  companies = companies.filter((company) => company.cik !== undefined);
  const filingsForCompany = await Promise.all(
    companies.map((company) =>
      edgar.findNewFilings(company).then((filings) => {
        console.log({ [company.name]: filings });
        return filings;
      })
    )
  );
  const added = await portfolio.addFilings(filingsForCompany.flat());
  console.log({ added });
};

export { findFilings, findCIKs };
