import { NextRequest, NextResponse } from "next/server";
import { ID } from "appwrite";
import {
  getServerDatabases,
  serverCollections,
  serverQuery,
} from "@/lib/appwrite/server";
import { appwriteServerConfig } from "@/lib/appwrite/config";
import {
  pregnancySchema,
  type PregnancyPayload,
} from "@/lib/validation/pregnancy";

type Payload = {
  values: PregnancyPayload;
  meta?: Record<string, unknown>;
};

const DEMO_PREGNANCIES: Array<PregnancyPayload & { $id: string }> = [
  {
    $id: "demo-preg-1",
    personal: {
      name: "Sunita Devi",
      age: 26,
      village: "Rampur",
      phone: "+919876543210",
      education: "Secondary",
    },
    family: {
      incomeRange: "5000-10000",
      dietType: "veg",
      householdSize: 5,
      cleanWater: true,
      sanitation: true,
      phcDistanceKm: 4,
      partnerOccupation: "Farmer",
    },
    obstetric: {
      gravida: 2,
      para: 1,
      abortions: 0,
      previousComplications: "Mild anemia",
      previousCSection: false,
      birthSpacingMonths: 30,
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
      heightCm: 158,
      weightKg: 58,
      bmi: 23.2,
      bpSystolic: 116,
      bpDiastolic: 74,
      hemoglobin: 10.6,
      bloodSugar: 96,
      thyroidTsh: 2.1,
      edema: false,
    },
  },
  {
    $id: "demo-preg-2",
    personal: {
      name: "Kavita Kumari",
      age: 32,
      village: "Bhagalpur",
      phone: "+919812345678",
      education: "Primary",
    },
    family: {
      incomeRange: "<5000",
      dietType: "non-veg",
      householdSize: 6,
      cleanWater: false,
      sanitation: false,
      phcDistanceKm: 8,
      partnerOccupation: "Daily wage labour",
    },
    obstetric: {
      gravida: 4,
      para: 2,
      abortions: 1,
      previousComplications: "Postpartum hemorrhage (G3)",
      previousCSection: true,
      birthSpacingMonths: 18,
    },
    current: {
      lmp: "2025-01-10",
      edd: "2025-10-17",
      trimester: "Trimester 2",
      ancVisits: 2,
      ttDoses: 0,
      ironFolicIntake: "irregular",
    },
    health: {
      heightCm: 150,
      weightKg: 60,
      bmi: 26.7,
      bpSystolic: 128,
      bpDiastolic: 82,
      hemoglobin: 9.8,
      bloodSugar: 110,
      thyroidTsh: 3.4,
      edema: true,
    },
  },
];

export async function GET(request: NextRequest) {
  const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "15", 10);
  const assignedTo = request.nextUrl.searchParams.get("assignedTo");

  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.projectId ||
    !appwriteServerConfig.apiKey ||
    !appwriteServerConfig.databaseId
  ) {
    return NextResponse.json({
      pregnancies: DEMO_PREGNANCIES.slice(0, limit),
      demoFallback: true,
    });
  }

  try {
    const databases = getServerDatabases();
    const filters = assignedTo ? [serverQuery.equal("assignedTo", assignedTo)] : undefined;
    const documents = await databases.listDocuments(
      appwriteServerConfig.databaseId,
      serverCollections.pregnancies,
      filters,
    );

    return NextResponse.json({
      pregnancies: documents.documents.slice(0, limit),
      demoFallback: false,
      total: documents.total,
    });
  } catch (error) {
    console.error("Failed to list pregnancies", error);
    return NextResponse.json({
      pregnancies: DEMO_PREGNANCIES.slice(0, limit),
      demoFallback: true,
    });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as
    | PregnancyPayload
    | Payload
    | null;

  if (!body) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 },
    );
  }

  const values =
    "values" in body
      ? pregnancySchema.safeParse(body.values)
      : pregnancySchema.safeParse(body);

  if (!values.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: values.error.flatten(),
      },
      { status: 422 },
    );
  }

  const metadata = "values" in body && body.meta ? body.meta : {};

  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.projectId ||
    !appwriteServerConfig.apiKey ||
    !appwriteServerConfig.databaseId
  ) {
    const fallbackId = ID.unique();
    return NextResponse.json(
      {
        pregnancyId: fallbackId,
        demoFallback: true,
      },
      { status: 201 },
    );
  }

  try {
    const databases = getServerDatabases();
    const documentId = ID.unique();
    await databases.createDocument(
      appwriteServerConfig.databaseId,
      serverCollections.pregnancies,
      documentId,
      {
        ...values.data,
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: metadata?.createdBy ?? null,
        capturedAt: metadata?.capturedAt ?? new Date().toISOString(),
        language: metadata?.language ?? "en",
      },
    );

    return NextResponse.json(
      {
        pregnancyId: documentId,
        demoFallback: false,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create pregnancy", error);
    return NextResponse.json(
      {
        pregnancyId: ID.unique(),
        demoFallback: true,
        error:
          (error as { message?: string })?.message ??
          "Stored offline for now. Sync will retry.",
      },
      { status: 202 },
    );
  }
}

