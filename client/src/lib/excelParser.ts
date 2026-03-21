/**
 * Excel file parser for MT4/MT5 trade history reports.
 * Converts .xlsx/.xls files to CSV text that can be fed into the existing csvParser.
 *
 * MT5 Excel report structure (actual format):
 * - Sheet: 'Sheet1'
 * - Row 1: "取引履歴レポート" (title)
 * - Rows 2-5: Account info (名前, 口座, 会社, 日付)
 * - Row 6: "ポジション一覧" (section header)
 * - Row 7: Column headers for open positions
 * - Rows 8-N: Open position data
 * - Row N+1: "注文" (section header)
 * - Row N+2: Column headers for orders
 * - Rows N+3-M: Order data
 * - Row M+1: "約定" (section header) ← THIS IS WHAT WE NEED
 * - Row M+2: Column headers: 時間, 約定, 銘柄, タイプ, 新規・決済, 数量, 価格, 注文, 費用, 手数料, スワップ, 損益, 残高, コメント
 * - Rows M+3-...: Deal data (in/out pairs)
 */
import * as XLSX from "xlsx";

/**
 * Read an Excel file (ArrayBuffer) and convert to CSV text.
 * For MT5 format, extracts the "約定" (deals) section.
 * For MT4 format, extracts the main trade history table.
 */
export function excelToCSV(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });

  if (workbook.SheetNames.length === 0) {
    throw new Error("Excelファイルにシートが含まれていません。");
  }

  // Pick the best sheet
  const sheetName = pickBestSheetName(workbook);
  const sheet = workbook.Sheets[sheetName];

  // Convert entire sheet to array of arrays (keep raw values, no date conversion)
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  if (rawData.length === 0) {
    throw new Error("Excelシートにデータが含まれていません。");
  }

  // Try MT5 format: look for "約定" section
  const mt5CSV = tryExtractMT5DealsSection(rawData);
  if (mt5CSV) {
    return mt5CSV;
  }

  // Fallback: find the header row and extract from there
  return extractFromHeaderRow(rawData);
}

/** Section header keywords that indicate the deals/trades section */
const DEALS_SECTION_KEYWORDS = [
  "約定",
  "deals",
  "trades",
  "取引履歴",
  "trade history",
];

/** Section header keywords that indicate non-trade sections to stop at */
const STOP_SECTION_KEYWORDS = [
  "結果",
  "result",
  "残高",
  "balance",
  "有効証拠金",
  "equity",
  "summary",
];

