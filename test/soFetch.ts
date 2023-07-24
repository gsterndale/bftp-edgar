import fs from "fs";
import path from "path";

const ogFetch = global.fetch;

type Req = {
  headers: any;
  body?: Buffer;
  url: string;
  method: string;
};

type Res = {
  headers: any;
  body?: Buffer;
  status: number;
};

class Entry {
  req: Req;
  res: Res;

  constructor(req: Req, res: Res) {
    this.req = req;
    this.res = res;
  }

  matches(request: Request): boolean {
    return (
      this.urlMatch(request.url) &&
      this.methodMatch(request.method) &&
      this.headersMatch(request.headers)
    );
  }

  private urlMatch(url: string): boolean {
    const known = this.req.url;
    const requested = url.toString();
    return known === requested;
  }

  private methodMatch(method: string): boolean {
    const known = this.req.method;
    const requested = method;
    return ["*", undefined, requested].includes(known);
  }

  private headersMatch(headers: Headers): boolean {
    const known = (this.req.headers || {})["Content-Type"];
    const requested = headers.get("Content-Type");
    return ["*", undefined, requested].includes(known);
  }

  response(): Response {
    const options: ResponseInit = {
      headers: this.res.headers,
      status: this.res.status,
    };
    return new Response(this.res.body, options);
  }
}

class Diary {
  fixture: string;
  entries!: Entry[];

  constructor(fixturePath: string = "fixtures/diary.json") {
    this.fixture = path.resolve(__dirname, fixturePath);
    this.readEntries();
  }

  matchingResponse(request: Request): Response | undefined {
    const entry = this.entries.find((entry) => entry.matches(request));
    return entry?.response();
  }

  private readEntries() {
    const jsonString = fs.readFileSync(this.fixture).toString();
    this.entries = JSON.parse(jsonString).entries.map(
      (ent: { req: Req; res: Res }) => new Entry(ent.req, ent.res)
    );
  }
}

class Gretchen {
  options: object;
  requests: Request[] = [];
  diary?: Diary;

  constructor(options = {}) {
    this.options = options;
  }

  start(fixturePath = undefined) {
    this.loadDiary(fixturePath);
    this.mockFetch();
  }

  stop() {
    global.fetch = ogFetch;
  }

  private loadDiary(fixturePath = undefined) {
    this.diary = new Diary(fixturePath);
  }

  private mockFetch() {
    if (this.diary === undefined) throw new Error("No diary loaded");
    global.fetch = jest.fn(this.fetch.bind(this)) as jest.Mock;
  }

  fetch(url: string, init: RequestInit = {}) {
    const request = new Request(url, init);
    const response = this.diary?.matchingResponse(request);

    if (response !== undefined) {
      return Promise.resolve(response);
    } else {
      // console.warn(`No matching entry for: ${url}`);
      throw new Error(`No matching entry for: ${url}`);
      return ogFetch(url, init);
    }
  }
}

const soFetch = (options = {}) => {
  return new Gretchen(options);
};

export default soFetch;
