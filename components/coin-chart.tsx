"use client";
import { Button } from "@/components/ui/button";
import React, { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const CoinChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State for MA Periods
  const [ma1Period, setMa1Period] = useState(5);
  const [ma2Period, setMa2Period] = useState(20);

  const [mode, setMode] = useState<"none" | "buy" | "sell">("buy");
  const [points, setPoints] = useState<
    {
      time: string;
      price: number;
      amount: number;
      type: "buy" | "sell";
      timestamp: number;
    }[]
  >([]);

  const [fibIndex, setFibIndex] = useState(0);
  const [profit, setProfit] = useState<number | null>(null);

  const FIB_SERIES = [10, 10, 20, 30, 50, 80, 130, 210];

  const calculateMAs = (rawData: any[], periods: number[]) => {
    return rawData.map((item, index) => {
      const maValues: Record<string, number | null> = {};
      for (const period of periods) {
        if (index < period - 1) {
          maValues[`ma${period}`] = null;
        } else {
          const sum = rawData
            .slice(index - period + 1, index + 1)
            .reduce((acc, cur) => acc + cur.close, 0);
          maValues[`ma${period}`] = sum / period;
        }
      }
      return { ...item, ...maValues };
    });
  };

  const [interval, setIntervalValue] = useState("1h");
  const [limit, setLimit] = useState(240);
  const [refreshInterval, setRefreshInterval] = useState(5000); // default: 5 seconds
  const [symbol, setSymbol] = useState("BTCUSDT");

  const fetchBTCData = useCallback(async () => {
    try {
      setLoading(true);

      //5m x (12 x 12) = 720m = 12h
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      const json = await res.json();

      // [
      //   0: Open time (ms),
      //   1: Open,
      //   2: High,
      //   3: Low,
      //   4: Close,
      //   5: Volume,
      //   6: Close time,
      //   7: Quote asset volume,
      //   8: Number of trades,
      //   9: Taker buy base volume,
      //  10: Taker buy quote volume,
      //  11: Ignore
      // ]
      const parsed = json.map((item: any) => ({
        timestamp: item[0], // raw ms value
        time: new Date(item[0]).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),

        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
      }));

      const withMA = calculateMAs(parsed, [ma1Period, ma2Period]);
      setData(withMA);
    } catch (err) {
      console.log(`debug:err`, err);
    } finally {
      setLoading(false);
    }
  }, [interval, limit, ma1Period, ma2Period, symbol]);

  useEffect(() => {
    fetchBTCData();
    const interval = setInterval(fetchBTCData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchBTCData, refreshInterval]);

  const calculateProfit = (sellPrice: number) => {
    const unmatchedBuys = [];
    const matchedBuys = new Set();

    for (const p of points) {
      if (p.type === "buy" && !matchedBuys.has(p)) {
        unmatchedBuys.push(p);
      }
      if (p.type === "sell") {
        unmatchedBuys.length = 0;
      }
    }

    let totalProfit = 0;

    for (const buy of unmatchedBuys) {
      const gain = (sellPrice - buy.price) / buy.price;
      totalProfit += gain * buy.amount;
      matchedBuys.add(buy);
    }

    return totalProfit;
  };

  const handleChartClick = (e: any) => {
    if (!e || !e.activeLabel || !data.length) return;

    const clickedPoint = data.find((item) => item.time === e.activeLabel);
    if (!clickedPoint) return;

    const price = clickedPoint.close;
    console.log(`debug:price`, mode, clickedPoint);

    if (mode === "buy") {
      const amount = FIB_SERIES[fibIndex] ?? FIB_SERIES[FIB_SERIES.length - 1];
      setPoints((prev) => [
        ...prev,
        {
          time: clickedPoint.time,
          price,
          amount,
          type: "buy",
          timestamp: clickedPoint.timestamp,
        },
      ]);
      setFibIndex((prev) => prev + 1);
    }

    if (mode === "sell") {
      if (points.length === 0) return;
      const sellPrice = price;

      setPoints((prev) => [
        ...prev,
        {
          time: clickedPoint.time,
          price,
          amount: 0,
          type: "sell",
          timestamp: clickedPoint.timestamp,
        },
      ]);

      const totalProfit = calculateProfit(sellPrice);
      setProfit(totalProfit);
    }
  };

  const resetTrade = () => {
    setMode("buy");
    setPoints([]);
    setProfit(null);
    setFibIndex(0);
  };

  const totalSpent = points
    .filter((p) => p.type === "buy")
    .reduce((acc, buy) => acc + buy.amount, 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") {
        setMode("buy");
      }
      if (e.key === "2") {
        setMode("sell");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // Auto-pick a step based on price range
  let step = 1;
  if (priceRange > 2000) step = 500;
  else if (priceRange > 500) step = 100;
  else if (priceRange > 100) step = 20;
  else if (priceRange > 50) step = 10;
  else if (priceRange > 10) step = 5;
  else step = 1;

  // Round min/max to nearest step
  const adjustedMin = Math.floor(minPrice / step) * step;
  const adjustedMax = Math.ceil(maxPrice / step) * step;

  // Generate ticks
  const ticks = [];
  for (let p = adjustedMin; p <= adjustedMax; p += step) {
    ticks.push(p);
  }

  return (
    <div className="p-6 w-full mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">BTC/USDT 5m Chart</h1>

      <div className="flex justify-center gap-4">
        <label className="flex items-center gap-2">
          Symbol:
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="BTCUSDT">BTC</option>
            <option value="ETHUSDT">ETH</option>
            <option value="SOLUSDT">SOL</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Interval:
          <input
            type="text"
            value={interval}
            onChange={(e) => setIntervalValue(e.target.value)}
            className="border px-2 py-1 rounded w-20"
            placeholder="e.g. 15m"
          />
        </label>
        <label className="flex items-center gap-2">
          Limit:
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="border px-2 py-1 rounded w-20"
            min={1}
            max={1000}
          />
        </label>
        <label className="flex items-center gap-2">
          Refresh (ms):
          <input
            type="number"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="border px-2 py-1 rounded w-24"
            min={1000}
            step={1000}
          />
        </label>
      </div>

      <div className="flex justify-center gap-4">
        <label className="flex items-center gap-2">
          MA1:
          <input
            type="number"
            value={ma1Period}
            onChange={(e) => setMa1Period(parseInt(e.target.value))}
            className="border px-2 py-1 rounded w-16"
          />
        </label>
        <label className="flex items-center gap-2">
          MA2:
          <input
            type="number"
            value={ma2Period}
            onChange={(e) => setMa2Period(parseInt(e.target.value))}
            className="border px-2 py-1 rounded w-16"
          />
        </label>
      </div>
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => setMode("buy")}
          variant={mode === "buy" ? "default" : "outline"}
        >
          Buy Mode
        </Button>
        <Button
          onClick={() => setMode("sell")}
          variant={mode === "sell" ? "default" : "outline"}
        >
          Sell Mode
        </Button>
        <Button onClick={resetTrade} variant="destructive">
          Reset
        </Button>
        <Button onClick={fetchBTCData}>Refresh Data</Button>
      </div>

      <div className="text-center text-lg text-gray-700">
        📉 Total Spent: {totalSpent.toFixed(2)} USDT
      </div>

      {profit !== null && (
        <div className="text-center text-lg text-gray-700">
          📉 Profit: {profit.toFixed(2)} USDT
        </div>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} onClick={handleChartClick}>
          <Legend />
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis
            // domain={["auto", "auto"]}
            tickCount={15}
            interval={0}
            tickLine={true}
            domain={[minPrice, maxPrice]}
            ticks={ticks}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="close"
            stroke="black"
            // dot={false}
            name="Close"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={`ma${ma1Period}`}
            stroke="yellow"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={`ma${ma2Period}`}
            stroke="red"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="text-sm text-center">
        Mode: <strong>{mode.toUpperCase()}</strong> — Buys: {points.length}
      </div>

      {points.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-center mb-2">
            Clicked buys
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="py-2 px-4 border-b">#</th>
                  <th className="py-2 px-4 border-b">Time</th>
                  <th className="py-2 px-4 border-b">Price</th>
                  <th className="py-2 px-4 border-b">Type</th>
                  <th className="py-2 px-4 border-b">Amount</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-1 px-4">{index + 1}</td>
                    <td className="py-1 px-4">{p.time}</td>
                    <td className="py-1 px-4">{p.price.toFixed(2)}</td>
                    <td className="py-1 px-4">{p.type}</td>
                    <td className="py-1 px-4">
                      {p.type === "buy" ? p.amount.toFixed(2) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
