# SEC filing sync

This project helps keep a Google Sheet up-to-date with SEC filings.

## Implementation

On a regular schedule (daily) a script is run that will:

1. pull a list of companies that have a [CIK](https://www.sec.gov/page/edgar-how-do-i-look-central-index-key-cik-number) specified
2. query the SEC [EDGAR](https://www.sec.gov/filings/edgar-guide) API for filings
3. create new Filing rows associated with the proper CIK

Also on a regular schedule (30 days) a script is run that will:

1. pull a list of companies _without_ a [CIK](https://www.sec.gov/page/edgar-how-do-i-look-central-index-key-cik-number) specified
2. query the SEC [EDGAR](https://www.sec.gov/filings/edgar-guide) API by company name
3. update the company rows with the likely CIK if found.

## Assumptions

SEC company CIKs are unique.

The combination of Filing form type (e.g. "D"), date, and accession number is unique, at least for a given company.

This project respects the SEC EDGAR API [rate limiting and access requirements](https://www.sec.gov/os/webmaster-faq#code-support) including the specified "User Agent" in HTTP requests.

The SEC EDGAR and Google APIs don't change!

## Google Sheets setup

For this project to work, please perform the following steps:

1. Create a new Google Sheet with "Companies" and "Filings" sheets
1. Format all cells as Plain Text
1. Create the header rows below

### Companies:

| Account ID | Account Name | Legal Name | CIK Number |
| ---------- | ------------ | ---------- | ---------- |

### Filings:

| CIK Number | File number | Filing date | Filing type |
| ---------- | ----------- | ----------- | ----------- |

## Developer setup

### Tooling

This project makes use of:

- [TypeScript](https://www.typescriptlang.org) to provide static typing for [JavaScript](https://en.wikipedia.org/wiki/JavaScript)
- [Node.js](https://nodejs.org) JavaScript runtime environment
- [Jest](https://jestjs.io) for unit testing
- [asdf](https://asdf-vm.com) for tool version management
- [direnv](https://direnv.net) to load ENV variables based on the current directory
- [Serverless Framework](https://www.serverless.com) to deploy on [AWS Lambda](https://aws.amazon.com/lambda/).

### Install

Clone this repo and run the following:

```bash
asdf install
npm install
cp .envrc.example .envrc
vim .envrc
direnv allow .
```

### Authentication

In order to authenticate with Google:

1. In the Google Cloud Platform (GCP) [Dashboard](https://console.cloud.google.com/home/dashboard) Create a new Google Cloud Project.
1. Enable it.
1. [Create a Service Account](https://console.cloud.google.com/projectselector2/iam-admin/serviceaccounts?supportedpurview=project) for the Project.
1. Create a new private key for the Service Account using key type "JSON".
1. This will download a .json file locally. Don't commit it to a shared repository.
1. Copy the "client email address" generated for the Service Account (found in .json file).
1. In your Google sheet, grant editor access to the client email address.
1. Copy & paste the spreadsheet ID found in the URL of the sheet into your .envrc
1. Copy & paste the email and private key from the .json file into your .envrc file.
   Note that because the private key includes newline characters, you'll need to wrap it like so $'YOUR PRIVATE KEY HERE'.
   See below...

Secrets are stored as ENV variables and should **not** be committed to this repository. An `.envrc.example` file _is_ committed, and can be used as a template and copied then updated with the proper values including:

- Google spreadsheet ID
- Google service account email
- Google service account private key
- SEC EDGAR User Agent e.g. "Acme Inc. jane@acme.com"

```bash
cp .envrc.example .envrc
```

Any time you update `.envrc` you'll need to tell `direnv` that the changes you made are safe.

```bash
direnv allow .
```

### Deployment

This project works with the [Serverless Framework](https://www.serverless.com/) to deploy on AWS Lambda.

Serverless configuration lives in `serverless.yml`. The `org` is specified there and should be changed to reflect your org.

In order to deploy, you need to first login with:

```bash
serverless login
```

Perform deployment with:

```bash
serverless deploy
```

Note that this command will use the ENV variables configured in your local environment for production.

After running deploy, you should see output that includes something similar to:

```bash
✔ Service deployed to stack bftp-edgar-dev (100s)
```

There is no additional step required. The scheduled scripts becomes active right away after deployment.

### Local invocation

In order to test out your functions locally, you can invoke them with the following command:

```bash
serverless invoke local --function filingsHandler
```

### Test

```bash
npm run test
```
