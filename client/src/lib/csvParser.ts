import Papa from "papaparse";

export interface TradeRecord {
  time: Date;
  symbol: string;
  profit: number;
  volume: number;
  lots: number; // alias for volume, for readability
  type: string;
  price: number;
}

// Column name mapping for different brokers / formats
// Includes Japanese MT5 headers: 時間, 銘柄, タイプ, 新規・決済, 数量, 価格, 注文, スワップ, 損益
const COLUMN_MAPPINGS: Record<string, string[]> = {
  time: [
    "close time",
    "closetime",
    "close_time",
    "open time",
    "opentime",
    "open_time",
    "time",
    "date",
    "datetime",
    "時間", // MT5 Japanese
  ],
  symbol: [
    "symbol",
    "item",
    "pair",
    "instrument",
    "currency",
    "currency pair",
    "通貨ペア",
    "銘柄",
  ],
  profit: [
    "profit",
    "pnl",
    "net profit",
    "netprofit",
    "net_profit",
    "p/l",
    "pl",
    "gain",
    "損益",
    "利益",
  ],
  volume: [
    "size",
    "volume",
    "lot",
    "lots",
    "lot size",
    "lotsize",
    "quantity",
    "ロット",
    "数量", // MT5 Japanese
  ],
  type: [
    "type",
    "side",
    "action",
    "order type",
    "ordertype",
    "売買",
    "タイプ", // MT5 Japanese
  ],
  price: [
    "price",
    "open price",
    "openprice",
    "open_price",
    "entry",
    "entry price",
    "始値",
    "価格", // MT5 Japanese
  ],
  commission: ["commission", "手数料"],
  swap: ["swap", "スワップ"],
  taxes: ["taxes", "tax", "税金"],
  fee: [
    "fee",
    "fees",
    "費用", // MT5 Japanese
  ],
  balance: [
    "balance",
    "残高", // MT5 Japanese
  ],
  direction: [
    "direction",
    "新規・決済", // MT5 Japanese in/out
  ],
  order: [
    "order",
    "注文", // MT5 Japanese
  ],
};

function normalizeColumnName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, " ");
}

/**
 * MT4/MT5 CSVs often have duplicate column names (e.g., two "Price" columns).
 * We handle this by renaming duplicates before parsing.
 */
function deduplicateHeaders(headerLine: string): string {
  // Use PapaParse to correctly split headers (handles quoted fields with commas)
  const parsed = Papa.parse(headerLine, { header: false });
  const cols: string[] =
    parsed.data.length > 0 ? (parsed.data[0] as string[]) : [];
  const seen: Record<string, number> = {};
  const result: string[] = [];

  for (const col of cols) {
    const trimmed = (col || "").trim();
    const key = trimmed.toLowerCase();
    if (seen[key] !== undefined) {
      seen[key]++;
      // For MT4: first Price = Open Price, second Price = Close Price
      if (key === "price") {
        result.push(`Close ${trimmed}`);
      } else {
        result.push(`${trimmed}_${seen[key]}`);
      }
    } else {
      seen[key] = 0;
      result.push(trimmed);
    }
  }
  return result.join(",");
}

/**
 * Pre-process CSV text to handle MT4/MT5 specific formats:
 * - Skip account info lines at the top
 * - Skip summary/footer lines
 * - Handle duplicate column headers
 * - Remove empty lines
 */
