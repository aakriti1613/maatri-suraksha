import { NextRequest, NextResponse } from "next/server";
import {
  getServerDatabases,
  serverCollections,
  serverQuery,
} from "@/lib/appwrite/server";
import { appwriteServerConfig } from "@/lib/appwrite/config";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role") ?? "asha";
  const userId = searchParams.get("userId") ?? undefined;

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
    const databaseId = appwriteServerConfig.databaseId;

    const pregnanciesPromise = databases.listDocuments(
      databaseId,
      serverCollections.pregnancies,
      userId ? [serverQuery.equal("assignedTo", userId)] : undefined,
    );

    const alertsPromise = databases.listDocuments(
      databaseId,
      serverCollections.alerts,
      userId ? [serverQuery.equal("assignedTo", userId)] : undefined,
    );

    const riskPromise = databases.listDocuments(
      databaseId,
      serverCollections.riskPredictions,
      undefined,
    );

    const [pregnancies, alerts, risks] = await Promise.allSettled([
      pregnanciesPromise,
      alertsPromise,
      riskPromise,
    ]);

    const totals = {
      pregnancies:
        pregnancies.status === "fulfilled" ? pregnancies.value.total : 0,
      highRisk:
        risks.status === "fulfilled"
          ? risks.value.documents.filter((doc) => doc.category === "high").length
          : 0,
      upcomingFollowUps:
        alerts.status === "fulfilled"
          ? alerts.value.documents.filter((doc) => doc.status === "dueSoon").length
          : 0,
    };

    const upcomingAlerts =
      alerts.status === "fulfilled"
        ? alerts.value.documents
            .filter((doc) => doc.status !== "completed")
            .slice(0, 5)
            .map((doc) => ({
              id: doc.$id,
              message: doc.message,
              dueOn: doc.dueOn,
              priority: doc.priority,
              type: doc.type,
            }))
        : [];

    const riskTrend =
      risks.status === "fulfilled"
        ? risks.value.documents.slice(-12).map((doc) => ({
            month: doc.assessedOn ?? doc.$createdAt,
            score: doc.score,
            category: doc.category,
          }))
        : [];

    return NextResponse.json({
      role,
      totals,
      upcomingAlerts,
      riskTrend,
      demoFallback: false,
    });
  } catch (error) {
    console.error("Dashboard fetch failed", error);
    return NextResponse.json(
      {
        role,
        totals: {
          pregnancies: 24,
          highRisk: 5,
          upcomingFollowUps: 8,
        },
        upcomingAlerts: [
          {
            id: "demo-1",
            message: "Schedule Hb test for Rani Devi",
            dueOn: new Date().toISOString(),
            priority: "high",
            type: "lab",
          },
          {
            id: "demo-2",
            message: "Home visit for postnatal counselling",
            dueOn: new Date(Date.now() + 86400000).toISOString(),
            priority: "medium",
            type: "visit",
          },
        ],
        riskTrend: [
          { month: "2025-01-01", score: 62, category: "medium" },
          { month: "2025-02-01", score: 45, category: "low" },
          { month: "2025-03-01", score: 78, category: "high" },
        ],
        demoFallback: true,
      },
      { status: 200 },
    );
  }
}


