import { useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePrices } from "@/hooks/use-prices";
import { formatVNDFull, formatVND } from "@/lib/formatters";

function PriceRow({ name, buy, sell, updated }: { name: string; buy: number; sell: number; updated?: string }) {
  const spread = sell - buy;
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border last:border-0" data-testid={`price-row-${name.slice(0, 10)}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium flex-1 leading-tight">{name}</p>
        <Badge variant="outline" className="text-yellow-400 border-yellow-900 text-xs shrink-0">
          +{formatVND(spread)}
        </Badge>
      </div>
      <div className="flex gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Mua vào</p>
          <p className="text-sm font-bold text-green-500">{buy > 0 ? formatVND(buy) : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Bán ra</p>
          <p className="text-sm font-bold" style={{ color: "#f0c040" }}>{sell > 0 ? formatVND(sell) : "—"}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Cập nhật</p>
          <p className="text-xs text-muted-foreground">{updated?.split(" ")[1] ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}

export default function Prices() {
  const { data, isLoading, refetch, isFetching } = usePrices();

  const gold = data?.data?.gold ?? [];
  const silver = data?.data?.silver ?? [];
  const spot = data?.spot;

  return (
    <div className="px-4 pb-4 pt-2 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#d4a017" }}>Bảng giá</h1>
          <p className="text-xs text-muted-foreground">Cập nhật từ BTMC · Yahoo Finance</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-full border border-border hover:border-yellow-600 transition-colors"
          data-testid="prices-refresh"
        >
          <RefreshCw size={16} className={`text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* International spot */}
      {spot && (
        <Card className="mb-4 border-border bg-gradient-to-r from-zinc-900 to-card">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={14} className="text-yellow-400" /> Giá thế giới
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Vàng (XAU)</p>
                <p className="text-sm font-bold text-yellow-400">
                  {spot.goldUSD ? `$${spot.goldUSD.toFixed(0)}` : "—"}/oz
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bạc (XAG)</p>
                <p className="text-sm font-bold text-slate-300">
                  {spot.silverUSD ? `$${spot.silverUSD.toFixed(2)}` : "—"}/oz
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">USD/VND</p>
                <p className="text-sm font-bold">{formatVND(spot.usdvnd)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs gold/silver */}
      <Tabs defaultValue="gold">
        <TabsList className="w-full mb-3 bg-muted">
          <TabsTrigger value="gold" className="flex-1 data-[state=active]:text-yellow-400">
            🥇 Vàng
          </TabsTrigger>
          <TabsTrigger value="silver" className="flex-1 data-[state=active]:text-slate-300">
            🥈 Bạc
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gold">
          <Card className="border-border">
            <CardContent className="px-4 py-0">
              {isLoading
                ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 my-2" />)
                : gold.length === 0
                ? <p className="text-muted-foreground text-sm py-4 text-center">Không có dữ liệu</p>
                : gold.map((g) => (
                    <PriceRow
                      key={g.name}
                      name={g.name}
                      buy={g.buyPrice}
                      sell={g.sellPrice}
                      updated={g.updatedAt}
                    />
                  ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="silver">
          <Card className="border-border">
            <CardContent className="px-4 py-0">
              {isLoading
                ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 my-2" />)
                : silver.length === 0
                ? <p className="text-muted-foreground text-sm py-4 text-center">Không có dữ liệu</p>
                : silver.map((s) => (
                    <PriceRow
                      key={s.name}
                      name={s.name}
                      buy={s.buyPrice}
                      sell={s.sellPrice}
                      updated={s.updatedAt}
                    />
                  ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Nguồn: Bảo Tín Minh Châu (BTMC) · Tự động làm mới mỗi 5 phút
      </p>
    </div>
  );
}
