import { describe, it, expect } from "vitest";
import { htmlToCSV, isHtmlFile } from "./htmlParser";
import { parseCSV } from "./csvParser";

// Helper: convert string to ArrayBuffer (UTF-8)
function toArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer as ArrayBuffer;
}

// Helper: convert string to UTF-16 LE ArrayBuffer with BOM
function toUTF16LEArrayBuffer(str: string): ArrayBuffer {
  const bom = new Uint8Array([0xff, 0xfe]);
  const buf = new ArrayBuffer(str.length * 2);
  const view = new Uint16Array(buf);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  const combined = new Uint8Array(bom.length + buf.byteLength);
  combined.set(bom, 0);
  combined.set(new Uint8Array(buf), bom.length);
  return combined.buffer as ArrayBuffer;
}

// ============================================================
// MT4 HTML — Standard "Detailed Statement" format
// ============================================================

const MT4_HTML_STANDARD = `<html>
<head><title>Statement</title></head>
<body>
<table>
<tr><td colspan="14">Closed Transactions</td></tr>
<tr>
  <td>Ticket</td><td>Open Time</td><td>Type</td><td>Size</td><td>Item</td>
  <td>Price</td><td>S/L</td><td>T/P</td><td>Close Time</td><td>Price</td>
  <td>Commission</td><td>Swap</td><td>Profit</td><td>Comment</td>
</tr>
<tr>
  <td>12345678</td><td>2025.01.10 09:30</td><td>buy</td><td>0.10</td><td>USDJPY</td>
  <td>150.123</td><td>149.000</td><td>152.000</td><td>2025.01.10 15:45</td><td>151.234</td>
  <td>0.00</td><td>0.00</td><td>1110.00</td><td></td>
</tr>
<tr>
  <td>12345679</td><td>2025.01.10 10:15</td><td>sell</td><td>0.20</td><td>EURUSD</td>
  <td>1.08500</td><td>1.09000</td><td>1.07500</td><td>2025.01.10 14:30</td><td>1.08200</td>
  <td>-2.00</td><td>-1.50</td><td>600.00</td><td></td>
</tr>
<tr>
  <td>12345680</td><td>2025.01.11 11:00</td><td>buy</td><td>0.30</td><td>GBPUSD</td>
  <td>1.27000</td><td>1.26000</td><td>1.28000</td><td>2025.01.11 16:00</td><td>1.26500</td>
  <td>-3.00</td><td>0.00</td><td>-1500.00</td><td></td>
</tr>
<tr><td colspan="14">Open Trades</td></tr>
<tr>
  <td>Ticket</td><td>Open Time</td><td>Type</td><td>Size</td><td>Item</td>
  <td>Price</td><td>S/L</td><td>T/P</td><td>Close Time</td><td>Price</td>
  <td>Commission</td><td>Swap</td><td>Profit</td><td>Comment</td>
</tr>
<tr>
  <td>99999001</td><td>2025.01.15 08:00</td><td>buy</td><td>0.50</td><td>GBPJPY</td>
  <td>190.000</td><td>189.000</td><td>192.000</td><td></td><td>190.500</td>
  <td>0.00</td><td>0.00</td><td>2500.00</td><td></td>
</tr>
<tr><td colspan="14">Working Orders</td></tr>
<tr>
  <td>99999002</td><td></td><td>buy limit</td><td>0.10</td><td>USDJPY</td>
  <td>149.000</td><td>148.000</td><td>151.000</td><td></td><td>0.00</td>
  <td>0.00</td><td>0.00</td><td>0.00</td><td></td>
</tr>
</table>
</body>
</html>`;

describe("MT4 HTML Parser — Standard Detailed Statement", () => {
  it("should extract only Closed Transactions (not Open Trades)", async () => {
    const buf = toArrayBuffer(MT4_HTML_STANDARD);
    const csvText = await htmlToCSV(buf);
    const { trades } = parseCSV(csvText);
    expect(trades).toHaveLength(3);
    expect(trades.every(t => t.symbol !== "GBPJPY")).toBe(true);
  });

  it("should correctly extract trade data from HTML cells", async () => {
    const buf = toArrayBuffer(MT4_HTML_STANDARD);
    const csvText = await htmlToCSV(buf);
    const { trades } = parseCSV(csvText);
    const usdjpy = trades.find(t => t.symbol === "USDJPY");
    expect(usdjpy).toBeDefined();
    expect(usdjpy!.profit).toBe(1110.0);
    expect(usdjpy!.volume).toBe(0.1);
  });
});

// ============================================================
// MT4 HTML — Without explicit "Closed Transactions" header
// ============================================================

