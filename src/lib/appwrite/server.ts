import { Client, Databases, Query, ID, Users } from "node-appwrite";
import { appwriteServerConfig, collectionIds } from "./config";

const getServerClient = () => {
  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.projectId ||
    !appwriteServerConfig.apiKey
  ) {
    throw new Error("Appwrite server configuration is incomplete.");
  }

  return new Client()
    .setEndpoint(appwriteServerConfig.endpoint)
    .setProject(appwriteServerConfig.projectId)
    .setKey(appwriteServerConfig.apiKey);
};

export const getServerDatabases = () => {
  const client = getServerClient();
  return new Databases(client);
};

export const getServerUsers = () => {
  const client = getServerClient();
  return new Users(client);
};

export const serverQuery = Query;
export const serverCollections = collectionIds;
export const serverId = ID;

