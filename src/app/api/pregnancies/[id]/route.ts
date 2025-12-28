import { NextRequest, NextResponse } from "next/server";
import { getServerDatabases, serverCollections } from "@/lib/appwrite/server";
import { appwriteServerConfig } from "@/lib/appwrite/config";

type RouteParams = {
  params: { id: string };
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.projectId ||
    !appwriteServerConfig.apiKey ||
    !appwriteServerConfig.databaseId
  ) {
    return NextResponse.json(
      {
        pregnancy: {
          $id: id,
          personal: {
            name: "Demo Beneficiary",
            age: 24,
            village: "Demo Village",
            phone: "+919876543210",
            education: "Secondary",
          },
          current: {
            lmp: "2025-02-01",
            edd: "2025-11-08",
            trimester: "Trimester 2",
            ancVisits: 3,
            ttDoses: 1,
            ironFolicIntake: "regular",
          },
          health: {
            bmi: 22.3,
            hemoglobin: 10.8,
            bloodSugar: 94,
            bpSystolic: 118,
            bpDiastolic: 74,
          },
          timeline: [
            {
              title: "ANC Visit 1",
              date: "2025-02-20",
              notes: "Baseline vitals captured, IFA started",
              type: "visit",
            },
            {
              title: "Blood tests",
              date: "2025-03-12",
              notes: "Hemoglobin 10.8 g/dL, sugar normal",
              type: "lab",
            },
            {
              title: "Risk assessment",
              date: "2025-04-15",
              notes: "Model flagged moderate anemia risk",
              type: "risk",
            },
          ],
          demoFallback: true,
        },
      },
      { status: 200 },
    );
  }

  try {
    const databases = getServerDatabases();
    const document = await databases.getDocument(
      appwriteServerConfig.databaseId,
      serverCollections.pregnancies,
      id,
    );

    return NextResponse.json({
      pregnancy: {
        ...document,
        demoFallback: false,
      },
    });
  } catch (error) {
    console.error("Failed to fetch pregnancy", error);
    return NextResponse.json(
      {
        pregnancy: null,
        error:
          (error as { message?: string })?.message ??
          "Unable to fetch pregnancy record",
      },
      { status: 404 },
    );
  }
}



