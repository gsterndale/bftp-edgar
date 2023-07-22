# SEC filing sync

This project helps keep SalesForce Account records up-to-date with SEC filings.

## Implementation

On a regular schedule (daily) a script is run that will:

1. pull active SalesForce Account records that have a [CIK](https://www.sec.gov/page/edgar-how-do-i-look-central-index-key-cik-number) specified
2. query the SEC [EDGAR](https://www.sec.gov/filings/edgar-guide) API for filings
3. create new Filing records associated with the proper Account on SalesForce

Also on a regular schedule (30 days) a script is run that will:

1. pull active SalesForce Account records _without_ a [CIK](https://www.sec.gov/page/edgar-how-do-i-look-central-index-key-cik-number) specified
2. query the SEC [EDGAR](https://www.sec.gov/filings/edgar-guide) API by company name
3. update the SalesForce Account record with the likely CIK if found.

## Assumptions

SEC company CIKs are unique.

The combination of Filing form type (e.g. "D"), date, and accession number is unique, at least for a given company.

This project respects the SEC EDGAR API [rate limiting and access requirements](https://www.sec.gov/os/webmaster-faq#code-support) including the specified "User Agent" in HTTP requests.

The SEC EDGAR and SalesForce APIs don't change!

## SalesForce setup

For this project to work, please create the following in the SalesForce Object Manager:

### Custom fields on Account records:

| Field Name | Data Type  | Description                                                                                               | Example    |
| ---------- | ---------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| CIK        | `text`     | unique SEC [Central Index Key](https://www.sec.gov/page/edgar-how-do-i-look-central-index-key-cik-number) | 0001108524 |
| Active     | `picklist` | flags records that should be kept up-to-date with a `Yes` value                                           | Yes        |

### A custom Object named "Filing" with the following required fields:

| Field Name | Data Type                    | Description                                                                                                              | Example              |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| Name       | `text`                       | SalesForce required field where we'll store the [filing "accession number"](https://www.sec.gov/os/accessing-edgar-data) | 0001193125-15-118890 |
| Account    | `Master-Detail Relationship` | associated SalesForce Account ID                                                                                         | 001Hu00002uRmekIAC   |
| Form       | `text`                       | SEC [Form "Number"](https://www.sec.gov/forms)                                                                           | D                    |
| Date       | `date`                       | Date of filed with the SEC                                                                                               | 2/16/2022            |

### Workflow automation:

In SalesForce, users can create and configure Workflow Rules that can trigger actions e.g. email alerts.

#### New Filing

Create and activate a Workflow Rule associated with Filing objects, with an Email Alert Action, that will run when a new Filing is created for "Active" Accounts.

A simple Classic Email Template might look like this:

```
We found that {!Account.Name} has a filed form type {!Filing__c.Form__c} with the SEC on {!Filing__c.Date__c}.
```

The Email Alert should be configured to include the Account Owner as a recipient.

#### Updated Account CIK

Create and activate a Workflow Rule associated with Account objects, with an Email Alert Action, that will run when a record is "created, and every time it's edited" with the following formula:

```
ISCHANGED(CIK__c)
```

A simple Classic Email Template might look like this:

```
We found that {!Account.Name}'s CIK has been updated to "{!Account.CIK__c}". Please confirm that this value is the correct SEC CIK. https://www.sec.gov/edgar/searchedgar/cik
```

The Email Alert should be configured to include the Account Owner as a recipient.

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

In order to authenticate with the SalesForce, generate a security token for the user that will be consuming the API.

Secrets are stored as ENV variables and should **not** be committed to this repository. An `.envrc.example` file _is_ committed, and should be copied and updated with the proper values including:

- SalesForce security token
- SalesForce username
- SalesForce password
- SalesForce URL
- SEC EDGAR User Agent e.g. "Acme Inc. jane@acme.com"

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

### Validating SalesForce objects

After creating the custom SalesForce objects and fields you can confirm that they're configured correctly and that authentication is working by running:

```bash
npm run validate
```

### Local invocation

In order to test out your functions locally, you can invoke them with the following command:

```bash
serverless invoke local --function filingsHandler
```

### Test

```bash
npm run test
```

## TODO

- [ ] Rate limit SEC API requests
- [ ] stub HTTP requests for unit tests
- [ ] Error handling
- [ ] Dead man's snitch