function preprocessCSV(csvText: string): string {
  const lines = csvText.split(/\r?\n/);
  let headerLineIndex = -1;

  const headerPatterns = [
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
  ];

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const matchCount = headerPatterns.filter(p => p.test(line)).length;
    if (matchCount >= 2) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith("#")) continue;
      if (line.split(",").length >= 3) {
        headerLineIndex = i;
        break;
      }
    }
  }

  if (headerLineIndex === -1) {
    return csvText;
  }

  // Remove empty/invalid trailing columns from header (e.g., ", , _1" from Excel export)
  const rawHeaderLine = lines[headerLineIndex];
  const headerCols = rawHeaderLine.split(",");
  // Find the last meaningful column (non-empty, not just "_N")
  let lastMeaningfulIdx = headerCols.length - 1;
  while (lastMeaningfulIdx > 0) {
    const col = headerCols[lastMeaningfulIdx].trim();
    if (col && !col.match(/^_\d+$/) && col !== "__EMPTY") break;
    lastMeaningfulIdx--;
  }
  const trimmedHeaderLine = headerCols
    .slice(0, lastMeaningfulIdx + 1)
    .join(",");
  const deduplicatedHeader = deduplicateHeaders(trimmedHeaderLine);
  const numCols = lastMeaningfulIdx + 1;

  // Patterns for rows to skip (individual summary lines)
  const summaryPatterns = [
    /^closed\s*p\/l/i,
    /^balance/i,
    /^credit/i,
    /^floating\s*p\/l/i,
    /^margin/i,
    /^free\s*margin/i,
    /^total/i,
    /^equity/i,
    /^summary/i,
    /^合計/,
    /^残高/,
  ];

  // Section boundary patterns — stop processing entirely when encountered.
  // These mark the start of non-closed-trade sections in MT4 HTML-to-CSV output.
  const sectionBreakPatterns = [
    /^open\s*trades?/i,
    /^working\s*orders?/i,
    /^cancelled?\s*orders?/i,
    /^deleted?\s*orders?/i,
    /^summary$/i,
    /^未決済/,
    /^ワーキング/,
  ];

  const dataLines: string[] = [deduplicatedHeader];

  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Stop at section boundaries (e.g., "Open Trades" section in MT4 reports)
    if (sectionBreakPatterns.some(p => p.test(line))) break;

    const isSummary = summaryPatterns.some(p => p.test(line));
    if (isSummary) continue;

    const nonEmptyFields = line.split(",").filter(f => f.trim() !== "");
    if (nonEmptyFields.length < 3) continue;

    // Trim data rows to match header column count (remove trailing empty Excel cells)
    const rowCols = lines[i].split(",");
    const trimmedRow = rowCols.slice(0, numCols).join(",");
    dataLines.push(trimmedRow);
  }

  return dataLines.join("\n");
}

function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map(normalizeColumnName);

  for (const [targetCol, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    // First pass: try exact match
    let found = false;
    for (const alias of aliases) {
      const idx = normalizedHeaders.indexOf(alias);
      if (idx !== -1) {
        mapping[targetCol] = headers[idx];
        found = true;
        break;
      }
    }
    // Second pass: try startsWith match for headers like "Profit (USD)", "Symbol (MT4)"
    if (!found) {
      for (const alias of aliases) {
        const idx = normalizedHeaders.findIndex(h => h.startsWith(alias));
        if (idx !== -1) {
          mapping[targetCol] = headers[idx];
          break;
        }
      }
    }
  }

  const closeIdx = normalizedHeaders.findIndex(h => h === "close price");
  if (closeIdx !== -1 && !mapping.closePrice) {
    mapping.closePrice = headers[closeIdx];
  }

  return mapping;
}

