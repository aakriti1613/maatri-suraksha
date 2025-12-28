import { NextRequest, NextResponse } from "next/server";
import {
  getServerDatabases,
  serverCollections,
  serverQuery,
} from "@/lib/appwrite/server";
import { appwriteServerConfig } from "@/lib/appwrite/config";

export async function GET(request: NextRequest) {
  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.apiKey ||
    !appwriteServerConfig.projectId
  ) {
    return NextResponse.json(
      { error: "Appwrite server configuration missing" },
      { status: 500 },
    );
  }

  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;

  try {
    const databases = getServerDatabases();
    const response = await databases.listDocuments(
      appwriteServerConfig.databaseId,
      serverCollections.alerts,
      userId ? [serverQuery.equal("assignedTo", userId)] : undefined,
    );

    return NextResponse.json({
      alerts: response.documents.map((doc) => ({
        id: doc.$id,
        message: doc.message,
        dueOn: doc.dueOn ?? doc.$createdAt,
        priority: doc.priority ?? "medium",
        status: doc.status ?? "pending",
        type: doc.type ?? "general",
      })),
      demoFallback: false,
    });
  } catch (error) {
    console.error("Failed to load alerts", error);
    return NextResponse.json(
      {
        alerts: [
          {
            id: "demo-1",
            message: "ANC visit due for Sunita Devi",
            dueOn: new Date().toISOString(),
            priority: "high",
            status: "dueSoon",
            type: "visit",
          },
          {
            id: "demo-2",
            message: "Iron tablets refill reminder",
            dueOn: new Date(Date.now() + 2 * 86400000).toISOString(),
            priority: "medium",
            status: "pending",
            type: "medication",
          },
        ],
        demoFallback: true,
      },
      { status: 200 },
    );
  }
}



