import { NextResponse } from "next/server";

import { appendToLog, getLogPath, readLog } from "@/lib/log-manager";
import { callOpenRouter, OpenRouterError } from "@/lib/openrouter";
import { dedupeNumbers, partitionNumbers, processNumbers } from "@/lib/phone-utils";

const ACCEPTED_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface ProcessImageRequestBody {
  image?: unknown;
  mimeType?: unknown;
}

export async function POST(request: Request) {
  let payload: ProcessImageRequestBody;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("Failed to parse process-image request body", error);
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const { image, mimeType } = payload;

  if (typeof image !== "string" || image.trim().length === 0) {
    return NextResponse.json(
      { error: "Image base64 payload is required" },
      { status: 400 },
    );
  }

  if (typeof mimeType !== "string" || !ACCEPTED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Only PNG and JPEG images are supported" },
      { status: 400 },
    );
  }

  const sizeInBytes = Buffer.from(image, "base64").length;

  if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image exceeds the 10MB size limit" },
      { status: 400 },
    );
  }

  try {
    const numbersFromModel = await callOpenRouter(image, mimeType);
    const { normalized, suspicious } = processNumbers(numbersFromModel);

    const logBefore = await readLog();
    const partition = partitionNumbers(normalized, logBefore.processedNumbers);

    let logAfter = logBefore;

    if (partition.newNumbers.length > 0) {
      logAfter = await appendToLog(partition.newNumbers);
    }

    return NextResponse.json({
      numbers: normalized,
      newNumbers: partition.newNumbers,
      skipped: partition.skippedCount,
      suspiciousNumbers: dedupeNumbers(suspicious),
      logPath: getLogPath(),
      totalProcessed: logAfter.processedNumbers.length,
      lastUpdated: logAfter.lastUpdated,
    });
  } catch (error) {
    console.error("Failed to process uploaded image", error);

    if (error instanceof OpenRouterError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    }

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