function parseDate(value: string): Date {
  if (!value) return new Date(NaN);

  const trimmed = value.trim();

  // Try "YYYY.MM.DD HH:MM:SS" format (MT4/MT5 standard)
  const mt4Match = trimmed.match(
    /^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s+(\d{1,2}):(\d{2}):?(\d{2})?$/
  );
  if (mt4Match) {
    const [, y, m, d, h, min, sec] = mt4Match;
    return new Date(
      parseInt(y),
      parseInt(m) - 1,
      parseInt(d),
      parseInt(h),
      parseInt(min),
      parseInt(sec || "0")
    );
  }

  // Try "DD.MM.YYYY HH:MM:SS" or "DD/MM/YYYY HH:MM:SS" (European MT4 format)
  const euMatch = trimmed.match(
    /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?$/
  );
  if (euMatch) {
    const [, d2, m2, y2, h2, min2, sec2] = euMatch;
    return new Date(
      parseInt(y2),
      parseInt(m2) - 1,
      parseInt(d2),
      parseInt(h2),
      parseInt(min2),
      parseInt(sec2 || "0")
    );
  }

  // Try "DD.MM.YYYY" without time
  const euDateOnly = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (euDateOnly) {
    const [, d3, m3, y3] = euDateOnly;
    return new Date(parseInt(y3), parseInt(m3) - 1, parseInt(d3));
  }

  // Generic fallback: replace separators and try native Date parsing
  const cleaned = trimmed.replace(/\./g, "-").replace(/\//g, "-");
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;

  const parts = trimmed.split(/[\s]+/);
  if (parts.length >= 1) {
    const datePart = parts[0].replace(/\./g, "-").replace(/\//g, "-");
    const timePart = parts[1] || "00:00:00";
    const combined = new Date(`${datePart}T${timePart}`);
    if (!isNaN(combined.getTime())) return combined;
  }

  return new Date(NaN);
}

/**
 * Detect if the CSV is MT5 format with Direction (in/out) column.
 * MT5 uses paired rows: "in" for entry, "out" for exit.
 * Only "out" rows contain the actual P/L.
 * Supports both English (Direction, Deal) and Japanese (新規・決済, 約定) headers.
 */
function isMT5Format(
  headers: string[],
  columnMap: Record<string, string>
): boolean {
  const normalizedHeaders = headers.map(normalizeColumnName);
  const hasDirection =
    normalizedHeaders.includes("direction") ||
    normalizedHeaders.includes("新規・決済") ||
    !!columnMap.direction;
  const hasDeal =
    normalizedHeaders.includes("deal") ||
    normalizedHeaders.includes("約定") ||
    normalizedHeaders.includes("約定番号");
  return hasDirection && hasDeal;
}

/**
 * Process MT5 IN/OUT paired rows.
 * - "in" rows represent trade entry (profit is 0)
 * - "out" rows represent trade exit (profit is the actual P/L)
 * - We pair them by Order number and take the "out" row's profit
 * - Commission/Fee/Swap may appear on either "in" or "out" rows, so we sum both
 */
function processMT5Data(
  data: Record<string, string>[],
  columnMap: Record<string, string>
): { trades: TradeRecord[]; skippedRows: number; unmatchedInRows: number } {
  const trades: TradeRecord[] = [];
  let skippedRows = 0;

  // Classify rows by direction
  const getDirection = (row: Record<string, string>): string =>
    columnMap.direction
      ? (row[columnMap.direction] || "").trim().toLowerCase()
      : "";

  const inRows: Record<string, string>[] = [];
  const outRows: Record<string, string>[] = [];
  const otherRows: Record<string, string>[] = [];

  for (const row of data) {
    const dir = getDirection(row);
    if (dir === "in") inRows.push(row);
    else if (dir === "out") outRows.push(row);
    else otherRows.push(row);
  }

  // Try to pair in/out rows by Order number first
  const getOrderNum = (row: Record<string, string>): string =>
    columnMap.order ? (row[columnMap.order] || "").trim() : "";
  const getSymbol = (row: Record<string, string>): string =>
    (row[columnMap.symbol] || "").trim().toUpperCase();

  // Build a lookup of "in" rows by Order number for fast pairing
  const inByOrder = new Map<string, Record<string, string>>();
  for (const row of inRows) {
    const orderNum = getOrderNum(row);
    if (orderNum) {
      inByOrder.set(orderNum, row);
    }
  }

  // Track which "in" rows have been consumed
  const consumedIn = new Set<Record<string, string>>();

  // Process each "out" row as a trade
  for (const outRow of outRows) {
    try {
      const orderNum = getOrderNum(outRow);
      const symbol = getSymbol(outRow);

      // Find matching "in" row: first by Order number, then by symbol proximity
      let inRow: Record<string, string> | undefined;
      if (orderNum && inByOrder.has(orderNum)) {
        inRow = inByOrder.get(orderNum)!;
      } else {
        // Fallback: find an unconsumed "in" row with the same symbol
        inRow = inRows.find(r => !consumedIn.has(r) && getSymbol(r) === symbol);
      }
      if (inRow) consumedIn.add(inRow);

      // Use the "out" row for time and profit
      const timeStr = outRow[columnMap.time] || "";
      const time = parseDate(timeStr);
      let profit = parseFloat(outRow[columnMap.profit] || "0");

      // Commission/fee/swap/taxes: sum from BOTH "in" and "out" rows.
      // MT5 brokers typically record commission on entry ("in" row) and
      // profit/swap on exit ("out" row). We need both to get the true net P&L.
      const rowsToSum = inRow ? [inRow, outRow] : [outRow];
      for (const row of rowsToSum) {
        if (columnMap.commission) {
          const commission = parseFloat(row[columnMap.commission] || "0");
          if (!isNaN(commission)) profit += commission;
        }
        if (columnMap.fee) {
          const fee = parseFloat(row[columnMap.fee] || "0");
          if (!isNaN(fee)) profit += fee;
        }
        if (columnMap.swap) {
          const swap = parseFloat(row[columnMap.swap] || "0");
          if (!isNaN(swap)) profit += swap;
        }
        if (columnMap.taxes) {
          const taxes = parseFloat(row[columnMap.taxes] || "0");
          if (!isNaN(taxes)) profit += taxes;
        }
      }

      // Get entry type from "in" row, volume from either
      const typeSource = inRow || outRow;
      const type = columnMap.type
        ? (typeSource[columnMap.type] || "").trim().toLowerCase()
        : "unknown";
      const volume = columnMap.volume
        ? parseFloat((inRow || outRow)[columnMap.volume] || "0")
        : 0.01;
      const price = columnMap.price
        ? parseFloat((inRow || outRow)[columnMap.price] || "0")
        : 0;

      if (isNaN(time.getTime()) || !symbol || isNaN(profit)) {
        skippedRows++;
        continue;
      }

      const volValMT5 = isNaN(volume) ? 0.01 : volume;
      trades.push({
        time,
        symbol,
        profit,
        volume: volValMT5,
        lots: volValMT5,
        type,
        price: isNaN(price) ? 0 : price,
      });
    } catch {
      skippedRows++;
    }
  }

  const unmatchedInRows = inRows.length - consumedIn.size;

  // Process rows with no direction (neither in nor out) — treat as completed trades
  for (const row of otherRows) {
    try {
      const timeStr = row[columnMap.time] || "";
      const time = parseDate(timeStr);
      const symbol = (row[columnMap.symbol] || "").trim().toUpperCase();
      let profit = parseFloat(row[columnMap.profit] || "0");

      if (columnMap.commission) {
        const commission = parseFloat(row[columnMap.commission] || "0");
        if (!isNaN(commission)) profit += commission;
      }
      if (columnMap.fee) {
        const fee = parseFloat(row[columnMap.fee] || "0");
        if (!isNaN(fee)) profit += fee;
      }
      if (columnMap.swap) {
        const swap = parseFloat(row[columnMap.swap] || "0");
        if (!isNaN(swap)) profit += swap;
      }
      if (columnMap.taxes) {
        const taxes = parseFloat(row[columnMap.taxes] || "0");
        if (!isNaN(taxes)) profit += taxes;
      }

      const type = columnMap.type
        ? (row[columnMap.type] || "").trim().toLowerCase()
        : "unknown";
      const volume = columnMap.volume
        ? parseFloat(row[columnMap.volume] || "0")
        : 0.01;
      const price = columnMap.price
        ? parseFloat(row[columnMap.price] || "0")
        : 0;

      if (isNaN(time.getTime()) || !symbol || isNaN(profit)) {
        skippedRows++;
        continue;
      }

      const volVal = isNaN(volume) ? 0.01 : volume;
      trades.push({
        time,
        symbol,
        profit,
        volume: volVal,
        lots: volVal,
        type,
        price: isNaN(price) ? 0 : price,
      });
    } catch {
      skippedRows++;
    }
  }

  return { trades, skippedRows, unmatchedInRows };
}

/**
 * Process MT4 / generic format rows (one row per trade).
 */
function processMT4Data(
  data: Record<string, string>[],
  columnMap: Record<string, string>
): { trades: TradeRecord[]; skippedRows: number } {
  const trades: TradeRecord[] = [];
  let skippedRows = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      const timeStr = row[columnMap.time] || "";
      const time = parseDate(timeStr);
      const symbol = (row[columnMap.symbol] || "").trim().toUpperCase();
      const profitStr = row[columnMap.profit] || "0";
      let profit = parseFloat(profitStr);

      if (columnMap.commission) {
        const commission = parseFloat(row[columnMap.commission] || "0");
        if (!isNaN(commission)) profit += commission;
      }
      if (columnMap.swap) {
        const swap = parseFloat(row[columnMap.swap] || "0");
        if (!isNaN(swap)) profit += swap;
      }
      if (columnMap.taxes) {
        const taxes = parseFloat(row[columnMap.taxes] || "0");
        if (!isNaN(taxes)) profit += taxes;
      }
      if (columnMap.fee) {
        const fee = parseFloat(row[columnMap.fee] || "0");
        if (!isNaN(fee)) profit += fee;
      }

      const volume = columnMap.volume
        ? parseFloat(row[columnMap.volume] || "0")
        : 0.01;
      const type = columnMap.type
        ? (row[columnMap.type] || "").trim().toLowerCase()
        : "unknown";
      const price = columnMap.price
        ? parseFloat(row[columnMap.price] || "0")
        : 0;

      if (isNaN(time.getTime())) {
        skippedRows++;
        continue;
      }
      if (!symbol) {
        skippedRows++;
        continue;
      }
      // Filter out balance/deposit/withdrawal/credit rows that have text in symbol column
      const symbolLower = symbol.toLowerCase();
      if (
        symbolLower === "balance" ||
        symbolLower === "credit" ||
        symbolLower === "deposit" ||
        symbolLower === "withdrawal" ||
        symbolLower === "rebate" ||
        symbolLower === "adjustment" ||
        symbolLower === "transfer" ||
        symbolLower === "残高" ||
        symbolLower === "入金" ||
        symbolLower === "出金" ||
        symbolLower === "クレジット"
      ) {
        skippedRows++;
        continue;
      }
      if (isNaN(profit)) {
        skippedRows++;
        continue;
      }

      const volVal2 = isNaN(volume) ? 0.01 : volume;
      trades.push({
        time,
        symbol,
        profit,
        volume: volVal2,
        lots: volVal2,
        type,
        price: isNaN(price) ? 0 : price,
      });
    } catch {
      skippedRows++;
    }
  }

  return { trades, skippedRows };
}

