import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, RefreshCw, Coins, Gem } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrices } from "@/hooks/use-prices";
import { formatVND, formatVNDFull, pctChange, toGrams, unitLabel } from "@/lib/formatters";
import type { Holding } from "@shared/schema";
import UserMenu from "@/components/UserMenu";

// Gold logo SVG
function GoldLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-label="VàngBạc" className="w-8 h-8">
      <circle cx="20" cy="20" r="18" stroke="#d4a017" strokeWidth="2" />
      <polygon points="20,8 24,17 34,17 26,23 29,33 20,27 11,33 14,23 6,17 16,17" fill="#d4a017" opacity="0.85" />
      <polygon points="20,12 23,19 30,19 24.5,23 26.5,30 20,26 13.5,30 15.5,23 10,19 17,19" fill="#f0c040" />
    </svg>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold" style={{ color: color || "hsl(42 30% 90%)" }}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: pricesData, isLoading: pricesLoading, refetch, isFetching } = usePrices();
  const { data: holdingsData } = useQuery<{ success: boolean; data: Holding[] }>({ queryKey: ["/api/holdings"] });

  const holdings = holdingsData?.data ?? [];
  const prices = pricesData?.data;
  const spot = pricesData?.spot;

  // Find SJC buy price
  const sjcGold = prices?.gold?.find((g) => g.name.includes("SJC"));
  const nhanGold = prices?.gold?.find((g) => g.name.includes("NHẪN") || g.name.includes("TRÒN"));
  const silverItem = prices?.silver?.[0];

  // Calculate portfolio value
  let totalBuyCost = 0;
  let totalCurrentValue = 0;
  holdings.forEach((h) => {
    const unitMulti = h.unit === "luong" ? 1 : h.unit === "chi" ? 0.1 : h.unit === "gram" ? 1 / 37.5 : h.unit === "kg" ? (1000 / 37.5) : 1;
    const qty = h.quantity * unitMulti;
    const cost = h.buyPrice * h.quantity;
    totalBuyCost += cost;

    let currentSell = 0;
    if (h.type === "gold") currentSell = (sjcGold?.sellPrice ?? nhanGold?.sellPrice ?? 0) * qty;
    else currentSell = (silverItem?.sellPrice ?? 0) * (h.quantity / (h.unit === "kg" ? 1 : h.unit === "gram" ? 1000 : 37.5));
    totalCurrentValue += currentSell;
  });

  const totalPnL = totalCurrentValue - totalBuyCost;
  const totalPnLPct = totalBuyCost > 0 ? (totalPnL / totalBuyCost) * 100 : 0;
  const isProfit = totalPnL >= 0;

  const goldCount = holdings.filter((h) => h.type === "gold").length;
  const silverCount = holdings.filter((h) => h.type === "silver").length;

  const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="px-4 pb-4 pt-2 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <GoldLogo />
          <div>
            <h1 className="text-base font-bold" style={{ color: "#d4a017" }}>VàngBạc.VN</h1>
            <p className="text-xs text-muted-foreground">Theo dõi tài sản quý</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-full border border-border hover:border-yellow-500 transition-colors"
            data-testid="refresh-btn"
          >
            <RefreshCw size={16} className={`text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <UserMenu />
        </div>
      </div>

      {/* Portfolio summary */}
      <Card className="mb-4 border-yellow-900/40 bg-gradient-to-br from-yellow-950/40 to-card">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Tổng giá trị danh mục</p>
          {pricesLoading ? (
            <Skeleton className="h-8 w-40 mb-2" />
          ) : (
            <p className="text-2xl font-bold" style={{ color: "#f0c040" }} data-testid="total-value">
              {formatVND(totalCurrentValue || totalBuyCost)}
            </p>
          )}
          {holdings.length > 0 && !pricesLoading && (
            <div className="flex items-center gap-2 mt-1">
              {isProfit ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
              <span className={`text-sm font-medium ${isProfit ? "text-green-500" : "text-red-500"}`}>
                {isProfit ? "+" : ""}{formatVND(totalPnL)} ({isProfit ? "+" : ""}{totalPnLPct.toFixed(2)}%)
              </span>
            </div>
          )}
          {holdings.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">Chưa có tài sản. Thêm ở tab Danh mục.</p>
          )}
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className="gap-1 text-yellow-400 border-yellow-800">
              <Coins size={11} /> {goldCount} vàng
            </Badge>
            <Badge variant="outline" className="gap-1 text-slate-400 border-slate-700">
              <Gem size={11} /> {silverCount} bạc
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Live spot prices */}
      <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Giá thị trường</h2>

      {pricesLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            label="Vàng SJC (bán ra)"
            value={sjcGold ? formatVND(sjcGold.sellPrice) : "—"}
            sub={sjcGold ? `Mua: ${formatVND(sjcGold.buyPrice)}` : undefined}
            color="#f0c040"
          />
          <StatCard
            label="Vàng nhẫn (bán ra)"
            value={nhanGold ? formatVND(nhanGold.sellPrice) : "—"}
            sub={nhanGold ? `Mua: ${formatVND(nhanGold.buyPrice)}` : undefined}
            color="#e8ba45"
          />
          <StatCard
            label="Bạc BTMC (bán ra)"
            value={silverItem ? formatVND(silverItem.sellPrice) : "—"}
            sub={silverItem ? `Mua: ${formatVND(silverItem.buyPrice)}` : undefined}
            color="#c8ced4"
          />
          <StatCard
            label="Vàng thế giới"
            value={spot?.goldUSD ? `$${spot.goldUSD.toFixed(0)}/oz` : "—"}
            sub={spot?.usdvnd ? `1 USD = ${formatVND(spot.usdvnd)}` : undefined}
          />
        </div>
      )}

      {/* Holdings list */}
      {holdings.length > 0 && (
        <>
          <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Tài sản của bạn</h2>
          <div className="space-y-2">
            {holdings.map((h) => {
              const currentSellPerUnit = h.type === "gold"
                ? (sjcGold?.sellPrice ?? nhanGold?.sellPrice ?? 0)
                : (silverItem?.sellPrice ?? 0);
              const currentValue = currentSellPerUnit > 0 ? currentSellPerUnit * h.quantity : h.buyPrice * h.quantity;
              const cost = h.buyPrice * h.quantity;
              const pnl = currentValue - cost;
              const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
              const isUp = pnl >= 0;
              return (
                <Card key={h.id} className="border-border bg-card" data-testid={`holding-card-${h.id}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{h.brand}</span>
                        <Badge variant="outline" className={`text-xs ${h.type === "gold" ? "text-yellow-400 border-yellow-800" : "text-slate-400 border-slate-700"}`}>
                          {h.type === "gold" ? "Vàng" : "Bạc"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{h.product} · {h.quantity} {unitLabel(h.unit)}</p>
                      <p className="text-xs text-muted-foreground">Mua: {formatVND(h.buyPrice)}/{unitLabel(h.unit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "#f0c040" }}>{formatVND(currentValue)}</p>
                      <p className={`text-xs font-medium ${isUp ? "text-green-500" : "text-red-500"}`}>
                        {isUp ? "+" : ""}{formatVND(pnl)} ({isUp ? "+" : ""}{pnlPct.toFixed(1)}%)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground text-center mt-4">Cập nhật lúc {now} · Nguồn: BTMC</p>
      <p className="text-xs text-muted-foreground text-center mt-2 pt-2 border-t border-border/30">
        <span className="font-medium" style={{ color: "#d4a017" }}>Thái Văn Tài</span>
        {" · "}Mobi/Zalo: <a href="tel:0967686821" className="hover:text-yellow-400 transition-colors">0967 6868 21</a>
        {" · "}Email: <a href="mailto:Thaivantai.tcnh@gmail.com" className="hover:text-yellow-400 transition-colors">Thaivantai.tcnh@gmail.com</a>
      </p>
    </div>
  );
}
