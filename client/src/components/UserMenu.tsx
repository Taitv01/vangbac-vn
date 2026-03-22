import { useState } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useAuth, clearAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function UserMenu() {
  const { user } = useAuth();

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
  };

  if (!user) return null;

  // Initials avatar
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-yellow-900/50 hover:border-yellow-500 transition-colors"
          data-testid="user-menu-trigger"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
            style={{ background: "linear-gradient(135deg, #d4a017, #8a6500)" }}
          >
            {initials}
          </div>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-400 focus:text-red-400 cursor-pointer"
          onClick={handleLogout}
          data-testid="btn-logout"
        >
          <LogOut size={14} className="mr-2" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
