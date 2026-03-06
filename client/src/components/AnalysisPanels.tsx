/**
 * Design: Trading Terminal - Analysis panels
 * Weakness Ranking, Improvement Suggestions, Risk Diagnosis, Symbol/Time analysis
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Shield, Lightbulb,
  Clock, Coins, ChevronRight, ChevronDown,
  CheckCircle2, AlertCircle, XCircle,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  WeaknessItem, ImprovementSuggestion, RiskDiagnosis,
  SymbolAnalysis, TimeSlotAnalysis, RiskFactor, FactorStatus,
} from "@/lib/analysis";

// ==================== Status Config ====================

function getStatusConfig(status: FactorStatus) {
  switch (status) {
    case "ok":
      return {
        icon: CheckCircle2,
        color: "#00D4AA",
        bgColor: "rgba(0, 212, 170, 0.08)",
        borderColor: "rgba(0, 212, 170, 0.25)",
        labelBg: "rgba(0, 212, 170, 0.15)",
      };
    case "caution":
      return {
        icon: AlertCircle,
        color: "#F59E0B",
        bgColor: "rgba(245, 158, 11, 0.08)",
        borderColor: "rgba(245, 158, 11, 0.25)",
        labelBg: "rgba(245, 158, 11, 0.15)",
      };
    case "danger":
      return {
        icon: XCircle,
        color: "#EF4444",
        bgColor: "rgba(239, 68, 68, 0.08)",
        borderColor: "rgba(239, 68, 68, 0.25)",
        labelBg: "rgba(239, 68, 68, 0.15)",
      };
  }
}

// ==================== Risk Factor Card ====================

function RiskFactorCard({ factor, index }: { factor: RiskFactor; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = getStatusConfig(factor.status);
  const Icon = config.icon;
  const { language: lang } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:brightness-110 transition-all"
      >
        <Icon className="w-5 h-5 shrink-0" style={{ color: config.color }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{factor.label}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: config.labelBg, color: config.color }}
            >
              {factor.statusLabel}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 font-mono">
            {lang === "ja" ? "現在値" : "Current"}: {factor.value}
          </div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Detail - expandable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Divider */}
              <div className="border-t" style={{ borderColor: config.borderColor }} />

              {/* Description */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">
                  {lang === "ja" ? "診断結果" : "Diagnosis"}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {factor.description}
                </p>
              </div>

              {/* Action */}
              <div
                className="rounded-md p-3"
                style={{
                  backgroundColor: `${config.color}08`,
                  border: `1px dashed ${config.borderColor}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: config.color }} />
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: config.color }}>
                    {lang === "ja" ? "今後のアクション" : "Recommended Action"}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {factor.action}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== Weakness Ranking ====================

export function WeaknessPanel({ weaknesses }: { weaknesses: WeaknessItem[] }) {
  const { t } = useLanguage();

  if (weaknesses.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
          {t("panel.weaknessRanking")}
        </h3>
        <p className="text-muted-foreground text-sm">{t("panel.noWeakness")}</p>
      </div>
    );
  }

  const severityConfig = {
    high: { bg: "bg-[oklch(0.65_0.2_20_/_0.12)]", text: "text-[oklch(0.65_0.2_20)]", label: "HIGH" },
    medium: { bg: "bg-[oklch(0.78_0.15_75_/_0.12)]", text: "text-[oklch(0.78_0.15_75)]", label: "MED" },
    low: { bg: "bg-[oklch(0.65_0.18_250_/_0.12)]", text: "text-[oklch(0.65_0.18_250)]", label: "LOW" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
        {t("panel.weaknessRanking")}
      </h3>
      <div className="space-y-2">
        {weaknesses.slice(0, 5).map((w, i) => {
          const config = severityConfig[w.severity];
          return (
            <motion.div
              key={`${w.category}-${w.target}-${w.metric}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 py-2.5 px-3 rounded-md bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.02_260)]"
            >
              <span className="text-muted-foreground font-mono text-xs w-5">#{i + 1}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${config.bg} ${config.text}`}>
                {config.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground flex items-center gap-1.5">
                  {w.category === "通貨ペア" || w.category === "Symbol" ? <Coins className="w-3.5 h-3.5 text-muted-foreground" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className="font-medium">{w.target}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{w.issue}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ==================== Risk Diagnosis ====================

export function RiskPanel({ diagnosis }: { diagnosis: RiskDiagnosis }) {
  const { t } = useLanguage();

  // Count statuses for summary
  const okCount = diagnosis.factors.filter(f => f.status === "ok").length;
  const cautionCount = diagnosis.factors.filter(f => f.status === "caution").length;
  const dangerCount = diagnosis.factors.filter(f => f.status === "danger").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <Shield className="w-4 h-4" style={{ color: diagnosis.color }} />
        {t("panel.riskDiagnosis")}
      </h3>

      {/* Overall Risk Level */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="px-4 py-2 rounded-md text-lg font-bold tracking-wider"
          style={{
            backgroundColor: `${diagnosis.color}20`,
            color: diagnosis.color,
            boxShadow: `0 0 15px ${diagnosis.color}25`,
          }}
        >
          {diagnosis.level}
        </div>
        <div className="text-sm text-muted-foreground">
          {diagnosis.level === "LOW" && t("panel.riskLow")}
          {diagnosis.level === "MEDIUM" && t("panel.riskMedium")}
          {diagnosis.level === "HIGH" && t("panel.riskHigh")}
        </div>
      </div>

      {/* Status Summary Bar */}
      <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
        {okCount > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00D4AA]" />
            <span>{okCount}</span>
          </div>
        )}
        {cautionCount > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{cautionCount}</span>
          </div>
        )}
        {dangerCount > 0 && (
          <div className="flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>{dangerCount}</span>
          </div>
        )}
      </div>

      {/* Factor Cards */}
      <div className="space-y-2">
        {diagnosis.factors.map((factor, i) => (
          <RiskFactorCard key={`${factor.label}-${i}`} factor={factor} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

// ==================== Improvement Suggestions ====================

export function SuggestionsPanel({ suggestions }: { suggestions: ImprovementSuggestion[] }) {
  const { t } = useLanguage();

  if (suggestions.length === 0) return null;

  const priorityConfig = {
    high: { border: "border-l-[oklch(0.65_0.2_20)]", icon: "text-[oklch(0.65_0.2_20)]" },
    medium: { border: "border-l-[oklch(0.78_0.15_75)]", icon: "text-[oklch(0.78_0.15_75)]" },
    low: { border: "border-l-[oklch(0.65_0.18_250)]", icon: "text-[oklch(0.65_0.18_250)]" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
        {t("panel.suggestions")}
      </h3>
      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const config = priorityConfig[s.priority];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`border-l-2 ${config.border} pl-4 py-2`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">{s.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {s.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ==================== Symbol Analysis Table ====================

export function SymbolAnalysisTable({ data }: { data: SymbolAnalysis[] }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <Coins className="w-4 h-4 text-[#3B82F6]" />
        {t("panel.symbolAnalysis")}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.symbol")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.trades")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.winRate")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.pf")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.rr")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.profit")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.symbol} className="border-b border-[oklch(0.2_0.02_260)] hover:bg-[oklch(0.16_0.02_260)]">
                <td className="py-2.5 px-2 font-mono font-medium text-foreground">{row.symbol}</td>
                <td className="py-2.5 px-2 text-right text-muted-foreground">{row.trades}</td>
                <td className="py-2.5 px-2 text-right">
                  <span className={row.winRate >= 50 ? "text-profit" : "text-loss"}>
                    {row.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className={row.profitFactor >= 1 ? "text-profit" : "text-loss"}>
                    {row.profitFactor >= 999 ? "999+" : row.profitFactor.toFixed(2)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className={row.riskReward >= 1 ? "text-profit" : "text-loss"}>
                    {row.riskReward.toFixed(2)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right font-mono">
                  <span className={row.netProfit >= 0 ? "text-profit" : "text-loss"}>
                    {row.netProfit >= 0 ? "+" : ""}{row.netProfit.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ==================== Time Slot Analysis ====================

export function TimeSlotAnalysisTable({ data }: { data: TimeSlotAnalysis[] }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#3B82F6]" />
        {t("panel.timeSlotAnalysis")}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.timeSlot")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.trades")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.winRate")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.pf")}</th>
              <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("table.profit")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.slot} className="border-b border-[oklch(0.2_0.02_260)] hover:bg-[oklch(0.16_0.02_260)]">
                <td className="py-2.5 px-2 font-mono text-foreground">{row.slot}</td>
                <td className="py-2.5 px-2 text-right text-muted-foreground">{row.trades}</td>
                <td className="py-2.5 px-2 text-right">
                  {row.trades > 0 ? (
                    <span className={row.winRate >= 50 ? "text-profit" : "text-loss"}>
                      {row.winRate.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-2.5 px-2 text-right">
                  {row.trades > 0 ? (
                    <span className={row.profitFactor >= 1 ? "text-profit" : "text-loss"}>
                      {row.profitFactor >= 999 ? "999+" : row.profitFactor.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-2.5 px-2 text-right font-mono">
                  {row.trades > 0 ? (
                    <span className={row.netProfit >= 0 ? "text-profit" : "text-loss"}>
                      {row.netProfit >= 0 ? "+" : ""}{row.netProfit.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
