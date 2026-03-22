import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PriceItem {
  name: string;
  buyPrice: number;
  sellPrice: number;
  updatedAt: string;
}

interface SpotData {
  goldUSD: number | null;
  silverUSD: number | null;
  usdvnd: number;
}

interface PricesResponse {
  success: boolean;
  data: { gold: PriceItem[]; silver: PriceItem[] } | null;
  spot: SpotData;
}

export function usePrices() {
  return useQuery<PricesResponse>({
    queryKey: ["/api/prices"],
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
    staleTime: 3 * 60 * 1000,
  });
}

export function usePriceHistory(type: string, product: string) {
  return useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/prices/history", type, product],
    queryFn: () => apiRequest("GET", `/api/prices/history?type=${type}&product=${encodeURIComponent(product)}`).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });
}

export { type PriceItem, type SpotData };
