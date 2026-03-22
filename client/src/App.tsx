import { useEffect } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Portfolio from "@/pages/Portfolio";
import Prices from "@/pages/Prices";
import NewsPage from "@/pages/NewsPage";
import NotFound from "@/pages/not-found";
import BottomNav from "@/components/BottomNav";
import AuthPage from "@/pages/AuthPage";
import PerplexityAttribution from "@/components/PerplexityAttribution";
import { useAuth, initAuth } from "@/hooks/use-auth";

function AppContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(30 15% 7%)" }}>
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 animate-pulse">
            <circle cx="20" cy="20" r="18" stroke="#d4a017" strokeWidth="2" />
            <polygon points="20,8 24,17 34,17 26,23 29,33 20,27 11,33 14,23 6,17 16,17" fill="#d4a017" opacity="0.85" />
            <polygon points="20,12 23,19 30,19 24.5,23 26.5,30 20,26 13.5,30 15.5,23 10,19 17,19" fill="#f0c040" />
          </svg>
          <p className="text-xs text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/prices" component={Prices} />
          <Route path="/news" component={NewsPage} />
          <Route component={NotFound} />
        </Switch>
        <BottomNav />
      </Router>
      <Toaster />
      <PerplexityAttribution />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
