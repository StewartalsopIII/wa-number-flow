"use client";

import { useCallback, useMemo, useState } from "react";

interface WhatsAppLinksProps {
  newNumbers: string[];
}

export function WhatsAppLinks({ newNumbers }: WhatsAppLinksProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const uniqueNumbers = useMemo(() => Array.from(new Set(newNumbers)), [newNumbers]);

  const openAllChats = useCallback(() => {
    if (uniqueNumbers.length === 0) {
      return;
    }

    if (uniqueNumbers.length > 10) {
      const confirmed = window.confirm(
        `Open ${uniqueNumbers.length} WhatsApp chats? This will open many browser tabs.`,
      );
      if (!confirmed) {
        return;
      }
    }

    uniqueNumbers.forEach((number, index) => {
      setTimeout(() => {
        window.open(`https://wa.me/${number}`, "_blank", "noopener");
      }, index * 500);
    });
  }, [uniqueNumbers]);

  const copyToClipboard = useCallback(async () => {
    if (uniqueNumbers.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(uniqueNumbers.join(","));
      setCopyStatus("Copied to clipboard");
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (error) {
      console.error("Failed to copy numbers", error);
      setCopyStatus("Copy failed. Try again.");
      setTimeout(() => setCopyStatus(null), 2000);
    }
  }, [uniqueNumbers]);

  if (uniqueNumbers.length === 0) {
    return null;
  }

  return (
    <section className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-emerald-900">New Numbers - WhatsApp Links</h2>
        <p className="text-sm text-emerald-700">
          Ready to message {uniqueNumbers.length} new contact{uniqueNumbers.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openAllChats}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Open All New Chats
        </button>
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-md border border-emerald-400 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          Copy List to Clipboard
        </button>
        {copyStatus && <span className="self-center text-sm font-medium text-emerald-700">{copyStatus}</span>}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {uniqueNumbers.map((number) => (
          <li key={number}>
            <a
              href={`https://wa.me/${number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
            >
              <span className="font-mono">{number}</span>
              <span className="text-xs uppercase tracking-wide text-emerald-600">Open</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
