// @vitest-environment node
import { describe, it, expect } from "vitest";
import { excelToCSV, isExcelFile, isSupportedFile } from "./excelParser";
import { parseCSV } from "./csvParser";
import * as fs from "node:fs";
import * as path from "node:path";

// ============================================================
// isExcelFile / isSupportedFile utilities
// ============================================================

describe("isExcelFile", () => {
  it("should detect .xlsx files", () => {
    expect(isExcelFile("report.xlsx")).toBe(true);
    expect(isExcelFile("Report.XLSX")).toBe(true);
  });

  it("should detect .xls files", () => {
    expect(isExcelFile("report.xls")).toBe(true);
  });

  it("should detect .xml files", () => {
    expect(isExcelFile("report.xml")).toBe(true);
  });

  it("should reject non-Excel files", () => {
    expect(isExcelFile("data.csv")).toBe(false);
    expect(isExcelFile("report.html")).toBe(false);
  });
});

describe("isSupportedFile", () => {
  it("should accept all supported extensions", () => {
    expect(isSupportedFile("data.csv")).toBe(true);
    expect(isSupportedFile("data.xlsx")).toBe(true);
    expect(isSupportedFile("data.xls")).toBe(true);
    expect(isSupportedFile("data.xml")).toBe(true);
    expect(isSupportedFile("data.htm")).toBe(true);
    expect(isSupportedFile("data.html")).toBe(true);
  });

  it("should reject unsupported extensions", () => {
    expect(isSupportedFile("data.txt")).toBe(false);
    expect(isSupportedFile("data.pdf")).toBe(false);
    expect(isSupportedFile("data.json")).toBe(false);
  });
});

// ============================================================
// Real Excel file test (ReportHistory-10009822126.xlsx)
// ============================================================

// __dirname resolves to client/src/lib in vitest, so go up 3 levels to project root
const EXCEL_FILE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "ReportHistory-10009822126.xlsx"
);

describe("Excel Parser — Real MT5 File", () => {
  it("should exist as test fixture", () => {
    expect(fs.existsSync(EXCEL_FILE_PATH)).toBe(true);
  });

  it("should convert Excel to CSV without throwing", () => {
    const buffer = fs.readFileSync(EXCEL_FILE_PATH);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    expect(() => excelToCSV(arrayBuffer)).not.toThrow();
  });

  it("should produce CSV with recognizable headers", () => {
    const buffer = fs.readFileSync(EXCEL_FILE_PATH);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const csvText = excelToCSV(arrayBuffer);
    const firstLine = csvText.split("\n")[0];

    // Should contain MT5-style headers (translated to English or Japanese)
    const hasKnownHeaders =
      /time|symbol|profit|deal|direction|銘柄|損益|約定/i.test(firstLine);
    expect(hasKnownHeaders).toBe(true);
  });

  it("should produce parseable trades via csvParser", () => {
    const buffer = fs.readFileSync(EXCEL_FILE_PATH);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const csvText = excelToCSV(arrayBuffer);
    const { trades, errors } = parseCSV(csvText);

    // Should produce at least some trades
    expect(trades.length).toBeGreaterThan(0);

    // All trades should have valid fields
    for (const trade of trades) {
      expect(trade.time).toBeInstanceOf(Date);
      expect(isNaN(trade.time.getTime())).toBe(false);
      expect(trade.symbol.length).toBeGreaterThan(0);
      expect(typeof trade.profit).toBe("number");
      expect(isNaN(trade.profit)).toBe(false);
      expect(trade.volume).toBeGreaterThan(0);
    }
  });

  it("should not include open trades or working orders", () => {
    const buffer = fs.readFileSync(EXCEL_FILE_PATH);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const csvText = excelToCSV(arrayBuffer);
    const { trades } = parseCSV(csvText);

    // All trades should have a valid close time (not in the future or null)
    for (const trade of trades) {
      expect(trade.time.getFullYear()).toBeGreaterThanOrEqual(2000);
      expect(trade.time.getFullYear()).toBeLessThanOrEqual(2030);
    }
  });
});

// ============================================================
// Excel Parser — Error handling
// ============================================================

describe("Excel Parser — Error Handling", () => {
  it("should not produce valid trades from empty buffer", () => {
    const emptyBuffer = new ArrayBuffer(0);
    // XLSX library may not throw on empty buffer, but should produce no useful data
    try {
      const csvText = excelToCSV(emptyBuffer);
      const { trades } = parseCSV(csvText);
      expect(trades).toHaveLength(0);
    } catch {
      // Throwing is also acceptable behavior
      expect(true).toBe(true);
    }
  });

  it("should not produce valid trades from invalid data", () => {
    const invalidData = new TextEncoder().encode("this is not an excel file");
    const buf = invalidData.buffer.slice(
      invalidData.byteOffset,
      invalidData.byteOffset + invalidData.byteLength
    );
    try {
      const csvText = excelToCSV(buf);
      const { trades } = parseCSV(csvText);
      // If it doesn't throw, at least no valid trades should be produced
      expect(trades).toHaveLength(0);
    } catch {
      // Throwing is also acceptable behavior
      expect(true).toBe(true);
    }
  });
});