function tryExtractMT5DealsSection(data: unknown[][]): string | null {
  let dealsHeaderRowIndex = -1;

  // Scan for the "約定" section header
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const nonNull = row.filter(v => v !== null && v !== undefined);
    if (nonNull.length === 1) {
      const val = String(nonNull[0]).trim().toLowerCase();
      if (DEALS_SECTION_KEYWORDS.some(kw => val === kw.toLowerCase())) {
        dealsHeaderRowIndex = i;
        break;
      }
    }
  }

  if (dealsHeaderRowIndex === -1) return null;

  // Next row is the column header
  const columnHeaderRow = data[dealsHeaderRowIndex + 1];
  if (!columnHeaderRow) return null;

  const headers = columnHeaderRow.map(v => String(v ?? "").trim());

  // Translate Japanese MT5 headers to English for csvParser compatibility
  const JP_TO_EN: Record<string, string> = {
    時間: "Time",
    約定: "Deal",
    銘柄: "Symbol",
    タイプ: "Type",
    "新規・決済": "Direction",
    数量: "Volume",
    価格: "Price",
    注文: "Order",
    費用: "Fee",
    手数料: "Commission",
    スワップ: "Swap",
    損益: "Profit",
    残高: "Balance",
    コメント: "Comment",
  };
  // Translate headers, handling duplicate column names.
  // MT5 reports often have column 8 = 費用 (Fee) and column 9 = 手数料 (Commission),
  // but some brokers export both as 手数料. In that case, the first occurrence at
  // the expected Fee position is treated as Fee (matching the known MT5 column order).
  const translatedHeaders = headers.map(h => JP_TO_EN[h] ?? h);
  const seenCols = new Set<string>();
  for (let i = 0; i < translatedHeaders.length; i++) {
    const h = translatedHeaders[i];
    if (!h) continue;
    if (seenCols.has(h)) {
      // Duplicate "Commission" → the first was actually Fee in MT5 layout
      if (h === "Commission") {
        const firstIdx = translatedHeaders.indexOf(h);
        if (firstIdx >= 0 && firstIdx < i) {
          translatedHeaders[firstIdx] = "Fee";
        }
      }
    }
    seenCols.add(h);
  }

  // Strip trailing empty columns from header
  let lastNonEmptyIdx = translatedHeaders.length - 1;
  while (lastNonEmptyIdx > 0 && !translatedHeaders[lastNonEmptyIdx]) {
    lastNonEmptyIdx--;
  }
  const numCols = lastNonEmptyIdx + 1;
  const trimmedHeaders = translatedHeaders.slice(0, numCols);

  // Build CSV from deals section (use translated English headers)
  const csvRows: string[] = [trimmedHeaders.join(",")];

  const symbolIdx = findColIndex(headers, ["銘柄", "symbol", "item"]);

  for (let i = dealsHeaderRowIndex + 2; i < data.length; i++) {
    const row = data[i];
    const nonNull = row.filter(v => v !== null && v !== undefined);

    // Stop at next section header
    if (nonNull.length <= 2) {
      const firstVal = String(row[0] ?? "")
        .trim()
        .toLowerCase();
      if (
        firstVal &&
        STOP_SECTION_KEYWORDS.some(kw => firstVal.includes(kw.toLowerCase()))
      ) {
        break;
      }
      if (nonNull.length === 1 && firstVal && !firstVal.match(/^\d/)) {
        break; // Another section header
      }
      if (nonNull.length === 0) continue;
    }

    // Format cells and trim to header column count
    const cells = row.slice(0, numCols).map(v => formatExcelCell(v));

    // Skip rows with no symbol (balance/deposit rows)
    if (symbolIdx >= 0 && !cells[symbolIdx]) continue;

    const line = cells
      .map(v => {
        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      })
      .join(",");

    csvRows.push(line);
  }

  if (csvRows.length < 3) return null;

  return csvRows.join("\n");
}

/** Section boundary keywords — stop extracting when encountered (MT4 Excel fallback) */
const SECTION_BREAK_KEYWORDS = [
  "open trades",
  "working orders",
  "cancelled orders",
  "deleted orders",
  "summary",
  "未決済",
  "ワーキング",
];

function extractFromHeaderRow(data: unknown[][]): string {
  const headerRowIndex = findHeaderRow(data);

  const csvLines: string[] = [];
  for (let i = headerRowIndex; i < data.length; i++) {
    const row = data[i];
    const nonNull = row.filter(v => v !== null && v !== undefined);

    // Stop at section boundaries (e.g., "Open Trades" in MT4 Excel reports)
    if (i > headerRowIndex && nonNull.length === 1) {
      const val = String(nonNull[0]).trim().toLowerCase();
      if (val && SECTION_BREAK_KEYWORDS.some(kw => val === kw)) {
        break;
      }
    }

    const line = row
      .map(cell => {
        const v = formatExcelCell(cell);
        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      })
      .join(",");
    csvLines.push(line);
  }

  return csvLines.join("\n");
}

/**
 * Format an Excel cell value to a string suitable for CSV.
 * Handles numbers (including Excel serial date numbers), strings, etc.
 */
function formatExcelCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "number") {
    // Check if it looks like an Excel date serial number
    // Excel dates are typically between 1 (Jan 1, 1900) and ~50000 (year ~2036)
    // But trade IDs can also be large numbers, so we use a heuristic:
    // If the number is between 25569 (Jan 1, 1970) and 50000 (year ~2036)
    // AND the context suggests it's a date, we convert it.
    // For safety, we just return the raw number for large integers (deal IDs, order IDs)
    // and let the csvParser handle date strings.

    // If it's a very large integer, it's likely a deal/order ID
    if (Number.isInteger(value) && value > 100000000) {
      return String(value);
    }

    // Check if it could be an Excel date serial number.
    // Non-integer values include a time component (e.g., 45678.75 = date + 18:00).
    // We restrict to >= 25569 (1970-01-01) to avoid false positives on small floats
    // like lot sizes (1.5) or FX prices (1.12345).
    // Integer dates (midnight) are limited to the 40000-50000 range (~2009-2036).
    if (
      (value >= 25569 && value <= 73050 && !Number.isInteger(value)) ||
      (value >= 40000 && value <= 50000 && Number.isInteger(value))
    ) {
      // Convert Excel serial date to string using XLSX.SSF.parse_date_code.
      const date = XLSX.SSF?.parse_date_code?.(value);
      if (date) {
        const y = date.y;
        const m = String(date.m).padStart(2, "0");
        const d = String(date.d).padStart(2, "0");
        const H = String(date.H).padStart(2, "0");
        const M = String(date.M).padStart(2, "0");
        const S = String(date.S).padStart(2, "0");
        return `${y}.${m}.${d} ${H}:${M}:${S}`;
      }
    }

    return String(value);
  }

  if (typeof value === "string") {
    // Remove non-breaking spaces and normalize
    return value.replace(/\u00a0/g, "").trim();
  }

  return String(value);
}

/** Known sheet name keywords (case-insensitive) */
const SHEET_KEYWORDS = [
  "positions",
  "deals",
  "orders",
  "history",
  "trades",
  "口座履歴",
  "ポジション",
  "約定",
  "注文",
  "取引",
];

function pickBestSheetName(workbook: XLSX.WorkBook): string {
  for (const name of workbook.SheetNames) {
    const lower = name.toLowerCase();
    if (SHEET_KEYWORDS.some(kw => lower.includes(kw))) {
      return name;
    }
  }
  return workbook.SheetNames[0];
}

/** Header detection patterns */
const HEADER_PATTERNS = [
  /ticket/i,
  /open\s*time/i,
  /close\s*time/i,
  /symbol/i,
  /item/i,
  /profit/i,
  /pnl/i,
  /p\/l/i,
  /deal/i,
  /direction/i,
  /balance/i,
  /time/i,
  /order/i,
  /通貨/i,
  /銘柄/i,
  /損益/i,
  /利益/i,
  /約定/i,
  /タイプ/i,
  /新規/i,
];

function findHeaderRow(data: unknown[][]): number {
  const scanLimit = Math.min(data.length, 30);

  for (let i = 0; i < scanLimit; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    const rowText = row.map(c => String(c ?? "")).join(" ");
    const matchCount = HEADER_PATTERNS.filter(p => p.test(rowText)).length;

    if (matchCount >= 2) return i;
  }

  // Fallback: first non-empty row with enough columns
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (
      row &&
      row.filter(c => c !== null && c !== undefined && String(c).trim() !== "")
        .length >= 3
    ) {
      return i;
    }
  }

  return 0;
}

function findColIndex(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex(
      h =>
        h.toLowerCase().trim() === candidate.toLowerCase() ||
        h.toLowerCase().includes(candidate.toLowerCase())
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Check if a file name has an Excel extension.
 */
export function isExcelFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xml")
  );
}

/**
 * Supported file extensions for upload.
 */
export const SUPPORTED_EXTENSIONS = [
  ".csv",
  ".xlsx",
  ".xls",
  ".xml",
  ".htm",
  ".html",
];

export function isSupportedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext));
}
