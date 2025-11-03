"use client";

import { useMemo } from "react";

import { getSuspiciousReason } from "@/lib/phone-utils";

interface SuspiciousNumbersProps {
  numbers: string[];
}

export function SuspiciousNumbers({ numbers }: SuspiciousNumbersProps) {
  const uniqueNumbers = useMemo(() => Array.from(new Set(numbers)), [numbers]);

  if (uniqueNumbers.length === 0) {
    return null;
  }

  return (
    <section className="w-full rounded-xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
      <header className="mb-4 flex items-center gap-2 text-amber-900">
        <span className="text-xl" role="img" aria-label="warning">
          ⚠️
        </span>
        <div>
          <h2 className="text-lg font-semibold">These numbers might not work on WhatsApp</h2>
          <p className="text-sm text-amber-700">
            Double-check the formatting before messaging. Reasons are shown below.
          </p>
        </div>
      </header>
      <ul className="space-y-3">
        {uniqueNumbers.map((number) => (
          <li key={number} className="rounded-md border border-amber-200 bg-white p-4">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-base font-semibold text-amber-900">{number}</span>
              <p className="text-sm text-amber-700">{getSuspiciousReason(number)}</p>
              <a
                href={`https://wa.me/${number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-sm font-semibold text-amber-800 underline underline-offset-4 hover:text-amber-900"
              >
                Try anyway on WhatsApp
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
