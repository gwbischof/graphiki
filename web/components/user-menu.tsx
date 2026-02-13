"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut, Shield, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleBadgeColors: Record<string, string> = {
  admin: "bg-red-500/15 text-red-400 border-red-500/20",
  mod: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  user: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-6 w-16 bg-white/[0.04] rounded animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => signIn()}
        className="gap-1.5 text-[10px] text-muted-foreground"
      >
        <LogIn className="size-3" />
        Sign in
      </Button>
    );
  }

  const role = session.user.role || "user";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="gap-1.5 text-[10px] text-muted-foreground"
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              className="size-4 rounded-full"
            />
          ) : (
            <User className="size-3" />
          )}
          <span className="max-w-[80px] truncate">
            {session.user.name || session.user.email}
          </span>
          <Badge
            variant="outline"
            className={`text-[8px] font-mono h-3.5 px-1 ${roleBadgeColors[role] || roleBadgeColors.user}`}
          >
            {role}
          </Badge>
          <ChevronDown className="size-2.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-panel border-white/[0.06] min-w-[160px]"
      >
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium">{session.user.name}</p>
          <p className="text-[10px] text-muted-foreground">{session.user.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        {role === "admin" && (
          <DropdownMenuItem className="text-xs gap-2">
            <Shield className="size-3" />
            Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-xs gap-2"
          onClick={() => signOut()}
        >
          <LogOut className="size-3" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
