/**
 * HTML report parser for MT4/MT5 trade history reports.
 *
 * MT5 HTML report structure (actual format verified with real file):
 * - Encoding: UTF-16 LE with BOM (0xFF 0xFE)
 * - Single <table> with multiple sections:
 *   1. Header rows (account info)
 *   2. "ポジション一覧" section (open positions)
 *   3. "注文" section (orders)
 *   4. "約定" section (deals) ← THIS IS WHAT WE NEED
 *   5. "結果" section (summary)
 *
 * The "約定" (deals) section has 15 columns (indices 0-14):
 *   [0]時間, [1]約定, [2]銘柄, [3]タイプ, [4]新規・決済,
 *   [5]数量, [6]価格, [7]注文, [8]費用, [9]手数料, [10]手数料,
 *   [11]スワップ, [12]損益, [13]残高, [14]コメント
 *
 * Numbers in HTML use space as thousands separator (e.g., "4 074" = 4074)
 */

/**
 * Parse an MT4/MT5 HTML report and convert to CSV text.
 * Handles UTF-16 LE encoding (MT5 default) and UTF-8 (MT4).
 */
export async function htmlToCSV(rawBuffer: ArrayBuffer): Promise<string> {
  // Detect encoding from BOM
  const bytes = new Uint8Array(rawBuffer);
  let text: string;

  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    // UTF-16 LE with BOM (MT5 default)
    const decoder = new TextDecoder('utf-16le');
    text = decoder.decode(rawBuffer.slice(2));
  } else if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
    // UTF-16 BE with BOM
    const decoder = new TextDecoder('utf-16be');
    text = decoder.decode(rawBuffer.slice(2));
  } else {
    // UTF-8 or ASCII (MT4)
    const decoder = new TextDecoder('utf-8');
    text = decoder.decode(rawBuffer);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  // Try to find the "約定" (deals) section first — MT5 specific
  const dealsCSV = tryExtractMT5Deals(doc);
  if (dealsCSV) {
    return dealsCSV;
  }

  // Fallback: find the best trade history table (MT4 style)
  return extractBestTable(doc);
}

/**
 * Normalize a cell text value:
 * - Remove non-breaking spaces (\u00a0)
 * - Remove thousands separators (spaces in numbers like "4 074" → "4074")
 */
function normalizeCellText(raw: string): string {
  let t = raw.replace(/\u00a0/g, '').trim();
  // Remove spaces in numbers (e.g., "4 074" → "4074", "-4 652" → "-4652")
  if (/^-?\d[\d\s]*\.?\d*$/.test(t)) {
    t = t.replace(/\s/g, '');
  }
  return t;
}

/**
 * MT5: Find the "約定" section and extract deal rows.
 * Uses direct column index mapping based on verified MT5 HTML format.
 */
function tryExtractMT5Deals(doc: Document): string | null {
  const tables = doc.querySelectorAll('table');
  if (tables.length === 0) return null;

  // MT5 has a single large table
  const table = tables[0];
  const rows = Array.from(table.querySelectorAll('tr'));

  // Find the "約定" section header row
  let dealsHeaderRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td, th');
    if (cells.length === 1) {
      const text = cells[0].textContent?.trim() || '';
      if (text === '約定' || text.toLowerCase() === 'deals') {
        dealsHeaderRowIndex = i;
        break;
      }
    }
  }

  if (dealsHeaderRowIndex === -1) return null;

  // The next row is the column header row
  const columnHeaderRow = rows[dealsHeaderRowIndex + 1];
  if (!columnHeaderRow) return null;

  const headerCells = Array.from(columnHeaderRow.querySelectorAll('td, th'));
  const headers = headerCells.map(c => c.textContent?.trim() || '');

  // Dynamically find all column indices from headers
  const timeIdx = findColIndex(headers, ['時間', 'time']);
  const dealIdx = findColIndex(headers, ['約定', 'deal']);
  const symbolIdx = findColIndex(headers, ['銘柄', 'symbol', 'item']);
  const typeIdx = findColIndex(headers, ['タイプ', 'type']);
  const directionIdx = findColIndex(headers, ['新規・決済', 'direction', 'in/out']);
  const volumeIdx = findColIndex(headers, ['数量', 'volume', 'lot']);
  const priceIdx = findColIndex(headers, ['価格', 'price']);
  const orderIdx = findColIndex(headers, ['注文', 'order']);
  const feeIdx = findColIndex(headers, ['費用', 'fee']);
  const swapIdx = findColIndex(headers, ['スワップ', 'swap']);
  const balanceIdx = findColIndex(headers, ['残高', 'balance']);
  const commentIdx = findColIndex(headers, ['コメント', 'comment']);

  // Commission: find first '手数料'/'commission'. MT5 may have duplicate commission columns.
  const commissionIdx = findColIndex(headers, ['手数料', 'commission']);

  // Profit: use swap+1 heuristic (reliable for MT5), fallback to direct search
  const profitIdx = swapIdx >= 0 ? swapIdx + 1 : findColIndex(headers, ['損益', 'profit', 'p/l']);

  // Output CSV with standardized MT5 column names (compatible with csvParser)
  const csvHeaders = ['Time', 'Deal', 'Symbol', 'Type', 'Direction', 'Volume', 'Price', 'Order', 'Commission', 'Fee', 'Swap', 'Profit', 'Balance', 'Comment'];
  const csvRows: string[] = [csvHeaders.join(',')];

  const getCell = (cellTexts: string[], idx: number, fallback = ''): string =>
    idx >= 0 && idx < cellTexts.length ? (cellTexts[idx] || fallback) : fallback;

  // Extract data rows (from dealsHeaderRowIndex + 2 onward)
  for (let i = dealsHeaderRowIndex + 2; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td, th'));
    if (cells.length === 0) continue;

    // Stop at next section header (single cell row with non-numeric text)
    if (cells.length === 1) {
      const cellText = cells[0].textContent?.trim() || '';
      if (cellText && !/^\d/.test(cellText)) {
        break;
      }
    }

    // Extract and normalize all cell values
    const cellTexts = cells.map(c => normalizeCellText(c.textContent || ''));

    // Skip balance/deposit rows (no symbol)
    const symbolVal = getCell(cellTexts, symbolIdx);
    if (!symbolVal) continue;

    // Build standardized row using dynamically detected indices
    const row = [
      getCell(cellTexts, timeIdx),                           // Time
      getCell(cellTexts, dealIdx),                           // Deal
      symbolVal,                                              // Symbol
      getCell(cellTexts, typeIdx),                           // Type
      getCell(cellTexts, directionIdx),                      // Direction
      getCell(cellTexts, volumeIdx),                         // Volume
      getCell(cellTexts, priceIdx),                          // Price
      getCell(cellTexts, orderIdx),                          // Order
      getCell(cellTexts, commissionIdx, '0'),                // Commission
      getCell(cellTexts, feeIdx, '0'),                       // Fee
      getCell(cellTexts, swapIdx, '0'),                      // Swap
      getCell(cellTexts, profitIdx, '0'),                    // Profit
      getCell(cellTexts, balanceIdx),                        // Balance
      getCell(cellTexts, commentIdx),                        // Comment
    ];

    const csvLine = row.map(v => {
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    }).join(',');

    csvRows.push(csvLine);
  }

  if (csvRows.length < 3) return null;

  return csvRows.join('\n');
}

