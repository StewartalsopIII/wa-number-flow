import { promises as fs } from "fs";
import os from "os";
import path from "path";

import {
  appendToLog,
  getLogPath,
  readLog,
  resetLog,
  writeLog,
} from "@/lib/log-manager";

const ORIGINAL_ENV_PATH = process.env.PROCESSED_LOG_PATH;

async function createTempLogPath() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wa-log-test-"));
  const tempFile = path.join(tempDir, "processed_numbers.json");
  return { tempDir, tempFile };
}

describe("log-manager", () => {
  let tempDir: string;

  beforeEach(async () => {
    const temp = await createTempLogPath();
    tempDir = temp.tempDir;
    process.env.PROCESSED_LOG_PATH = temp.tempFile;
    await resetLog();
  });

  afterEach(async () => {
    process.env.PROCESSED_LOG_PATH = ORIGINAL_ENV_PATH;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test("readLog creates the file when missing", async () => {
    const log = await readLog();
    expect(log.processedNumbers).toEqual([]);
    const fileExists = await fs
      .access(getLogPath())
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  test("appendToLog deduplicates numbers", async () => {
    await appendToLog(["123", "456"]);
    const updated = await appendToLog(["123", "789"]);
    expect(updated.processedNumbers).toEqual(["123", "456", "789"]);
  });

  test("writeLog overwrites existing numbers", async () => {
    await appendToLog(["123"]);
    const overwritten = await writeLog(["999"]);
    expect(overwritten.processedNumbers).toEqual(["999"]);
  });

  test("resetLog clears the stored numbers", async () => {
    await appendToLog(["123"]);
    const cleared = await resetLog();
    expect(cleared.processedNumbers).toEqual([]);
  });
});
