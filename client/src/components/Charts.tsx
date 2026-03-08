/**
 * Design: Trading Terminal - Dark themed charts
 * Equity Curve, Monte Carlo Simulation, Drawdown Distribution
 */
import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import type { EquityCurvePoint } from "@/lib/analysis";
import type { MonteCarloResult, DrawdownDistribution } from "@/lib/simulation";

const CHART_COLORS = {
  profit: "#00D4AA",
  loss: "#FF4757",
  blue: "#3B82F6",
  warning: "#F59E0B",
  grid: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.5)",
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "oklch(0.18 0.02 260)",
    border: "1px solid oklch(0.25 0.02 260)",
    borderRadius: "8px",
    color: "oklch(0.9 0.01 250)",
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  labelStyle: { color: "oklch(0.6 0.02 260)" },
};

// ==================== Equity Curve ====================

export function EquityCurveChart({
  data,
  initialBalance = 0,
}: {
  data: EquityCurvePoint[];
  initialBalance?: number;
}) {
  const { t } = useLanguage();
  if (data.length === 0) return null;
  const chartData = useMemo(
    () =>
      data.map(p => ({
        index: p.index,
        equity: Number(p.equity.toFixed(2)),
        drawdown: Number((-p.drawdown).toFixed(2)),
        drawdownPct: Number((-p.drawdownPct).toFixed(1)),
      })),
    [data]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00D4AA]" />
        {t("chart.equityCurve")}
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={CHART_COLORS.profit}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={CHART_COLORS.profit}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="index"
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v.toFixed(0)}
            />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine
              y={initialBalance}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={CHART_COLORS.profit}
              fill="url(#equityGrad)"
              strokeWidth={2}
              dot={false}
              name={t("chart.equity")}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ==================== Monte Carlo Stats with expandable descriptions ====================

