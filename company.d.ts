type Company = {
  id?: string;
  name: string;
  cik?: string;
  active?: string;
  filings: Filing[];
};

type Filing = {
  id?: string;
  form: string; // Form Type e.g. D or D/A
  date: string; // YYYY-MM-DD e.g. 2022-02-16
  number: string; // Unique SEC Filing Number
};
