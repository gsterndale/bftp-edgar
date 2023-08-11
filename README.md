# SEC filing sync

This project reads a CSV of company info and writes a CSV with SEC filings.

## Implementation

Run a script is run that will:

1. read a list of companies with their [CIK](https://www.sec.gov/page/edgar-how-do-i-look-central-index-key-cik-number)
2. query the SEC [EDGAR](https://www.sec.gov/filings/edgar-guide) API for filings
3. create new CSV with rows for each filng

## Assumptions

SEC company CIKs are unique.

The combination of Filing form type (e.g. "D"), date, and accession number is unique, at least for a given company.

This project respects the SEC EDGAR API [rate limiting and access requirements](https://www.sec.gov/os/webmaster-faq#code-support) including the specified "User Agent" in HTTP requests.

The SEC EDGAR API doesn't change!

## CSV setup

For this project to work, please perform the following steps:

1. Create a new spreadsheet
1. Format all cells as Plain Text
1. Create the header rows below
1. Add a row for every company you wish to find filings for
1. Export a CSV

### Companies:

| Account ID | Account Name | Legal Name | CIK Number |
| ---------- | ------------ | ---------- | ---------- |

The script will export a CSV with the following format:

### Filings:

| CIK Number | File number | Filing date | Filing type |
| ---------- | ----------- | ----------- | ----------- |

#### Working with CIK Numbers

CIK Numbers can have leading 0s, e.g. 0001652044. In order to retain them in your spreadsheets those columns will need to be formatted as text.

If you'd like to use a filing CSV in Excel, import the data into a new spreadsheet, don't open the CSV file. While importing, make sure the column data format for the CIK column is "text".

If you'd like to use a filing CSV in Google Sheets, import the data into a new spreadsheet, don't open the CSV file. While importing, make sure to uncheck the box saying "convert text to numbers...".

## Running the script

This project is designed to run locally, not in the cloud. You can invoke the script with the following command:

```bash
npm run filings /path/to/your/companies.csv
```

You can also specify the file you'd like the filings saved to:

```bash
npm run filings /path/to/your/companies.csv /path/to/your/filings.csv
```

## Developer setup

### Tooling

This project makes use of:

- [TypeScript](https://www.typescriptlang.org) to provide static typing for [JavaScript](https://en.wikipedia.org/wiki/JavaScript)
- [Node.js](https://nodejs.org) JavaScript runtime environment
- [Jest](https://jestjs.io) for unit testing
- [asdf](https://asdf-vm.com) for tool version management
- [direnv](https://direnv.net) to load ENV variables based on the current directory

### Install

Clone this repo and run the following:

```bash
asdf install
npm install
```

Secrets are stored as ENV variables and should **not** be committed to this repository. An `.envrc.example` file _is_ committed, and can be used as a template and copied.

```bash
cp .envrc.example .envrc
```

Using your text editor, edit it, changing the proper values including:

- SEC EDGAR User Agent e.g. "Acme Inc. jane@acme.com"

```bash
open .envrc
```

Any time you update `.envrc` you'll need to tell `direnv` that the changes you made are safe.

```bash
direnv allow .
```

### Test

```bash
npm run test
```