const MT4_HTML_NO_CLOSED_HEADER = `<html>
<body>
<table>
<tr>
  <td>Ticket</td><td>Open Time</td><td>Type</td><td>Size</td><td>Item</td>
  <td>Price</td><td>S/L</td><td>T/P</td><td>Close Time</td><td>Price</td>
  <td>Commission</td><td>Swap</td><td>Profit</td>
</tr>
<tr>
  <td>12345678</td><td>2025.01.10 09:30</td><td>buy</td><td>0.10</td><td>USDJPY</td>
  <td>150.123</td><td>149.000</td><td>152.000</td><td>2025.01.10 15:45</td><td>151.234</td>
  <td>0.00</td><td>0.00</td><td>1110.00</td>
</tr>
<tr>
  <td>12345679</td><td>2025.01.10 10:15</td><td>sell</td><td>0.20</td><td>EURUSD</td>
  <td>1.08500</td><td>1.09000</td><td>1.07500</td><td>2025.01.10 14:30</td><td>1.08200</td>
  <td>0.00</td><td>0.00</td><td>600.00</td>
</tr>
<tr><td colspan="13">Open Trades</td></tr>
<tr>
  <td>99999001</td><td>2025.01.15 08:00</td><td>buy</td><td>0.50</td><td>GBPJPY</td>
  <td>190.000</td><td>189.000</td><td>192.000</td><td></td><td>190.500</td>
  <td>0.00</td><td>0.00</td><td>2500.00</td>
</tr>
</table>
</body>
</html>`;

describe("MT4 HTML Parser — No 'Closed Transactions' Header", () => {
  it("should still stop at 'Open Trades' section", async () => {
    const buf = toArrayBuffer(MT4_HTML_NO_CLOSED_HEADER);
    const csvText = await htmlToCSV(buf);
    const { trades } = parseCSV(csvText);
    expect(trades).toHaveLength(2);
    expect(trades.every(t => t.symbol !== "GBPJPY")).toBe(true);
  });
});

// ============================================================
// MT4 HTML — Balance/deposit rows
// ============================================================

const MT4_HTML_WITH_BALANCE = `<html>
<body>
<table>
<tr><td colspan="13">Closed Transactions</td></tr>
<tr>
  <td>Ticket</td><td>Open Time</td><td>Type</td><td>Size</td><td>Item</td>
  <td>Price</td><td>S/L</td><td>T/P</td><td>Close Time</td><td>Price</td>
  <td>Commission</td><td>Swap</td><td>Profit</td>
</tr>
<tr>
  <td>0</td><td>2025.01.01 00:00</td><td>balance</td><td>0.00</td><td></td>
  <td>0.00</td><td>0.00</td><td>0.00</td><td>2025.01.01 00:00</td><td>0.00</td>
  <td>0.00</td><td>0.00</td><td>10000.00</td>
</tr>
<tr>
  <td>12345678</td><td>2025.01.10 09:30</td><td>buy</td><td>0.10</td><td>USDJPY</td>
  <td>150.123</td><td>149.000</td><td>152.000</td><td>2025.01.10 15:45</td><td>151.234</td>
  <td>0.00</td><td>0.00</td><td>1110.00</td>
</tr>
</table>
</body>
</html>`;

describe("MT4 HTML Parser — Balance Rows", () => {
  it("should skip balance rows and parse only real trades", async () => {
    const buf = toArrayBuffer(MT4_HTML_WITH_BALANCE);
    const csvText = await htmlToCSV(buf);
    const { trades } = parseCSV(csvText);
    // Balance row has empty Item, so csvParser skips it (no symbol)
    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe("USDJPY");
  });
});

// ============================================================
// MT4 HTML — Numbers with space thousands separators
// ============================================================

const MT4_HTML_SPACE_NUMBERS = `<html>
<body>
<table>
<tr><td colspan="13">Closed Transactions</td></tr>
<tr>
  <td>Ticket</td><td>Open Time</td><td>Type</td><td>Size</td><td>Item</td>
  <td>Price</td><td>S/L</td><td>T/P</td><td>Close Time</td><td>Price</td>
  <td>Commission</td><td>Swap</td><td>Profit</td>
</tr>
<tr>
  <td>12345678</td><td>2025.01.10 09:30</td><td>buy</td><td>0.10</td><td>USDJPY</td>
  <td>150.123</td><td>149.000</td><td>152.000</td><td>2025.01.10 15:45</td><td>151.234</td>
  <td>0.00</td><td>0.00</td><td>4\u00a0074.50</td>
</tr>
</table>
</body>
</html>`;

describe("MT4 HTML Parser — Non-breaking Space in Numbers", () => {
  it("should normalize non-breaking spaces in numbers (e.g., '4 074' → '4074')", async () => {
    const buf = toArrayBuffer(MT4_HTML_SPACE_NUMBERS);
    const csvText = await htmlToCSV(buf);
    // The CSV should contain "4074.50" not "4 074.50"
    expect(csvText).toContain("4074.50");
    const { trades } = parseCSV(csvText);
    expect(trades).toHaveLength(1);
    expect(trades[0].profit).toBeCloseTo(4074.5, 2);
  });
});

// ============================================================
// MT5 HTML — "約定" section (deals)
// ============================================================

