export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "",
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ?? "",
};

export const appwriteServerConfig = {
  endpoint: process.env.APPWRITE_API_ENDPOINT ?? "",
  projectId: process.env.APPWRITE_PROJECT_ID ?? "",
  apiKey: process.env.APPWRITE_API_KEY ?? "",
  databaseId: process.env.APPWRITE_DATABASE_ID ?? "",
  bucketId: process.env.APPWRITE_BUCKET_ID ?? "",
};

export const collectionIds = {
  users: "users",
  pregnancies: "pregnancies",
  healthRecords: "healthRecords",
  riskPredictions: "riskPredictions",
  medications: "medications",
  dietPlans: "dietPlans",
  alerts: "alerts",
};

export const functionsIds = {
  analyticsSnapshot: "analytics-snapshot",
};

export const aiConfig = {
  endpoint: process.env.AI_SERVICE_URL ?? "",
  apiKey: process.env.AI_SERVICE_API_KEY ?? "",
};

