"use client";

import { Client, Account, Databases, ID, Query, Storage } from "appwrite";
import { create } from "zustand";
import { appwriteConfig, collectionIds } from "./config";

type AppwriteClientStore = {
  client: Client | null;
  account: Account | null;
  databases: Databases | null;
  storage: Storage | null;
  initialize: () => void;
};

export const useAppwriteClient = create<AppwriteClientStore>((set, get) => ({
  client: null,
  account: null,
  databases: null,
  storage: null,
  initialize: () => {
    if (get().client || !appwriteConfig.endpoint || !appwriteConfig.projectId) {
      return;
    }

    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);

    set({
      client,
      account: new Account(client),
      databases: new Databases(client),
      storage: new Storage(client),
    });
  },
}));

export const createDocumentId = () => ID.unique();
export const appwriteQuery = Query;
export const appwriteCollections = collectionIds;

