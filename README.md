# SEC filing API

This HTTP API responds to GET requests to like this `/filings?cik=0001138795` with a JSON object that contains a list of SEC filings like this:

```json
{
  "filings": [
    {
      "cik": "0001138795",
      "date": "2007-02-20",
      "form": "REGDEX/A",
      "number": "9999999997-07-007713"
    },
    {
      "cik": "0001138795",
      "date": "2006-09-11",
      "form": "REGDEX",
      "number": "9999999997-06-038277"
    }
  ]
}
```

## Assumptions

SEC company CIKs are unique.

The combination of Filing form type (e.g. "D"), date, and accession number is unique, at least for a given company.

This project respects the SEC EDGAR API [rate limiting and access requirements](https://www.sec.gov/os/webmaster-faq#code-support) including the specified "User Agent" in HTTP requests.

The SEC EDGAR API doesn't change!

#### Working with CIK Numbers

CIK Numbers can have leading 0s, e.g. 0001652044. Make sure they are included in the CIK specified in your GET request.

## Running the script

This project can be run locally like so:

```bash
npm start
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
