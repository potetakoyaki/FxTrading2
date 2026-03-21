import { describe, it, expect } from "vitest";
import { parseCSV, getDetectedColumns } from "./csvParser";

// ============================================================
// MT4 Standard CSV Format
// Columns: Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Swap, Profit
// ============================================================

const MT4_CSV_STANDARD = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit
12345678,2025.01.10 09:30,buy,0.10,USDJPY,150.123,149.000,152.000,2025.01.10 15:45,151.234,0.00,0.00,1110.00
12345679,2025.01.10 10:15,sell,0.20,EURUSD,1.08500,1.09000,1.07500,2025.01.10 14:30,1.08200,0.00,-1.50,600.00
12345680,2025.01.11 11:00,buy,0.30,GBPUSD,1.27000,1.26000,1.28000,2025.01.11 16:00,1.26500,-3.00,0.00,-1500.00
12345681,2025.01.12 08:00,sell,0.15,EURJPY,163.500,164.500,162.000,2025.01.12 12:30,163.200,0.00,0.50,450.00
12345682,2025.01.13 14:00,buy,0.50,GBPJPY,190.000,189.000,192.000,2025.01.13 18:00,191.500,0.00,0.00,7500.00`;

describe("MT4 CSV Parser — Standard Format", () => {
  it("should parse all 5 trades correctly", () => {
    const { trades, errors } = parseCSV(MT4_CSV_STANDARD);
    expect(trades).toHaveLength(5);
    expect(errors.filter(e => !e.includes("スキップ"))).toHaveLength(0);
  });

  it("should map columns correctly (Item→symbol, Size→volume)", () => {
    const { headers, mapping } = getDetectedColumns(MT4_CSV_STANDARD);
    expect(mapping.symbol).toBe("Item");
    expect(mapping.volume).toBe("Size");
    expect(mapping.profit).toBe("Profit");
    expect(mapping.time).toBe("Close Time");
    expect(mapping.type).toBe("Type");
    expect(mapping.swap).toBe("Swap");
    expect(mapping.commission).toBe("Commission");
  });

  it("should parse trade fields accurately", () => {
    const { trades } = parseCSV(MT4_CSV_STANDARD);
    // Trades are sorted by close time — EURUSD (14:30) comes before USDJPY (15:45)
    const usdjpy = trades.find(t => t.symbol === "USDJPY");
    expect(usdjpy).toBeDefined();
    expect(usdjpy!.volume).toBe(0.1);
    expect(usdjpy!.lots).toBe(0.1);
    expect(usdjpy!.profit).toBe(1110.0);
    expect(usdjpy!.type).toBe("buy");
  });

  it("should include commission and swap in profit calculation", () => {
    const { trades } = parseCSV(MT4_CSV_STANDARD);
    // Trade 2: profit=600 + commission=0 + swap=-1.50 = 598.50
    const trade2 = trades.find(
      t => t.symbol === "EURUSD" && t.profit === 598.5
    );
    expect(trade2).toBeDefined();

    // Trade 3: profit=-1500 + commission=-3 + swap=0 = -1503
    const trade3 = trades.find(
      t => t.symbol === "GBPUSD" && t.profit === -1503
    );
    expect(trade3).toBeDefined();
  });

  it("should sort trades by close time", () => {
    const { trades } = parseCSV(MT4_CSV_STANDARD);
    for (let i = 1; i < trades.length; i++) {
      expect(trades[i].time.getTime()).toBeGreaterThanOrEqual(
        trades[i - 1].time.getTime()
      );
    }
  });

  it("should handle duplicate Price columns (deduplication)", () => {
    const { headers } = getDetectedColumns(MT4_CSV_STANDARD);
    // First "Price" stays, second becomes "Close Price"
    expect(headers).toContain("Price");
    expect(headers).toContain("Close Price");
  });
});

// ============================================================
// MT4 CSV with balance rows (deposits/withdrawals)
// ============================================================

const MT4_CSV_WITH_BALANCE = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit
0,2025.01.01 00:00,balance,0.00,,0.00000,0.00000,0.00000,2025.01.01 00:00,0.00000,0.00,0.00,10000.00
12345678,2025.01.10 09:30,buy,0.10,USDJPY,150.123,149.000,152.000,2025.01.10 15:45,151.234,0.00,0.00,1110.00
12345679,2025.01.10 10:15,sell,0.20,EURUSD,1.08500,1.09000,1.07500,2025.01.10 14:30,1.08200,0.00,0.00,600.00`;

