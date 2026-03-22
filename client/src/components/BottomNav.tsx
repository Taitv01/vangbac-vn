import { useLocation } from "wouter";
import { Link } from "wouter";
import { LayoutDashboard, TrendingUp, Wallet } from "lucide-react";

const navItems = [
  { path: "/", label: "Tổng quan", icon: LayoutDashboard },
  { path: "/prices", label: "Bảng giá", icon: TrendingUp },
  { path: "/portfolio", label: "Danh mục", icon: Wallet },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location === path;
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center gap-1 min-w-[64px] py-1"
              data-testid={`nav-${label}`}
            >
              <Icon
                size={22}
                className={active ? "text-yellow-400" : "text-muted-foreground"}
              />
              <span
                className="text-xs"
                style={{ color: active ? "hsl(43 85% 52%)" : undefined }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
