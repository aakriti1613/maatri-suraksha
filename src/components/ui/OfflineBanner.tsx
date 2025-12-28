"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useOffline } from "@/components/providers/OfflineProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

export const OfflineBanner = () => {
  const { isOnline, pendingCount, flushQueue } = useOffline();
  const { t } = useLanguage();

  const message = isOnline ? t("common.online") : t("common.offline");

  return (
    <div className="fixed top-2 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 justify-center px-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          key={isOnline ? "online" : "offline"}
          className={`glass-card flex items-center gap-2 rounded-full px-4 py-2 shadow-lg ${
            isOnline ? "text-[var(--risk-low)]" : "text-[var(--risk-high)]"
          }`}
        >
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span className="text-sm font-medium">{message}</span>
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => flushQueue()}
              className="rounded-full bg-[var(--accent-mint)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--accent-peach)]"
            >
              {t("common.syncNow")} • {pendingCount}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

