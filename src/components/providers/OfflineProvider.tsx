"use client";

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { nanoid } from "nanoid";
import {
  PendingMutation,
  addPendingMutation,
  listPendingMutations,
  removePendingMutation,
} from "@/lib/offline/db";

type MutationHandler = (mutation: PendingMutation) => Promise<void>;

type OfflineContextValue = {
  isOnline: boolean;
  pendingCount: number;
  enqueue: (mutation: Omit<PendingMutation, "id" | "createdAt">) => Promise<void>;
  flushQueue: () => Promise<void>;
  registerHandler: (type: string, handler: MutationHandler) => void;
};

const OfflineContext = createContext<OfflineContextValue | undefined>(
  undefined,
);

export const OfflineProvider = ({ children }: PropsWithChildren) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const handlersRef = useRef<Record<string, MutationHandler>>({});

  const refreshPending = useCallback(async () => {
    const items = await listPendingMutations();
    setPendingCount(items.length);
  }, []);

  const enqueue = useCallback(
    async (mutation: Omit<PendingMutation, "id" | "createdAt">) => {
      const record: PendingMutation = {
        ...mutation,
        id: mutation.id ?? nanoid(),
        createdAt: Date.now(),
      };
      await addPendingMutation(record);
      await refreshPending();
    },
    [refreshPending],
  );

  const flushQueue = useCallback(async () => {
    const items = await listPendingMutations();
    for (const mutation of items) {
      const handler = handlersRef.current[mutation.type];
      if (!handler) continue;
      try {
        await handler(mutation);
        await removePendingMutation(mutation.id);
      } catch (error) {
        console.error("Failed to sync mutation", mutation.type, error);
      }
    }
    await refreshPending();
  }, [refreshPending]);

  const registerHandler = useCallback((type: string, handler: MutationHandler) => {
    handlersRef.current[type] = handler;
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const syncPending = async () => {
      await refreshPending();
    };
    void syncPending();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshPending]);

  useEffect(() => {
    if (!isOnline) return;
    const sync = async () => {
      await flushQueue();
    };
    void sync();
  }, [flushQueue, isOnline]);

  const value = useMemo<OfflineContextValue>(
    () => ({
      isOnline,
      pendingCount,
      enqueue,
      flushQueue,
      registerHandler,
    }),
    [enqueue, flushQueue, isOnline, pendingCount, registerHandler],
  );

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return ctx;
};

