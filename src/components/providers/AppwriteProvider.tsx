"use client";

import { Account, Databases, Models, Storage } from "appwrite";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAppwriteClient } from "@/lib/appwrite/client";

type AppwriteContextValue = {
  account: Account | null;
  databases: Databases | null;
  storage: Storage | null;
  currentUser: Models.User<Models.Preferences> | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AppwriteContext = createContext<AppwriteContextValue | undefined>(
  undefined,
);

export const AppwriteProvider = ({ children }: PropsWithChildren) => {
  const { initialize, account, databases, storage } = useAppwriteClient();
  const [currentUser, setCurrentUser] =
    useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!account) return;
    try {
      const user = await account.get();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (account) {
      void fetchUser();
    } else {
      setLoading(false);
    }
  }, [account, fetchUser]);

  const value = useMemo<AppwriteContextValue>(
    () => ({
      account,
      databases,
      storage,
      currentUser,
      loading,
      refreshUser: async () => {
        setLoading(true);
        await fetchUser();
      },
    }),
    [account, currentUser, databases, loading, storage, fetchUser],
  );

  return (
    <AppwriteContext.Provider value={value}>
      {children}
    </AppwriteContext.Provider>
  );
};

export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (!context) {
    throw new Error("useAppwrite must be used within AppwriteProvider");
  }
  return context;
};