export function parseCSV(csvText: string): {
  trades: TradeRecord[];
  errors: string[];
  initialBalance: number;
} {
  const errors: string[] = [];

  const processedCSV = preprocessCSV(csvText);

  const result = Papa.parse(processedCSV, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter(
      e => e.type !== "FieldMismatch"
    );
    if (criticalErrors.length > 0) {
      errors.push(...criticalErrors.map(e => `行 ${e.row}: ${e.message}`));
    }
  }

  const data = result.data as Record<string, string>[];
  if (data.length === 0) {
    errors.push("CSVにデータが含まれていません。");
    return { trades: [], errors, initialBalance: 0 };
  }

  const headers = Object.keys(data[0]);
  const columnMap = mapColumns(headers);

  // Check required columns
  const requiredCols = ["time", "symbol", "profit"];
  const missingCols = requiredCols.filter(col => !columnMap[col]);
  if (missingCols.length > 0) {
    errors.push(
      `必須列が見つかりません: ${missingCols.join(", ")}。\n検出されたヘッダー: ${headers.join(", ")}`
    );
    return { trades: [], errors, initialBalance: 0 };
  }

  // Detect format and process accordingly
  let trades: TradeRecord[];
  let skippedRows: number;

  if (isMT5Format(headers, columnMap)) {
    const mt5Result = processMT5Data(data, columnMap);
    trades = mt5Result.trades;
    skippedRows = mt5Result.skippedRows;
    if (mt5Result.unmatchedInRows > 0) {
      errors.push(
        `${mt5Result.unmatchedInRows}件の未決済ポジション（"in"行）が検出されました。`
      );
    }
  } else {
    const mt4Result = processMT4Data(data, columnMap);
    trades = mt4Result.trades;
    skippedRows = mt4Result.skippedRows;
  }

  if (skippedRows > 0) {
    errors.push(`${skippedRows}行のデータをスキップしました（無効なデータ）。`);
  }

  if (trades.length === 0 && errors.length === 0) {
    errors.push(
      "有効なトレードデータが見つかりませんでした。CSVの形式を確認してください。"
    );
  }

  // Sort by time
  trades.sort((a, b) => a.time.getTime() - b.time.getTime());

  // Extract initial balance from the Balance column if available.
  // Strategy: sort data rows by time to find the earliest trade with a Balance value,
  // then subtract its profit to get the pre-trade balance.
  let initialBalance = 0;
  if (columnMap.balance && columnMap.symbol) {
    // Sort data rows by time to find the chronologically first trade
    const dataWithTime = data
      .filter(row => {
        const symbol = (row[columnMap.symbol] || "").trim();
        return symbol.length > 0;
      })
      .map(row => ({ row, time: parseDate(row[columnMap.time] || "") }))
      .filter(item => !isNaN(item.time.getTime()))
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    for (const { row } of dataWithTime) {
      const balStr = row[columnMap.balance];
      if (balStr) {
        const bal = parseFloat(balStr.replace(/\s/g, ""));
        if (!isNaN(bal) && bal > 0) {
          // Subtract ALL costs (profit + commission + swap + fee + taxes)
          // to recover the balance before this row's transaction.
          let rowCost = parseFloat(row[columnMap.profit] || "0") || 0;
          if (columnMap.commission) {
            const c = parseFloat(row[columnMap.commission] || "0");
            if (!isNaN(c)) rowCost += c;
          }
          if (columnMap.fee) {
            const f = parseFloat(row[columnMap.fee] || "0");
            if (!isNaN(f)) rowCost += f;
          }
          if (columnMap.swap) {
            const s = parseFloat(row[columnMap.swap] || "0");
            if (!isNaN(s)) rowCost += s;
          }
          if (columnMap.taxes) {
            const t = parseFloat(row[columnMap.taxes] || "0");
            if (!isNaN(t)) rowCost += t;
          }
          initialBalance = bal - rowCost;
          break;
        }
      }
    }
  }

  return { trades, errors, initialBalance };
}

export function getDetectedColumns(csvText: string): {
  headers: string[];
  mapping: Record<string, string>;
} {
  const processedCSV = preprocessCSV(csvText);
  const result = Papa.parse(processedCSV, { header: true, preview: 1 });
  const headers = result.meta.fields || [];
  const mapping = mapColumns(headers);
  return { headers, mapping };
}