const MT5_HTML_DEALS = `<html>
<body>
<table>
<tr><td colspan="15">ポジション一覧</td></tr>
<tr><td>銘柄</td><td>チケット</td><td>時間</td></tr>
<tr><td>USDJPY</td><td>999</td><td>2025.01.10</td></tr>
<tr><td colspan="15">注文</td></tr>
<tr><td>チケット</td><td>時間</td></tr>
<tr><td>998</td><td>2025.01.10</td></tr>
<tr><td colspan="15">約定</td></tr>
<tr>
  <td>時間</td><td>約定</td><td>銘柄</td><td>タイプ</td><td>新規・決済</td>
  <td>数量</td><td>価格</td><td>注文</td><td>費用</td><td>手数料</td><td>手数料</td>
  <td>スワップ</td><td>損益</td><td>残高</td><td>コメント</td>
</tr>
<tr>
  <td>2025.01.10 09:30:00</td><td>100001</td><td>USDJPY</td><td>buy</td><td>in</td>
  <td>0.10</td><td>150.123</td><td>200001</td><td>0</td><td>-3.50</td><td>0</td>
  <td>0.00</td><td>0.00</td><td>10000.00</td><td></td>
</tr>
<tr>
  <td>2025.01.10 15:45:00</td><td>100002</td><td>USDJPY</td><td>buy</td><td>out</td>
  <td>0.10</td><td>151.234</td><td>200001</td><td>0</td><td>0.00</td><td>0</td>
  <td>0.00</td><td>1110.00</td><td>11106.50</td><td></td>
</tr>
<tr>
  <td>2025.01.11 10:00:00</td><td>100003</td><td>EURUSD</td><td>sell</td><td>in</td>
  <td>0.20</td><td>1.08500</td><td>200002</td><td>0</td><td>-5.00</td><td>0</td>
  <td>0.00</td><td>0.00</td><td>11106.50</td><td></td>
</tr>
<tr>
  <td>2025.01.11 14:30:00</td><td>100004</td><td>EURUSD</td><td>sell</td><td>out</td>
  <td>0.20</td><td>1.08200</td><td>200002</td><td>0</td><td>0.00</td><td>0</td>
  <td>-1.50</td><td>600.00</td><td>11700.00</td><td></td>
</tr>
<tr><td colspan="15">結果</td></tr>
<tr><td>Total:</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>-8.50</td><td></td><td>-1.50</td><td>1710.00</td><td></td><td></td></tr>
</table>
</body>
</html>`;

describe("MT5 HTML Parser — 約定 (Deals) Section", () => {
  it("should extract only 約定 section data", async () => {
    const buf = toArrayBuffer(MT5_HTML_DEALS);
    const csvText = await htmlToCSV(buf);
    const { trades } = parseCSV(csvText);
    expect(trades).toHaveLength(2);
  });

  it("should stop at 結果 (Result) section", async () => {
    const buf = toArrayBuffer(MT5_HTML_DEALS);
    const csvText = await htmlToCSV(buf);
    expect(csvText).not.toContain("Total");
  });

  it("should pair in/out rows correctly via csvParser", async () => {
    const buf = toArrayBuffer(MT5_HTML_DEALS);
    const csvText = await htmlToCSV(buf);
    const { trades } = parseCSV(csvText);
    expect(trades[0].symbol).toBe("USDJPY");
    expect(trades[1].symbol).toBe("EURUSD");
  });
});

// ============================================================
// MT5 HTML — UTF-16 LE encoding
// ============================================================

describe("MT5 HTML Parser — UTF-16 LE Encoding", () => {
  it("should decode UTF-16 LE with BOM correctly", async () => {
    const html = `<html><body><table>
<tr><td colspan="15">約定</td></tr>
<tr><td>時間</td><td>約定</td><td>銘柄</td><td>タイプ</td><td>新規・決済</td><td>数量</td><td>価格</td><td>注文</td><td>費用</td><td>手数料</td><td>スワップ</td><td>損益</td><td>残高</td><td>コメント</td></tr>
<tr><td>2025.01.10 09:30:00</td><td>100001</td><td>USDJPY</td><td>buy</td><td>in</td><td>0.10</td><td>150.123</td><td>200001</td><td>0</td><td>-3.50</td><td>0.00</td><td>0.00</td><td>10000.00</td><td></td></tr>
<tr><td>2025.01.10 15:45:00</td><td>100002</td><td>USDJPY</td><td>buy</td><td>out</td><td>0.10</td><td>151.234</td><td>200001</td><td>0</td><td>0.00</td><td>0.00</td><td>1110.00</td><td>11106.50</td><td></td></tr>
</table></body></html>`;
    const buf = toUTF16LEArrayBuffer(html);
    const csvText = await htmlToCSV(buf);
    const { trades } = parseCSV(csvText);
    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe("USDJPY");
  });
});

// ============================================================
// isHtmlFile utility
// ============================================================

describe("isHtmlFile", () => {
  it("should detect .html files", () => {
    expect(isHtmlFile("report.html")).toBe(true);
    expect(isHtmlFile("Report.HTML")).toBe(true);
  });

  it("should detect .htm files", () => {
    expect(isHtmlFile("statement.htm")).toBe(true);
    expect(isHtmlFile("Statement.HTM")).toBe(true);
  });

  it("should reject non-HTML files", () => {
    expect(isHtmlFile("data.csv")).toBe(false);
    expect(isHtmlFile("report.xlsx")).toBe(false);
  });
});
