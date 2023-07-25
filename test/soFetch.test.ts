import { describe, expect, test } from "@jest/globals";
import fs from "fs";
import * as http from "http";
import * as crypto from "crypto";
import soFetch from "./soFetch";

const server = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.write(`Path: ${req.url?.toString()}`);
  res.end();
});

beforeAll(() => {
  server.listen(8080);
});

describe("fetching a diaried request", () => {
  const existingFixture = "fixtures/fetchingDiary.json";
  const diariedURL = "http://localhost:8080";
  const diariedBody = "*tap* *tap* is this thing on?";

  test("responds with info from diary", async () => {
    const gretchen = soFetch({
      missingEntryStrategy: "ignore",
      recordNewEntries: false,
    });
    gretchen.start(existingFixture);
    expect.assertions(4);
    const random = crypto.randomBytes(20).toString("hex");
    const newURL = `http://localhost:8080/${random}`;
    const newResponse = await fetch(newURL);
    expect(newResponse.status).toBe(200);
    expect(await newResponse.text()).toMatch(random);
    const diariedResponse = await fetch(diariedURL);
    expect(diariedResponse.status).toBe(200);
    expect(await diariedResponse.text()).toBe(diariedBody);
  });
});

describe("recording new entries", () => {
  const timestamp = new Date().getTime();
  const tempFixture = `/tmp/fetchingDiary.${timestamp}.json`;

  test("writes new info to diary", async () => {
    const gretchen = soFetch({
      missingEntryStrategy: "ignore",
      recordNewEntries: true,
    });
    expect.assertions(7);
    expect(fs.existsSync(tempFixture)).toBeFalsy();
    gretchen.start(tempFixture);
    expect(fs.existsSync(tempFixture)).toBeTruthy();
    expect(gretchen.diary?.entries.length).toBe(0);

    const random = crypto.randomBytes(20).toString("hex");
    const newURL = `http://localhost:8080/${random}`;
    const newResponse = await fetch(newURL);
    expect(newResponse.status).toBe(200);
    expect(await newResponse.text()).toMatch(random);

    expect(gretchen.diary?.entries.length).toBe(1);
    gretchen.start(tempFixture);
    expect(gretchen.diary?.entries.length).toBe(1);
  });

  afterEach(() => {
    fs.rmSync(tempFixture);
  });
});

afterAll(async () => {
  server.close();
});
