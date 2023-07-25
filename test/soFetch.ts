import fs from "fs";
import path from "path";

const ogFetch = global.fetch;

type Req = {
  input: RequestInfo | URL;
  options?: RequestInit;
};

type Res = {
  body?: Buffer | string;
  options?: ResponseInit;
};

class Entry {
  readonly req: Req;
  readonly res: Res;

  constructor(req: Req, res: Res) {
    this.req = req;
    this.res = res;
  }

  request(): Request {
    return new Request(this.req.input, this.req.options);
  }
  response(): Response {
    return new Response(this.res.body, this.res.options);
  }

  matches(request: Request): boolean {
    return (
      this.urlMatch(request) &&
      this.methodMatch(request) &&
      this.headersMatch(request)
    );
  }

  toJSON(key?: string) {
    return { req: this.req, res: this.res };
  }

  private urlMatch(request: Request): boolean {
    const known = this.request().url;
    const requested = request.url;
    return known === requested;
  }

  private methodMatch(request: Request): boolean {
    const known = this.request().method;
    const requested = request.method;
    return ["*", undefined, requested].includes(known);
  }

  private headersMatch(request: Request): boolean {
    const known = this.request().headers.get("Content-Type");
    const requested = request.headers.get("Content-Type");
    return ["*", undefined, requested].includes(known);
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

  async writeEntry(
    requestInput: RequestInfo | URL,
    requestOptions: RequestInit,
    response: Response
  ) {
    const req: Req = this.reqFactory(requestInput, requestOptions);
    const res: Res = await this.resFactory(response);
    const entry: Entry = new Entry(req, res);
    this.entries.push(entry);
    this.writeEntries();
  }

  toJSON(key?: string) {
    return { entries: this.entries };
  }

  private writeEntries() {
    const data = JSON.stringify(this, undefined, 2);
    fs.writeFileSync(this.fixture, data, "utf-8");
  }

  private readEntries() {
    try {
      const jsonString = fs.readFileSync(this.fixture).toString();
      this.entries = JSON.parse(jsonString).entries.map(
        (ent: { req: Req; res: Res }) => new Entry(ent.req, ent.res)
      );
    } catch {
      this.entries = [];
      this.writeEntries();
    }
  }

  private reqFactory(
    requestInput: RequestInfo | URL,
    requestOptions: RequestInit
  ): Req {
    return {
      input: requestInput.toString(),
      options: {
        method: requestOptions.method,
        headers: requestOptions.headers,
        body: requestOptions.body?.toString(),
      },
    };
  }

  private async resFactory(response: Response): Promise<Res> {
    return {
      body: await response.clone().text(),
      options: {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      },
    };
  }
}

type GretchenOptions = {
  missingEntryStrategy?: "warn" | "error" | "ignore";
  recordNewEntries?: boolean;
};

const defaultGretchenOptions: GretchenOptions = {
  missingEntryStrategy: "warn",
  recordNewEntries: true,
};

class Gretchen {
  options: GretchenOptions;
  diary?: Diary;

  constructor(options: GretchenOptions = defaultGretchenOptions) {
    this.options = {
      ...defaultGretchenOptions,
      ...options,
    };
  }

  start(fixturePath: string | undefined = undefined) {
    this.loadDiary(fixturePath);
    this.mockFetch();
  }

  stop() {
    global.fetch = ogFetch;
  }

  private loadDiary(fixturePath: string | undefined = undefined) {
    this.diary = new Diary(fixturePath);
  }

  private mockFetch() {
    if (this.diary === undefined) throw new Error("No diary loaded");
    global.fetch = jest.fn(this.fetch.bind(this)) as jest.Mock;
  }

  async fetch(url: string, init: RequestInit = {}) {
    const request = new Request(url, init);
    const response = this.diary?.matchingResponse(request);
    if (response !== undefined) return Promise.resolve(response);

    const message = `No matching entry for: ${url}`;
    if (this.options.missingEntryStrategy === "warn") {
      console.warn(message);
    } else if (this.options.missingEntryStrategy === "error") {
      throw new Error(message);
    }
    const ogResponse = await ogFetch(url, init);
    if (this.options.recordNewEntries && this.diary !== undefined)
      await this.diary.writeEntry(url, init, ogResponse);
    return Promise.resolve(ogResponse);
  }
}

const soFetch = (options: GretchenOptions = defaultGretchenOptions) => {
  return new Gretchen(options);
};

export default soFetch;