describe("MT4 CSV Parser — Balance Rows", () => {
  it("should skip balance rows (no symbol) and parse trades only", () => {
    const { trades } = parseCSV(MT4_CSV_WITH_BALANCE);
    expect(trades).toHaveLength(2);
    // Sorted by close time: EURUSD (14:30) before USDJPY (15:45)
    expect(trades[0].symbol).toBe("EURUSD");
    expect(trades[1].symbol).toBe("USDJPY");
  });
});

// ============================================================
// MT4 CSV with account info header lines
// ============================================================

const MT4_CSV_WITH_HEADER_INFO = `Account: 123456
Name: Test User
Currency: USD
Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit
12345678,2025.01.10 09:30,buy,0.10,USDJPY,150.123,149.000,152.000,2025.01.10 15:45,151.234,0.00,0.00,1110.00`;

describe("MT4 CSV Parser — Account Info Header Lines", () => {
  it("should skip account info lines and find header row", () => {
    const { trades, errors } = parseCSV(MT4_CSV_WITH_HEADER_INFO);
    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe("USDJPY");
  });
});

// ============================================================
// MT4 CSV with section boundaries (Open Trades / Working Orders)
// ============================================================

const MT4_CSV_WITH_SECTIONS = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit
12345678,2025.01.10 09:30,buy,0.10,USDJPY,150.123,149.000,152.000,2025.01.10 15:45,151.234,0.00,0.00,1110.00
12345679,2025.01.10 10:15,sell,0.20,EURUSD,1.08500,1.09000,1.07500,2025.01.10 14:30,1.08200,0.00,0.00,600.00
Open Trades
99999001,2025.01.15 08:00,buy,0.50,GBPJPY,190.000,189.000,192.000,,190.500,0.00,0.00,2500.00
Working Orders
99999002,,buy limit,0.10,USDJPY,149.000,148.000,151.000,,0.00000,0.00,0.00,0.00`;

describe("MT4 CSV Parser — Section Boundaries", () => {
  it("should stop at 'Open Trades' section and not include open/pending positions", () => {
    const { trades } = parseCSV(MT4_CSV_WITH_SECTIONS);
    expect(trades).toHaveLength(2);
    expect(trades.every(t => t.symbol !== "GBPJPY")).toBe(true);
  });
});

// ============================================================
// MT4 CSV with summary lines at the bottom
// ============================================================

const MT4_CSV_WITH_SUMMARY = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit
12345678,2025.01.10 09:30,buy,0.10,USDJPY,150.123,149.000,152.000,2025.01.10 15:45,151.234,0.00,0.00,1110.00
12345679,2025.01.10 10:15,sell,0.20,EURUSD,1.08500,1.09000,1.07500,2025.01.10 14:30,1.08200,0.00,0.00,600.00
Closed P/L:,,,,,,,,,,,1710.00
Balance:,,,,,,,,,,,11710.00`;

describe("MT4 CSV Parser — Summary/Footer Lines", () => {
  it("should skip summary lines like 'Closed P/L' and 'Balance'", () => {
    const { trades } = parseCSV(MT4_CSV_WITH_SUMMARY);
    expect(trades).toHaveLength(2);
  });
});

// ============================================================
// MT5 CSV format (Direction in/out pairs)
// ============================================================

const MT5_CSV_STANDARD = `Time,Deal,Symbol,Type,Direction,Volume,Price,Order,Commission,Fee,Swap,Profit,Balance,Comment
2025.01.10 09:30:00,100001,USDJPY,buy,in,0.10,150.123,200001,-3.50,0.00,0.00,0.00,10000.00,
2025.01.10 15:45:00,100002,USDJPY,buy,out,0.10,151.234,200001,0.00,0.00,0.00,1110.00,11106.50,
2025.01.11 10:00:00,100003,EURUSD,sell,in,0.20,1.08500,200002,-5.00,0.00,0.00,0.00,11106.50,
2025.01.11 14:30:00,100004,EURUSD,sell,out,0.20,1.08200,200002,0.00,0.00,-1.50,600.00,11700.00,
2025.01.12 08:00:00,100005,GBPUSD,buy,in,0.30,1.27000,200003,-7.00,0.00,0.00,0.00,11700.00,
2025.01.12 16:00:00,100006,GBPUSD,buy,out,0.30,1.26500,200003,0.00,0.00,0.00,-1500.00,10193.00,`;

