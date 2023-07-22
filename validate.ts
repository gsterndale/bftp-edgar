import { Portfolio } from "./src/portfolio";

const portfolio = new Portfolio();

console.log("Checking SalesForce objects and fields...");
portfolio
  .validateSchema()
  .then(() => {
    console.log("All good!");
    process.exit();
  })
  .catch((reason: Error) => {
    console.log("Uh-oh!");
    console.log(reason.message);
    console.log("Check the README for more detail.");
    process.exit(1);
  });
