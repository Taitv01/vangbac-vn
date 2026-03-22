import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Clock, Newspaper, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UserMenu from "@/components/UserMenu";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

function sourceColor(source: string): string {
  if (source.includes("VNExpress")) return "#d4a017";
  if (source.includes("BTMC")) return "#22c55e";
  if (source.includes("24h")) return "#3b82f6";
  return "#9da3a8";
}

export default function NewsPage() {
  const { data, isLoading, refetch, isFetching } = useQuery<{ success: boolean; data: NewsItem[] }>({
    queryKey: ["/api/news"],
    refetchInterval: 5 * 60 * 1000,
  });

  const news = data?.data ?? [];

  return (
    <div className="px-4 pb-4 pt-2 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Newspaper size={22} className="text-yellow-400" />
          <div>
            <h1 className="text-base font-bold" style={{ color: "#d4a017" }}>Tin tức Vàng Bạc</h1>
            <p className="text-xs text-muted-foreground">Cập nhật liên tục</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-full border border-border hover:border-yellow-500 transition-colors"
          >
            <RefreshCw size={16} className={`text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <UserMenu />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <Newspaper size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Chưa có tin tức nào</p>
            <button onClick={() => refetch()} className="mt-3 text-sm text-yellow-400 hover:underline">
              Thử tải lại
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {news.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="border-border bg-card hover:border-yellow-800 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-tight mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ color: sourceColor(item.source), borderColor: sourceColor(item.source) + "40" }}
                        >
                          {item.source}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={10} />
                          {timeAgo(item.pubDate)}
                        </span>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
