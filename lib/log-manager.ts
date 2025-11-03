import { promises as fs } from "fs";
import path from "path";

import { dedupeNumbers } from "@/lib/phone-utils";

export interface ProcessedLog {
  processedNumbers: string[];
  lastUpdated: string;
}

const DEFAULT_LOG: ProcessedLog = {
  processedNumbers: [],
  lastUpdated: new Date(0).toISOString(),
};

function getEnvLogPath(): string | undefined {
  const customPath = process.env.PROCESSED_LOG_PATH;
  if (!customPath) {
    return undefined;
  }
  return path.isAbsolute(customPath)
    ? customPath
    : path.resolve(process.cwd(), customPath);
}

export function getLogPath(): string {
  const envPath = getEnvLogPath();
  if (envPath) {
    return envPath;
  }

  return path.join(process.cwd(), "public", "processed_numbers.json");
}

async function ensureLogFile(): Promise<void> {
  const logPath = getLogPath();

  try {
    await fs.access(logPath);
  } catch {
    const directory = path.dirname(logPath);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      logPath,
      JSON.stringify(
        {
          processedNumbers: [],
          lastUpdated: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
  }
}

export async function readLog(): Promise<ProcessedLog> {
  await ensureLogFile();
  const logPath = getLogPath();

  try {
    const content = await fs.readFile(logPath, "utf8");
    const parsed = JSON.parse(content) as Partial<ProcessedLog>;

    if (!Array.isArray(parsed.processedNumbers)) {
      return { ...DEFAULT_LOG, lastUpdated: new Date().toISOString() };
    }

    return {
      processedNumbers: parsed.processedNumbers.map(String),
      lastUpdated: parsed.lastUpdated ?? new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to read processed_numbers.json", error);
    throw new Error("Unable to read processed numbers log");
  }
}

export async function writeLog(numbers: string[]): Promise<ProcessedLog> {
  const unique = dedupeNumbers(numbers);
  const payload: ProcessedLog = {
    processedNumbers: unique,
    lastUpdated: new Date().toISOString(),
  };

  const logPath = getLogPath();
  await fs.writeFile(logPath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export async function appendToLog(newNumbers: string[]): Promise<ProcessedLog> {
  const current = await readLog();
  const combined = dedupeNumbers([...current.processedNumbers, ...newNumbers]);
  return writeLog(combined);
}

export async function resetLog(): Promise<ProcessedLog> {
  const logPath = getLogPath();
  await fs.writeFile(
    logPath,
    JSON.stringify(
      {
        processedNumbers: [],
        lastUpdated: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );

  return readLog();
}
