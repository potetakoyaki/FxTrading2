/**
 * Design: Trading Terminal - Trade list table
 * Sortable, paginated table showing individual trades
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  List,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TradeRecord } from "@/lib/csvParser";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  trades: TradeRecord[];
}

type SortField = "time" | "symbol" | "type" | "volume" | "profit" | "cumProfit";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

export default function TradeListTable({ trades }: Props) {
  const { t } = useLanguage();
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);

  // Calculate cumulative profit
  const tradesWithCum = useMemo(() => {
    let cum = 0;
    return trades.map(tr => {
      cum += tr.profit;
      return { ...tr, cumProfit: cum };
    });
  }, [trades]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...tradesWithCum];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "time":
          cmp = a.time.getTime() - b.time.getTime();
          break;
        case "symbol":
          cmp = a.symbol.localeCompare(b.symbol);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "volume":
          cmp = a.volume - b.volume;
          break;
        case "profit":
          cmp = a.profit - b.profit;
          break;
        case "cumProfit":
          cmp = a.cumProfit - b.cumProfit;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [tradesWithCum, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-[oklch(0.82_0.18_165)]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[oklch(0.82_0.18_165)]" />
    );
  };

  const formatTime = (d: Date) => {
    try {
      return d.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <List className="w-4 h-4 text-[#3B82F6]" />
          {t("tradeList.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {page * PAGE_SIZE + 1}-
          {Math.min((page + 1) * PAGE_SIZE, sorted.length)} {t("tradeList.of")}{" "}
          {sorted.length} {t("tradeList.showing")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {[
                { field: "time" as SortField, label: t("tradeList.time") },
                { field: "symbol" as SortField, label: t("tradeList.symbol") },
                { field: "type" as SortField, label: t("tradeList.type") },
                { field: "volume" as SortField, label: t("tradeList.volume") },
                { field: "profit" as SortField, label: t("tradeList.profit") },
                {
                  field: "cumProfit" as SortField,
                  label: t("tradeList.cumProfit"),
                },
              ].map(col => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className={`py-2 px-2 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors select-none ${
                    col.field === "time" ||
                    col.field === "symbol" ||
                    col.field === "type"
                      ? "text-left"
                      : "text-right"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.field} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((trade, i) => (
              <tr
                key={`${trade.time.getTime()}-${trade.symbol}-${i}`}
                className="border-b border-[oklch(0.2_0.02_260)] hover:bg-[oklch(0.16_0.02_260)] transition-colors"
              >
                <td className="py-2 px-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(trade.time)}
                </td>
                <td className="py-2 px-2 font-mono font-medium text-foreground">
                  {trade.symbol}
                </td>
                <td className="py-2 px-2">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      trade.type.toLowerCase().includes("buy") ||
                      trade.type.toLowerCase().includes("long")
                        ? "bg-[oklch(0.82_0.18_165_/_0.12)] text-[oklch(0.82_0.18_165)]"
                        : "bg-[oklch(0.65_0.2_20_/_0.12)] text-[oklch(0.65_0.2_20)]"
                    }`}
                  >
                    {trade.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 px-2 text-right text-muted-foreground font-mono">
                  {trade.volume.toFixed(2)}
                </td>
                <td className="py-2 px-2 text-right font-mono">
                  <span
                    className={trade.profit >= 0 ? "text-profit" : "text-loss"}
                  >
                    {trade.profit >= 0 ? "+" : ""}
                    {trade.profit.toFixed(2)}
                  </span>
                </td>
                <td className="py-2 px-2 text-right font-mono">
                  <span
                    className={
                      trade.cumProfit >= 0 ? "text-profit" : "text-loss"
                    }
                  >
                    {trade.cumProfit >= 0 ? "+" : ""}
                    {trade.cumProfit.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[oklch(0.2_0.02_260)]">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="text-xs gap-1 border-border"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {t("tradeList.prev")}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    page === pageNum
                      ? "bg-[oklch(0.82_0.18_165_/_0.2)] text-[oklch(0.82_0.18_165)] border border-[oklch(0.82_0.18_165_/_0.3)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="text-xs gap-1 border-border"
          >
            {t("tradeList.next")}
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
