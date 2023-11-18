import express, { Request, Response } from "express";
import { EDGAR } from "./src/edgar";

const app = express();
const edgar = new EDGAR();

app.get("/filings", async (req: Request, res: Response) => {
  const cik = req.query.cik as string;
  if (!cik) {
    return res.status(400).json({ error: "Missing CIK parameter" });
  }

  try {
    const company: Company = {
      name: "", // You can provide a company name if available
      cik: cik,
    };
    const companyFilings: Filing[] = await edgar.findFilings(company);
    return res.json({ filings: companyFilings });
  } catch (error: Response | any) {
    let json: { status: number; statusText: string } = {
      status: 500,
      statusText: "Internal Server Error",
    };

    if (error instanceof Response) {
      json.status = error.status;
      json.statusText = error.statusText;
    } else {
      console.error(error);
    }

    return res.status(json.status).json(json);
  }
});

app.get("/healthz", (req: Request, res: Response) => {
  return res.sendStatus(200);
});

const port = parseFloat(process.env.PORT ?? "3000");
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
