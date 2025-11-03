export interface ProcessNumbersResult {
  normalized: string[];
  suspicious: string[];
}

/**
 * Returns a digit-only representation of a phone number.
 */
export function toDigitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Flags numbers that might not work on WhatsApp for Argentine users.
 */
export function isSuspicious(number: string): boolean {
  if (/^54(?!9)\d{10,}$/.test(number)) {
    return true;
  }

  if (/^(15|11)\d{8,}$/.test(number)) {
    return true;
  }

  return false;
}

/**
 * Provides a human-readable explanation for why a number was flagged.
 */
export function getSuspiciousReason(number: string): string {
  if (/^54(?!9)\d{10,}$/.test(number)) {
    return "Missing mobile '9' prefix after 54";
  }

  if (/^(15|11)\d{8,}$/.test(number)) {
    return "Missing country code '54'";
  }

  return "Unknown issue";
}

export function processNumbers(extractedNumbers: string[]): ProcessNumbersResult {
  const normalized = extractedNumbers
    .map((value) => toDigitsOnly(value))
    .filter((value) => value.length > 0);

  const suspicious = normalized.filter((value) => isSuspicious(value));

  return { normalized, suspicious };
}

export function dedupeNumbers(numbers: string[]): string[] {
  return Array.from(new Set(numbers));
}

export interface PartitionResult {
  uniqueNumbers: string[];
  newNumbers: string[];
  skippedCount: number;
}

/**
 * Splits numbers into new vs already processed groups.
 */
export function partitionNumbers(
  normalizedNumbers: string[],
  processedNumbers: string[],
): PartitionResult {
  const processedSet = new Set(processedNumbers);
  const uniqueNumbers = dedupeNumbers(normalizedNumbers);

  const newNumbers = uniqueNumbers.filter((number) => !processedSet.has(number));
  const skippedNumbers = uniqueNumbers.filter((number) => processedSet.has(number));

  return {
    uniqueNumbers,
    newNumbers,
    skippedCount: skippedNumbers.length,
  };
}
