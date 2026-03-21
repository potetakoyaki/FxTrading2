import { describe, it, expect } from "vitest";
import { generateSampleCSV } from "./sampleData";
import { parseCSV } from "./csvParser";

describe("generateSampleCSV", () => {
  it("returns non-empty string", () => {
    const csv = generateSampleCSV();
    expect(csv.length).toBeGreaterThan(0);
  });

  it("first line is valid CSV header with expected columns", () => {
    const csv = generateSampleCSV();
    const firstLine = csv.split("\n")[0];
    expect(firstLine).toBe(
      "Ticket,Open Time,Close Time,Type,Size,Item,Price,Price,Commission,Swap,Profit"
    );
  });

  it("has correct number of data rows (30 trades)", () => {
    const csv = generateSampleCSV();
    const lines = csv.split("\n").filter(l => l.trim() !== "");
    // 1 header + 30 data rows
    expect(lines.length).toBe(31);
  });

  it("all rows have same number of columns as header", () => {
    const csv = generateSampleCSV();
    const lines = csv.split("\n").filter(l => l.trim() !== "");
    const headerColCount = lines[0].split(",").length;

    lines.slice(1).forEach((line, i) => {
      const cols = line.split(",");
      expect(cols).toHaveLength(headerColCount);
    });
  });

  it("parseable by csvParser.parseCSV — produces trades", () => {
    const csv = generateSampleCSV();
    const { trades, errors } = parseCSV(csv);
    // Should produce trades (some rows might have minor warnings but trades should exist)
    expect(trades.length).toBeGreaterThan(0);
    expect(trades.length).toBe(30);
  });

  it("all parsed trades have valid fields (date, symbol, profit, volume)", () => {
    const csv = generateSampleCSV();
    const { trades } = parseCSV(csv);

    trades.forEach(trade => {
      // date is a valid Date
      expect(trade.time).toBeInstanceOf(Date);
      expect(isNaN(trade.time.getTime())).toBe(false);

      // symbol is a non-empty string
      expect(typeof trade.symbol).toBe("string");
      expect(trade.symbol.length).toBeGreaterThan(0);

      // profit is a finite number
      expect(typeof trade.profit).toBe("number");
      expect(isFinite(trade.profit)).toBe(true);

      // volume is a positive number
      expect(typeof trade.volume).toBe("number");
      expect(trade.volume).toBeGreaterThan(0);

      // lots matches volume
      expect(trade.lots).toBe(trade.volume);
    });
  });

  it("contains mix of buy and sell types", () => {
    const csv = generateSampleCSV();
    const { trades } = parseCSV(csv);

    const types = new Set(trades.map(t => t.type.toLowerCase()));
    expect(types.has("buy")).toBe(true);
    expect(types.has("sell")).toBe(true);
  });

  it("contains multiple currency pairs", () => {
    const csv = generateSampleCSV();
    const { trades } = parseCSV(csv);

    const symbols = new Set(trades.map(t => t.symbol));
    // The sample data uses 9 different pairs, at least several should appear
    expect(symbols.size).toBeGreaterThanOrEqual(5);
  });
});
