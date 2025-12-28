"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAppwrite } from "@/components/providers/AppwriteProvider";

export default function AnalyticsPage() {
  const { currentUser } = useAppwrite();
  const router = useRouter();

  const role = (currentUser?.prefs as { role?: string } | undefined)?.role?.toLowerCase();
  const isAuthorized = role === "doctor" || role === "admin";

  useEffect(() => {
    if (currentUser && !isAuthorized) {
      router.replace("/dashboard");
    }
  }, [currentUser, isAuthorized, router]);

  if (!isAuthorized) {
    return (
      <div className="glass-card flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/60 bg-white/80 p-12 text-center">
        <ShieldAlert className="h-12 w-12 text-[var(--color-risk-medium)]" />
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
          Analytics access restricted
        </h2>
        <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
          Only doctors and program admins can view population-level analytics. Please contact your
          supervisor if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col gap-6 rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-xl">
      <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
        Analytics workspace
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Detailed analytics (risk distribution, anemia prevalence, BP trends, village insights) will
        be populated once Appwrite functions are synced. This module provides ethically governed,
        role-gated insights for programme monitoring.
      </p>
    </div>
  );
}