describe("MT5 CSV Parser — Direction in/out Pairs", () => {
  it("should detect MT5 format and parse 3 trades from in/out pairs", () => {
    const { trades, errors } = parseCSV(MT5_CSV_STANDARD);
    expect(trades).toHaveLength(3);
  });

  it("should pair in/out rows by Order number", () => {
    const { trades } = parseCSV(MT5_CSV_STANDARD);
    expect(trades[0].symbol).toBe("USDJPY");
    expect(trades[1].symbol).toBe("EURUSD");
    expect(trades[2].symbol).toBe("GBPUSD");
  });

  it("should sum commission/swap from both in and out rows", () => {
    const { trades } = parseCSV(MT5_CSV_STANDARD);
    // USDJPY: profit=1110 + commission(in=-3.50, out=0) + swap=0 = 1106.50
    expect(trades[0].profit).toBeCloseTo(1106.5, 2);
    // EURUSD: profit=600 + commission(in=-5, out=0) + swap(out=-1.50) = 593.50
    expect(trades[1].profit).toBeCloseTo(593.5, 2);
    // GBPUSD: profit=-1500 + commission(in=-7, out=0) = -1507
    expect(trades[2].profit).toBeCloseTo(-1507, 2);
  });

  it("should use the 'out' row time as trade time", () => {
    const { trades } = parseCSV(MT5_CSV_STANDARD);
    expect(trades[0].time.getHours()).toBe(15);
    expect(trades[0].time.getMinutes()).toBe(45);
  });

  it("should extract initial balance from earliest trade Balance column", () => {
    const { initialBalance } = parseCSV(MT5_CSV_STANDARD);
    // First trade with symbol: USDJPY in row, balance=10000, profit=0, commission=-3.50
    // initialBalance = 10000 - (0 + (-3.50)) = 10003.50
    expect(initialBalance).toBeCloseTo(10003.5, 2);
  });
});

// ============================================================
// MT5 CSV — Japanese headers
// ============================================================

const MT5_CSV_JAPANESE = `時間,約定,銘柄,タイプ,新規・決済,数量,価格,注文,手数料,スワップ,損益,残高,コメント
2025.01.10 09:30:00,100001,USDJPY,buy,in,0.10,150.123,200001,-3.50,0.00,0.00,10000.00,
2025.01.10 15:45:00,100002,USDJPY,buy,out,0.10,151.234,200001,0.00,0.00,1110.00,11106.50,`;

describe("MT5 CSV Parser — Japanese Headers", () => {
  it("should detect MT5 format with Japanese headers", () => {
    const { trades } = parseCSV(MT5_CSV_JAPANESE);
    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe("USDJPY");
  });

  it("should map Japanese column names correctly", () => {
    const { mapping } = getDetectedColumns(MT5_CSV_JAPANESE);
    expect(mapping.time).toBe("時間");
    expect(mapping.symbol).toBe("銘柄");
    expect(mapping.profit).toBe("損益");
    expect(mapping.volume).toBe("数量");
    expect(mapping.type).toBe("タイプ");
    expect(mapping.direction).toBe("新規・決済");
  });
});

// ============================================================
// Edge cases
// ============================================================

