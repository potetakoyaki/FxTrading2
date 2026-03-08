/**
 * Generate realistic sample MT4 trade history CSV data
 * for demo purposes - 30 trades across multiple pairs
 */
export function generateSampleCSV(): string {
  const pairs = [
    "USDJPY",
    "EURUSD",
    "GBPUSD",
    "AUDJPY",
    "EURJPY",
    "GBPJPY",
    "USDCAD",
    "AUDUSD",
    "NZDUSD",
  ];
  const types = ["buy", "sell"];

  // Pre-defined realistic trades (profit, symbol, type, volume, hour)
  const trades: Array<{
    profit: number;
    symbol: string;
    type: string;
    volume: number;
    hour: number;
  }> = [
    { profit: 2450.0, symbol: "USDJPY", type: "buy", volume: 0.5, hour: 10 },
    { profit: -890.5, symbol: "EURUSD", type: "sell", volume: 0.3, hour: 15 },
    { profit: 1320.0, symbol: "GBPUSD", type: "buy", volume: 0.4, hour: 9 },
    { profit: 560.8, symbol: "USDJPY", type: "sell", volume: 0.2, hour: 14 },
    { profit: -1200.0, symbol: "EURJPY", type: "buy", volume: 0.5, hour: 11 },
    { profit: 3100.5, symbol: "GBPJPY", type: "buy", volume: 0.6, hour: 16 },
    { profit: 780.0, symbol: "AUDJPY", type: "sell", volume: 0.3, hour: 10 },
    { profit: -450.3, symbol: "USDCAD", type: "buy", volume: 0.2, hour: 20 },
    { profit: 1890.0, symbol: "USDJPY", type: "buy", volume: 0.4, hour: 13 },
    { profit: 670.5, symbol: "EURUSD", type: "sell", volume: 0.3, hour: 9 },
    { profit: -320.0, symbol: "NZDUSD", type: "buy", volume: 0.2, hour: 17 },
    { profit: 2100.0, symbol: "GBPUSD", type: "sell", volume: 0.5, hour: 15 },
    { profit: -1500.0, symbol: "EURJPY", type: "sell", volume: 0.4, hour: 11 },
    { profit: 950.0, symbol: "AUDUSD", type: "buy", volume: 0.3, hour: 10 },
    { profit: 1450.8, symbol: "USDJPY", type: "sell", volume: 0.3, hour: 14 },
    { profit: -680.0, symbol: "GBPUSD", type: "buy", volume: 0.3, hour: 16 },
    { profit: 2800.0, symbol: "GBPJPY", type: "sell", volume: 0.5, hour: 12 },
    { profit: 430.5, symbol: "USDCAD", type: "buy", volume: 0.2, hour: 19 },
    { profit: -950.0, symbol: "EURUSD", type: "buy", volume: 0.4, hour: 10 },
    { profit: 1780.0, symbol: "USDJPY", type: "buy", volume: 0.4, hour: 15 },
    { profit: 520.0, symbol: "AUDJPY", type: "sell", volume: 0.2, hour: 11 },
    { profit: -280.0, symbol: "NZDUSD", type: "sell", volume: 0.2, hour: 17 },
    { profit: 3200.0, symbol: "GBPJPY", type: "buy", volume: 0.6, hour: 13 },
    { profit: -1100.0, symbol: "EURJPY", type: "buy", volume: 0.4, hour: 9 },
    { profit: 890.0, symbol: "AUDUSD", type: "sell", volume: 0.3, hour: 14 },
    { profit: 1650.0, symbol: "USDJPY", type: "sell", volume: 0.4, hour: 16 },
    { profit: -750.0, symbol: "GBPUSD", type: "sell", volume: 0.3, hour: 10 },
    { profit: 2050.0, symbol: "EURUSD", type: "buy", volume: 0.5, hour: 12 },
    { profit: 340.0, symbol: "USDCAD", type: "sell", volume: 0.2, hour: 18 },
    { profit: -420.0, symbol: "AUDJPY", type: "buy", volume: 0.2, hour: 15 },
  ];

  const header =
    "Ticket,Open Time,Close Time,Type,Size,Item,Price,Price,Commission,Swap,Profit";
  const rows = trades.map((trade, i) => {
    const ticket = 10001000 + i;
    const day = 1 + Math.floor(i / 2);
    const dayStr = day.toString().padStart(2, "0");
    const hourStr = trade.hour.toString().padStart(2, "0");
    const openMin = Math.floor(Math.random() * 50)
      .toString()
      .padStart(2, "0");
    const closeMin = (parseInt(openMin) + 5 + Math.floor(Math.random() * 20))
      .toString()
      .padStart(2, "0");

    const basePrice =
      trade.symbol === "USDJPY"
        ? 150.0 + Math.random() * 2
        : trade.symbol === "EURJPY"
          ? 163.0 + Math.random() * 2
          : trade.symbol === "GBPJPY"
            ? 190.0 + Math.random() * 2
            : trade.symbol === "AUDJPY"
              ? 97.0 + Math.random() * 1
              : trade.symbol === "EURUSD"
                ? 1.08 + Math.random() * 0.01
                : trade.symbol === "GBPUSD"
                  ? 1.27 + Math.random() * 0.01
                  : trade.symbol === "AUDUSD"
                    ? 0.65 + Math.random() * 0.01
                    : trade.symbol === "NZDUSD"
                      ? 0.61 + Math.random() * 0.01
                      : 1.36 + Math.random() * 0.01; // USDCAD

    const decimals = trade.symbol.includes("JPY") ? 3 : 5;
    const openPrice = basePrice.toFixed(decimals);
    const closePrice = (
      basePrice +
      (trade.profit > 0 ? 0.5 : -0.3) * (Math.random() + 0.5)
    ).toFixed(decimals);
    const commission = (-trade.volume * 7).toFixed(2);

    return `${ticket},2025.01.${dayStr} ${hourStr}:${openMin},2025.01.${dayStr} ${(parseInt(hourStr) + 1).toString().padStart(2, "0")}:${closeMin},${trade.type},${trade.volume.toFixed(2)},${trade.symbol},${openPrice},${closePrice},${commission},0.00,${trade.profit.toFixed(2)}`;
  });

  return [header, ...rows].join("\n");
}
