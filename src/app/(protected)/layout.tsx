"use client";

import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BellRing,
  ClipboardPlus,
  Home,
  LogOut,
  Salad,
  ShieldAlert,
  Stethoscope,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppwrite } from "@/components/providers/AppwriteProvider";
import { useOffline } from "@/components/providers/OfflineProvider";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const { currentUser, loading, account, refreshUser } = useAppwrite();
  const { pendingCount } = useOffline();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/auth/login");
    }
  }, [currentUser, loading, router]);

  const role = useMemo(
    () =>
      (currentUser?.prefs as { role?: string } | undefined)?.role?.toLowerCase() ?? "asha",
    [currentUser?.prefs],
  );

  const navItems = useMemo<NavItem[]>(
    () => [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Add Pregnancy", href: "/pregnancies/new", icon: ClipboardPlus },
      { label: "Follow-ups & Alerts", href: "/alerts", icon: BellRing },
      { label: "Risk Prediction", href: "/predictions", icon: Activity },
      { label: "Action Plan", href: "/action-plan", icon: ShieldAlert },
      { label: "Diet & Nutrition", href: "/diet", icon: Salad },
      { label: "Medicine Tracker", href: "/medications", icon: Stethoscope },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        roles: ["doctor", "admin"],
      },
      {
        label: "Data Ethics",
        href: "/privacy",
        icon: ShieldAlert,
      },
    ],
    [],
  );

  const filteredNav = useMemo(
    () => navItems.filter((item) => !item.roles || item.roles.includes(role)),
    [navItems, role],
  );

  const handleSignOut = async () => {
    if (!account) return;
    try {
      setIsSigningOut(true);
      await account.deleteSession("current");
      await refreshUser();
      router.replace("/auth/login");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading || (!currentUser && !isSigningOut)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--gradient-soft)]">
        <div className="glass-card flex flex-col items-center gap-4 rounded-3xl px-12 py-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-accent-peach)] border-t-transparent" />
          <p className="text-lg font-semibold text-[var(--color-foreground)]">
            Securing your session...
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Checking Appwrite authentication and syncing offline changes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--gradient-soft)]">
      <aside className="glass-card sticky top-4 hidden h-[calc(100vh-2rem)] w-72 flex-col justify-between rounded-3xl p-6 shadow-xl md:flex">
        <div className="flex flex-col gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-[var(--color-risk-high)]" />
            <div>
              <p className="text-lg font-semibold text-[var(--color-foreground)]">
                Maatri Suraksha
              </p>
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Maternal Care Companion
              </p>
            </div>
          </Link>
          <nav className="flex flex-col gap-2">
            {filteredNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[var(--color-accent-peach)]/90 text-[var(--color-foreground)] shadow-lg"
                      : "text-[var(--color-muted-foreground)] hover:bg-white/70"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4">
          <div className="flex items-center gap-3">
            <UserCircle className="h-10 w-10 text-[var(--color-accent-lavender)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {currentUser?.name ?? currentUser?.email}
              </p>
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {role}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
            <span>Pending sync</span>
            <div className="flex items-center gap-1 font-semibold text-[var(--color-foreground)]">
              <Activity className="h-4 w-4 text-[var(--color-accent-mint)]" />
              {pendingCount}
            </div>
          </div>
          <Button
            variant="secondary"
            className="justify-center"
            onClick={handleSignOut}
            isLoading={isSigningOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex w-full flex-1 flex-col gap-6 p-4 md:p-8">
        <header className="glass-card flex items-center justify-between rounded-3xl px-6 py-4 shadow">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-foreground)]">
              {pathname === "/dashboard"
                ? "Care Dashboard"
                : pathname === "/analytics"
                  ? "Analytics & Insights"
                  : pathname === "/predictions"
                    ? "AI Risk Prediction"
                    : pathname?.startsWith("/action-plan")
                      ? "Personalised Action Plan"
                      : "Maternal Care Workspace"}
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Keeping mothers safe with explainable AI and community care.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <ShieldAlert className="h-4 w-4 text-[var(--color-risk-low)]" />
            {role}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}


