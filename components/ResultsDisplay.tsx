"use client";

import { useMemo } from "react";

interface ResultsDisplayProps {
  numbers: string[];
  newNumbers: string[];
  skipped: number;
  totalProcessed: number;
}

export function ResultsDisplay({
  numbers,
  newNumbers,
  skipped,
  totalProcessed,
}: ResultsDisplayProps) {
  const uniqueNumbers = useMemo(() => Array.from(new Set(numbers)), [numbers]);
  const newNumbersSet = useMemo(() => new Set(newNumbers), [newNumbers]);

  if (numbers.length === 0) {
    return null;
  }

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-800">All Detected Numbers</h2>
        <p className="text-sm text-slate-500">
          Found {uniqueNumbers.length} numbers, {newNumbers.length} new, {skipped} already processed.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-sm font-medium text-slate-700">
            <tr>
              <th className="px-4 py-2 font-medium">Number</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {uniqueNumbers.map((number) => {
              const status = newNumbersSet.has(number) ? "New" : "Already processed";
              const badgeClasses = newNumbersSet.has(number)
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600";

              return (
                <tr key={number}>
                  <td className="px-4 py-2 font-mono text-base text-slate-800">{number}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Total processed numbers stored: <span className="font-semibold text-slate-700">{totalProcessed}</span>
      </p>
    </section>
  );
}
