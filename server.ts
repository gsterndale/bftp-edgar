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
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const port = 3000; // Change this to the desired port number
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
