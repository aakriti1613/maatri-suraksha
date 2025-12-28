import { openDB } from "idb";

const DB_NAME = "maternal-health-companion";
const DB_VERSION = 1;
export const MUTATION_STORE = "pendingMutations";
export const CACHE_STORE = "cache";

export type PendingMutation = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
  retryCount?: number;
};

export const getDatabase = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(MUTATION_STORE)) {
        db.createObjectStore(MUTATION_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE);
      }
    },
  });

export const addPendingMutation = async (mutation: PendingMutation) => {
  const db = await getDatabase();
  await db.put(MUTATION_STORE, mutation);
};

export const listPendingMutations = async () => {
  const db = await getDatabase();
  return db.getAll(MUTATION_STORE) as Promise<PendingMutation[]>;
};

export const removePendingMutation = async (id: string) => {
  const db = await getDatabase();
  await db.delete(MUTATION_STORE, id);
};

export const writeCache = async (key: string, value: unknown) => {
  const db = await getDatabase();
  await db.put(CACHE_STORE, value, key);
};

export const readCache = async <T>(key: string) => {
  const db = await getDatabase();
  return (await db.get(CACHE_STORE, key)) as T | undefined;
};

