import {
  dedupeNumbers,
  getSuspiciousReason,
  isSuspicious,
  partitionNumbers,
  processNumbers,
  toDigitsOnly,
} from "@/lib/phone-utils";

describe("isSuspicious", () => {
  test("flags 54 without 9", () => {
    expect(isSuspicious("541112345678"))
      .toBe(true);
  });

  test("allows 54 with 9", () => {
    expect(isSuspicious("5491112345678"))
      .toBe(false);
  });

  test("flags 15 without 54", () => {
    expect(isSuspicious("1512345678"))
      .toBe(true);
  });

  test("flags 11 without 54", () => {
    expect(isSuspicious("1112345678"))
      .toBe(true);
  });

  test("allows fully formatted Argentine number", () => {
    expect(isSuspicious("5491112345678"))
      .toBe(false);
  });
});

describe("getSuspiciousReason", () => {
  test("returns missing mobile 9 reason", () => {
    expect(getSuspiciousReason("541112345678"))
      .toBe("Missing mobile '9' prefix after 54");
  });

  test("returns missing country code reason", () => {
    expect(getSuspiciousReason("1512345678"))
      .toBe("Missing country code '54'");
  });

  test("falls back to unknown issue", () => {
    expect(getSuspiciousReason("123"))
      .toBe("Unknown issue");
  });
});

describe("processNumbers", () => {
  test("normalizes to digits and identifies suspicious numbers", () => {
    const { normalized, suspicious } = processNumbers(["+54 11 1234-5678", "5491112345678"]);

    expect(normalized).toEqual(["541112345678", "5491112345678"]);
    expect(suspicious).toEqual(["541112345678"]);
  });
});

describe("dedupeNumbers", () => {
  test("removes duplicates while preserving order", () => {
    expect(dedupeNumbers(["1", "1", "2", "1"]))
      .toEqual(["1", "2"]);
  });
});

describe("partitionNumbers", () => {
  test("splits numbers into new and skipped buckets", () => {
    const partition = partitionNumbers(["1", "2", "2", "3"], ["2"]);

    expect(partition.uniqueNumbers).toEqual(["1", "2", "3"]);
    expect(partition.newNumbers).toEqual(["1", "3"]);
    expect(partition.skippedCount).toBe(1);
  });
});

describe("toDigitsOnly", () => {
  test("strips non-digit characters", () => {
    expect(toDigitsOnly("(54) 1 123-456"))
      .toBe("541123456");
  });
});
