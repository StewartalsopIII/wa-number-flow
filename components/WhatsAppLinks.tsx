"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface WhatsAppLinksProps {
  newNumbers: string[];
}

export function WhatsAppLinks({ newNumbers }: WhatsAppLinksProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [clickedNumbers, setClickedNumbers] = useState<Set<string>>(new Set());

  const uniqueNumbers = useMemo(() => Array.from(new Set(newNumbers)), [newNumbers]);

  // Fetch clicked numbers on mount
  useEffect(() => {
    async function fetchClicked() {
      try {
        const res = await fetch("/api/clicked");
        if (res.ok) {
          const data = await res.json();
          setClickedNumbers(new Set(data.clickedNumbers || []));
        }
      } catch (error) {
        console.error("Failed to fetch clicked numbers", error);
      }
    }
    fetchClicked();
  }, []);

  const markAsClicked = useCallback(async (number: string) => {
    // Optimistically update local state
    setClickedNumbers((prev) => new Set([...prev, number]));

    try {
      await fetch("/api/clicked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });
    } catch (error) {
      console.error("Failed to persist clicked number", error);
    }
  }, []);

  const openAllChats = useCallback(async () => {
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

    // Mark all as clicked
    const newClicked = new Set([...clickedNumbers, ...uniqueNumbers]);
    setClickedNumbers(newClicked);

    try {
      await fetch("/api/clicked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: uniqueNumbers }),
      });
    } catch (error) {
      console.error("Failed to persist clicked numbers", error);
    }

    uniqueNumbers.forEach((number, index) => {
      setTimeout(() => {
        window.open(`https://wa.me/${number}`, "_blank", "noopener");
      }, index * 500);
    });
  }, [uniqueNumbers, clickedNumbers]);

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

  const handleLinkClick = useCallback(
    (number: string) => {
      markAsClicked(number);
    },
    [markAsClicked],
  );

  if (uniqueNumbers.length === 0) {
    return null;
  }

  return (
    <section className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-emerald-900">All Numbers - WhatsApp Links</h2>
        <p className="text-sm text-emerald-700">
          Ready to message {uniqueNumbers.length} contact{uniqueNumbers.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openAllChats}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Open All Chats
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
        {uniqueNumbers.map((number) => {
          const isClicked = clickedNumbers.has(number);
          return (
            <li key={number}>
              <a
                href={`https://wa.me/${number}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(number)}
                className={`flex items-center justify-between rounded-md border px-4 py-2 text-sm font-medium transition ${
                  isClicked
                    ? "border-gray-200 bg-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-150"
                    : "border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100"
                }`}
              >
                <span className="font-mono">{number}</span>
                <span
                  className={`text-xs uppercase tracking-wide ${
                    isClicked ? "text-gray-400" : "text-emerald-600"
                  }`}
                >
                  {isClicked ? "Opened" : "Open"}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
