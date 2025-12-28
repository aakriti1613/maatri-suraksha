import { NextRequest, NextResponse } from "next/server";
import { getServerDatabases, serverCollections } from "@/lib/appwrite/server";
import { appwriteServerConfig } from "@/lib/appwrite/config";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = params;

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

  try {
    const databases = getServerDatabases();
    await databases.updateDocument(
      appwriteServerConfig.databaseId,
      serverCollections.alerts,
      id,
      {
        status: "completed",
        completedAt: new Date().toISOString(),
      },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to mark alert complete", error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as { message?: string })?.message ?? "Failed to mark complete",
      },
      { status: 500 },
    );
  }
}