/**
 * Fallback: extract the best table (MT4 style or generic).
 */
function extractBestTable(doc: Document): string {
  const tables = doc.querySelectorAll('table');
  if (tables.length === 0) {
    throw new Error('HTMLファイルにテーブルが見つかりません。');
  }

  const headerKeywords = [
    'ticket', 'open time', 'close time', 'type', 'size', 'item', 'symbol',
    'price', 'profit', 's/l', 't/p', 'swap', 'commission',
    '注文番号', '通貨ペア', '銘柄', '損益', 'チケット',
  ];

  let bestTable: Element | null = null;
  let bestScore = 0;

  tables.forEach(table => {
    const firstRow = table.querySelector('tr');
    if (!firstRow) return;
    const headerText = firstRow.textContent?.toLowerCase() || '';
    const matchCount = headerKeywords.filter(kw => headerText.includes(kw)).length;
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestTable = table;
    }
  });

  if (!bestTable || bestScore < 2) {
    let maxRows = 0;
    tables.forEach(table => {
      const rowCount = table.querySelectorAll('tr').length;
      if (rowCount > maxRows) {
        maxRows = rowCount;
        bestTable = table;
      }
    });
  }

  if (!bestTable) {
    throw new Error('取引履歴テーブルが見つかりません。');
  }

  // MT4 HTML reports have section headers as single-cell rows (with colspan).
  // We need to find the "Closed Transactions" section and stop before
  // "Open Trades", "Working Orders", etc. to avoid mixing unrealized P/L data.
  const sectionStopPatterns = [
    /^open\s*trades?$/i,
    /^working\s*orders?$/i,
    /^cancelled?\s*orders?$/i,
    /^deleted?\s*orders?$/i,
    /^未決済/,
    /^ワーキング/,
  ];

  const rows = Array.from((bestTable as Element).querySelectorAll('tr'));
  const csvRows: string[] = [];

  // First pass: find "Closed Transactions" header row if present
  let startIdx = 0;
  let foundClosedSection = false;
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td, th');
    if (cells.length === 1) {
      const text = (cells[0].textContent || '').trim();
      if (/^closed\s*transactions?$/i.test(text) || /^決済済み/i.test(text)) {
        startIdx = i + 1; // skip the section header itself
        foundClosedSection = true;
        break;
      }
    }
  }

  // Second pass: extract rows, stopping at the next section boundary
  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td, th');

    // Check for section boundary (single-cell row acting as a section header)
    if (cells.length === 1 && foundClosedSection) {
      const text = (cells[0].textContent || '').trim();
      if (text && sectionStopPatterns.some(p => p.test(text))) {
        break; // Stop — we've reached a non-closed-trades section
      }
    }

    const values: string[] = [];
    cells.forEach(cell => {
      let text = normalizeCellText(cell.textContent || '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        text = `"${text.replace(/"/g, '""')}"`;
      }
      values.push(text);
    });
    if (values.length > 0 && values.some(v => v.trim() !== '')) {
      csvRows.push(values.join(','));
    }
  }

  if (csvRows.length < 2) {
    throw new Error('HTMLテーブルに十分なデータが含まれていません。');
  }

  return csvRows.join('\n');
}

function findColIndex(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h =>
      h.toLowerCase().trim() === candidate.toLowerCase() ||
      h.toLowerCase().includes(candidate.toLowerCase())
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Check if a file is an HTML file.
 */
export function isHtmlFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.htm') || lower.endsWith('.html');
}
