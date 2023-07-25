import {
  UserInfo,
  Record,
  RecordResult,
  FieldType,
  PicklistEntry,
  maybe,
} from "jsforce";

type SobjectName = "Account" | "Filing__c";
type FauxSobjectMap = {
  [name: string]: FauxQuery;
};

type Fieldish = {
  type: FieldType;
  custom: boolean;
  label: string;
  name: string;
  nameField: boolean;
  picklistValues?: maybe<PicklistEntry[]> | undefined;
  referenceTo?: maybe<string[]> | undefined;
  relationshipName?: maybe<string> | undefined;
  relationshipOrder?: maybe<number> | undefined;
};

class FauxQuery {
  records: Record[] = [];
  result: RecordResult = {
    success: false,
    errors: [
      {
        statusCode: "-1",
        message: "Whoops",
        fields: ["id"],
      },
    ],
  };
  fields: Fieldish[] = [];

  include = jest.fn().mockImplementation(() => this);
  find = jest.fn().mockImplementation(() => this);
  execute = jest.fn().mockImplementation(() => Promise.resolve(this.records));
  create = jest.fn().mockImplementation(() => Promise.resolve(this.result));
  describe = jest
    .fn()
    .mockImplementation(() => Promise.resolve({ fields: this.fields }));
}

const sobject: FauxSobjectMap = {
  Account: new FauxQuery(),
  Filing__c: new FauxQuery(),
};

class FauxConnection {
  organizationId = "00ABC000000ABCDEF";
  userId = "000AB00000OABCDEFG";
  url = `https://${this.organizationId}-dev-ed.develop.my.salesforce.com/id/${this.organizationId}/${this.userId}`;
  userInfo: UserInfo = {
    id: this.userId,
    organizationId: this.organizationId,
    url: this.url,
  };

  login = jest.fn().mockImplementation(() => Promise.resolve(this.userInfo));
  sobject = jest.fn().mockImplementation((name: SobjectName) => {
    const found = sobject[name];
    if (found === undefined) throw new Error(`sobject named ${name} not found`);
    return found;
  });
}

jest.mock("jsforce", () => {
  return {
    Connection: jest.fn().mockImplementation(() => {
      return new FauxConnection();
    }),
  };
});

export { sobject, Record };
