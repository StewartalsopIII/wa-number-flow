import { NextResponse } from "next/server";

import { getLogPath, readLog, resetLog } from "@/lib/log-manager";

export async function GET() {
  const log = await readLog();

  return NextResponse.json({
    ...log,
    totalProcessed: log.processedNumbers.length,
    logPath: getLogPath(),
  });
}

export async function DELETE() {
  const log = await resetLog();

  return NextResponse.json({
    success: true,
    ...log,
    totalProcessed: 0,
    logPath: getLogPath(),
  });
}