describe("CSV Parser — Edge Cases", () => {
  it("should return error for empty CSV", () => {
    const { trades, errors } = parseCSV("");
    expect(trades).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should return error for CSV with no recognized columns", () => {
    const csv = `FooColumn,BarColumn,BazColumn\n1,2,3\n4,5,6`;
    const { trades, errors } = parseCSV(csv);
    expect(errors.some(e => e.includes("必須列"))).toBe(true);
  });

  it("should skip rows with invalid dates", () => {
    const csv = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit
12345678,invalid-date,buy,0.10,USDJPY,150.123,149.000,152.000,invalid-date,151.234,0.00,0.00,1110.00
12345679,2025.01.10 10:15,sell,0.20,EURUSD,1.08500,1.09000,1.07500,2025.01.10 14:30,1.08200,0.00,0.00,600.00`;
    const { trades, errors } = parseCSV(csv);
    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe("EURUSD");
    expect(errors.some(e => e.includes("スキップ"))).toBe(true);
  });

  it("should skip rows with empty symbol", () => {
    const csv = `Ticket,Close Time,Type,Size,Item,Price,Commission,Swap,Profit
12345678,2025.01.10 15:45,buy,0.10,,150.123,0.00,0.00,1110.00
12345679,2025.01.10 14:30,sell,0.20,EURUSD,1.08200,0.00,0.00,600.00`;
    const { trades } = parseCSV(csv);
    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe("EURUSD");
  });

  it("should handle various date formats", () => {
    const csv = `Ticket,Close Time,Type,Size,Item,Price,Commission,Swap,Profit
1,2025.01.10 09:30:00,buy,0.10,USDJPY,150.000,0.00,0.00,100.00
2,2025-01-11 10:00:00,buy,0.10,EURUSD,1.08000,0.00,0.00,200.00
3,2025/01/12 11:00:00,buy,0.10,GBPUSD,1.27000,0.00,0.00,300.00`;
    const { trades } = parseCSV(csv);
    expect(trades).toHaveLength(3);
  });

  it("should handle MT4 date format without seconds", () => {
    const csv = `Ticket,Close Time,Type,Size,Item,Price,Commission,Swap,Profit
1,2025.01.10 09:30,buy,0.10,USDJPY,150.000,0.00,0.00,100.00`;
    const { trades } = parseCSV(csv);
    expect(trades).toHaveLength(1);
    expect(trades[0].time.getMinutes()).toBe(30);
  });

  it("should handle NaN volume gracefully (default to 0.01)", () => {
    const csv = `Ticket,Close Time,Type,Size,Item,Price,Commission,Swap,Profit
1,2025.01.10 09:30,buy,invalid,USDJPY,150.000,0.00,0.00,100.00`;
    const { trades } = parseCSV(csv);
    expect(trades).toHaveLength(1);
    expect(trades[0].volume).toBe(0.01);
  });

  it("should handle taxes column if present", () => {
    const csv = `Ticket,Close Time,Type,Size,Item,Price,Commission,Swap,Taxes,Profit
1,2025.01.10 09:30,buy,0.10,USDJPY,150.000,0.00,0.00,-5.00,100.00`;
    const { trades } = parseCSV(csv);
    expect(trades).toHaveLength(1);
    // profit = 100 + commission(0) + swap(0) + taxes(-5) = 95
    expect(trades[0].profit).toBe(95);
  });
});

// ============================================================
// MT5 with unmatched "in" rows (open positions still running)
// ============================================================

describe("MT5 CSV Parser — Unmatched In Rows", () => {
  it("should report unmatched 'in' rows as warnings", () => {
    const csv = `Time,Deal,Symbol,Type,Direction,Volume,Price,Order,Commission,Fee,Swap,Profit,Balance,Comment
2025.01.10 09:30:00,100001,USDJPY,buy,in,0.10,150.123,200001,-3.50,0.00,0.00,0.00,10000.00,
2025.01.10 15:45:00,100002,USDJPY,buy,out,0.10,151.234,200001,0.00,0.00,0.00,1110.00,11106.50,
2025.01.11 10:00:00,100003,EURUSD,sell,in,0.20,1.08500,200002,-5.00,0.00,0.00,0.00,11106.50,`;
    const { trades, errors } = parseCSV(csv);
    expect(trades).toHaveLength(1);
    expect(errors.some(e => e.includes("未決済ポジション"))).toBe(true);
  });
});

// ============================================================
// Large dataset stability test
// ============================================================

describe("CSV Parser — Large Dataset", () => {
  it("should handle 1000 trades without errors", () => {
    const header =
      "Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit";
    const rows: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const day = String(1 + (i % 28)).padStart(2, "0");
      const month = String(1 + Math.floor(i / 28) % 12).padStart(2, "0");
      const profit = (Math.random() * 2000 - 1000).toFixed(2);
      rows.push(
        `${10000000 + i},2025.${month}.${day} 10:00,buy,0.10,USDJPY,150.000,149.000,151.000,2025.${month}.${day} 15:00,150.500,0.00,0.00,${profit}`
      );
    }
    const csv = [header, ...rows].join("\n");
    const { trades, errors } = parseCSV(csv);
    expect(trades).toHaveLength(1000);
    expect(errors.filter(e => !e.includes("スキップ"))).toHaveLength(0);
  });
});
