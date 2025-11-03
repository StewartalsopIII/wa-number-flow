"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ImageUpload, type ImageUploadResult } from "@/components/ImageUpload";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { SuspiciousNumbers } from "@/components/SuspiciousNumbers";
import { WhatsAppLinks } from "@/components/WhatsAppLinks";

interface ProcessImageResponse {
  numbers: string[];
  newNumbers: string[];
  skipped: number;
  suspiciousNumbers: string[];
  logPath: string;
  totalProcessed: number;
  lastUpdated?: string;
  error?: string;
}

interface LogResponse {
  processedNumbers: string[];
  lastUpdated: string;
  totalProcessed: number;
  logPath: string;
}

type StatusState = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [numbers, setNumbers] = useState<string[]>([]);
  const [newNumbers, setNewNumbers] = useState<string[]>([]);
  const [suspiciousNumbers, setSuspiciousNumbers] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<number>(0);
  const [status, setStatus] = useState<StatusState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("Upload a screenshot to get started.");
  const [logInfo, setLogInfo] = useState<{ totalProcessed: number; lastUpdated?: string; logPath?: string }>(
    { totalProcessed: 0 },
  );

  const hasResults = numbers.length > 0 || newNumbers.length > 0 || suspiciousNumbers.length > 0;

  const fetchLogInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/log", { method: "GET" });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as LogResponse;
      setLogInfo({
        totalProcessed: data.totalProcessed,
        lastUpdated: data.lastUpdated,
        logPath: data.logPath,
      });
    } catch (error) {
      console.error("Failed to load log info", error);
    }
  }, []);

  useEffect(() => {
    void fetchLogInfo();
  }, [fetchLogInfo]);

  const processImage = useCallback(
    async ({ base64, mimeType }: ImageUploadResult) => {
      setStatus("loading");
      setStatusMessage("Processing screenshot...");

      try {
        const response = await fetch("/api/process-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64, mimeType }),
        });

        const data = (await response.json()) as ProcessImageResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Image processing failed");
        }

        setNumbers(data.numbers ?? []);
        setNewNumbers(data.newNumbers ?? []);
        setSuspiciousNumbers(data.suspiciousNumbers ?? []);
        setSkipped(data.skipped ?? 0);
        setLogInfo({
          totalProcessed: data.totalProcessed ?? 0,
          lastUpdated: data.lastUpdated,
          logPath: data.logPath,
        });
        setStatus("success");
        setStatusMessage(
          `Success! Found ${data.numbers?.length ?? 0} numbers, ${data.newNumbers?.length ?? 0} new.`,
        );
      } catch (error) {
        console.error("Image processing error", error);
        setStatus("error");
        setStatusMessage(error instanceof Error ? error.message : "Unexpected error during processing");
      }
    },
    [],
  );

  const handleResetLog = useCallback(async () => {
    setStatus("loading");
    setStatusMessage("Resetting log...");

    try {
      const response = await fetch("/api/log", { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Log reset failed");
      }

      setNumbers([]);
      setNewNumbers([]);
      setSuspiciousNumbers([]);
      setSkipped(0);
      setLogInfo({
        totalProcessed: data.totalProcessed ?? 0,
        lastUpdated: data.lastUpdated,
        logPath: data.logPath,
      });
      setStatus("success");
      setStatusMessage("Processed numbers log cleared");
    } catch (error) {
      console.error("Failed to reset log", error);
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unexpected error when resetting log");
    }
  }, []);

  const statusStyles = useMemo(() => {
    switch (status) {
      case "loading":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "success":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "error":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }, [status]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-4 rounded-2xl bg-slate-900 px-6 py-10 text-white shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">WhatsApp Number Extractor</h1>
        <p className="max-w-3xl text-base text-slate-300">
          Upload a WhatsApp conversation screenshot and let the Gemini 2.5 Flash model find every phone number. Track
          which contacts are new, open chats in bulk, and flag numbers that might fail in Argentina.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="rounded-full border border-slate-700 px-3 py-1">Powered by OpenRouter (Gemini 2.5 Flash)</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">No Python or OCR installs needed</span>
        </div>
      </header>

      <section className={`rounded-xl border px-4 py-4 text-sm ${statusStyles}`}>
        <div className="flex items-center gap-3">
          {status === "loading" && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          <p>{statusMessage}</p>
        </div>
      </section>

      <ImageUpload
        onImageReady={processImage}
        disabled={status === "loading"}
        onClear={() => {
          setStatus("idle");
          setStatusMessage("Upload a screenshot to get started.");
        }}
      />

      {hasResults && (
        <div className="flex flex-col gap-6">
          <ResultsDisplay
            numbers={numbers}
            newNumbers={newNumbers}
            skipped={skipped}
            totalProcessed={logInfo.totalProcessed}
          />
          <WhatsAppLinks newNumbers={newNumbers} />
          <SuspiciousNumbers numbers={suspiciousNumbers} />
        </div>
      )}

      <section className="mt-auto flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Processed Numbers Log</h2>
            <p className="text-sm text-slate-500">
              Stored numbers: <span className="font-semibold text-slate-700">{logInfo.totalProcessed}</span>
              {logInfo.lastUpdated ? ` · Last updated ${new Date(logInfo.lastUpdated).toLocaleString()}` : ""}
            </p>
            {logInfo.logPath && (
              <p className="text-xs text-slate-400">Log file: {logInfo.logPath}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleResetLog}
            className="rounded-md border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Reset Log
          </button>
        </div>
      </section>
    </main>
  );
}