function MonteCarloStats({
  result,
  initialBalance,
}: {
  result: MonteCarloResult;
  initialBalance: number;
}) {
  const { t } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const bankruptcyIsNA = result.bankruptcyRate < 0;

  const stats = [
    {
      label: t("chart.medianFinal"),
      desc: t("chart.medianFinal.desc"),
      value: result.percentile50.toFixed(0),
      color: CHART_COLORS.profit,
    },
    {
      label: t("chart.worstDD95"),
      desc: t("chart.worstDD95.desc"),
      value:
        initialBalance > 0
          ? `${((result.percentile95MaxDD / initialBalance) * 100).toFixed(1)}%`
          : result.percentile95MaxDD.toFixed(0),
      color: CHART_COLORS.warning,
    },
    {
      label: t("chart.profitProb"),
      desc: t("chart.profitProb.desc"),
      value: `${result.profitProbability.toFixed(1)}%`,
      color:
        result.profitProbability >= 50
          ? CHART_COLORS.profit
          : CHART_COLORS.loss,
    },
    {
      label: t("chart.bankruptcyRate"),
      desc: t("chart.bankruptcyRate.desc"),
      value: bankruptcyIsNA
        ? t("chart.na")
        : `${result.bankruptcyRate.toFixed(1)}%`,
      color: bankruptcyIsNA
        ? CHART_COLORS.text
        : result.bankruptcyRate > 10
          ? CHART_COLORS.loss
          : CHART_COLORS.profit,
      subNote: bankruptcyIsNA ? t("chart.noInitialBalance") : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      {stats.map((stat, i) => (
        <div key={stat.label}>
          <button
            type="button"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
            className="w-full text-center py-2 bg-[oklch(0.14_0.02_260)] rounded-md cursor-pointer hover:bg-[oklch(0.17_0.02_260)] transition-colors"
          >
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              {stat.label}
              <svg
                className={`w-3 h-3 transition-transform ${expandedIndex === i ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div
              className="metric-value text-sm font-semibold mt-0.5"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            {stat.subNote && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {stat.subNote}
              </div>
            )}
          </button>
          {expandedIndex === i && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 p-2 bg-[oklch(0.12_0.02_260)] rounded-md text-xs text-muted-foreground leading-relaxed"
            >
              {stat.desc}
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== Monte Carlo ====================

export function MonteCarloChart({
  result,
  initialBalance = 0,
}: {
  result: MonteCarloResult;
  initialBalance?: number;
}) {
  const { t } = useLanguage();
  const chartData = useMemo(() => {
    if (result.paths.length === 0) return [];
    const numPoints = result.paths[0].length;
    const step = Math.max(1, Math.floor(numPoints / 100));
    const indices: number[] = [];
    for (let i = 0; i < numPoints; i += step) indices.push(i);
    if (indices[indices.length - 1] !== numPoints - 1)
      indices.push(numPoints - 1);

    const pct = (arr: number[], p: number) => {
      const i = Math.min(
        Math.max(0, Math.ceil((p / 100) * arr.length) - 1),
        arr.length - 1
      );
      return arr[i];
    };

    return indices.map(idx => {
      const values = result.paths.map(p => p[idx]).sort((a, b) => a - b);
      const p5Val = pct(values, 5);
      const p25Val = pct(values, 25);
      const p50Val = pct(values, 50);
      const p75Val = pct(values, 75);
      const p95Val = pct(values, 95);
      return {
        index: idx,
        // Stacked band data: base offset + band heights
        base: Number(p5Val.toFixed(2)),
        band_5_25: Number((p25Val - p5Val).toFixed(2)),
        band_25_75: Number((p75Val - p25Val).toFixed(2)),
        band_75_95: Number((p95Val - p75Val).toFixed(2)),
        // Absolute values for median line and tooltip
        p50: Number(p50Val.toFixed(2)),
        p5: Number(p5Val.toFixed(2)),
        p25: Number(p25Val.toFixed(2)),
        p75: Number(p75Val.toFixed(2)),
        p95: Number(p95Val.toFixed(2)),
      };
    });
  }, [result]);

  // Custom tooltip showing absolute percentile values
  const renderTooltip = useCallback(
    ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: Array<{ payload: Record<string, number> }>;
      label?: number;
    }) => {
      if (!active || !payload || payload.length === 0) return null;
      const d = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "oklch(0.18 0.02 260)",
            border: "1px solid oklch(0.25 0.02 260)",
            borderRadius: "8px",
            padding: "8px 12px",
            color: "oklch(0.9 0.01 250)",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div style={{ color: "oklch(0.6 0.02 260)", marginBottom: 4 }}>
            Trade #{label}
          </div>
          <div>95th: {d.p95?.toFixed(0)}</div>
          <div>75th: {d.p75?.toFixed(0)}</div>
          <div style={{ color: CHART_COLORS.blue, fontWeight: 600 }}>
            Median: {d.p50?.toFixed(0)}
          </div>
          <div>25th: {d.p25?.toFixed(0)}</div>
          <div>5th: {d.p5?.toFixed(0)}</div>
        </div>
      );
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
        {t("chart.monteCarlo")}
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="index"
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{
                value: t("chart.tradeCount"),
                position: "insideBottom",
                offset: -2,
                fill: CHART_COLORS.text,
                fontSize: 10,
              }}
            />
            <YAxis
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip content={renderTooltip as never} />
            <ReferenceLine
              y={initialBalance}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="3 3"
            />
            {/* Stacked fan chart: base (transparent) + 3 bands */}
            <Area
              stackId="mc"
              type="monotone"
              dataKey="base"
              stroke="none"
              fill="transparent"
              name="base"
            />
            <Area
              stackId="mc"
              type="monotone"
              dataKey="band_5_25"
              stroke="none"
              fill={CHART_COLORS.blue}
              fillOpacity={0.15}
              name="5-25th"
            />
            <Area
              stackId="mc"
              type="monotone"
              dataKey="band_25_75"
              stroke="none"
              fill={CHART_COLORS.blue}
              fillOpacity={0.35}
              name="25-75th"
            />
            <Area
              stackId="mc"
              type="monotone"
              dataKey="band_75_95"
              stroke="none"
              fill={CHART_COLORS.blue}
              fillOpacity={0.15}
              name="75-95th"
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke={CHART_COLORS.blue}
              strokeWidth={2}
              dot={false}
              name={t("chart.median")}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <MonteCarloStats result={result} initialBalance={initialBalance} />
    </motion.div>
  );
}

// ==================== Drawdown Distribution ====================

export function DrawdownDistChart({ data }: { data: DrawdownDistribution }) {
  const { t } = useLanguage();
  const chartData = data.ranges.map((range, i) => ({
    range,
    count: data.counts[i],
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
        {t("chart.drawdownDist")}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="range"
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_COLORS.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip {...tooltipStyle} />
            <Bar
              dataKey="count"
              name={t("chart.count")}
              fill={CHART_COLORS.warning}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
