import { NextRequest, NextResponse } from "next/server";
import {
  getServerDatabases,
  serverCollections,
} from "@/lib/appwrite/server";
import { appwriteServerConfig } from "@/lib/appwrite/config";
import { pregnancySchema } from "@/lib/validation/pregnancy";
import { evaluateRisk, buildActionPlan } from "@/lib/ai/riskModel";

type RouteParams = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.projectId ||
    !appwriteServerConfig.apiKey ||
    !appwriteServerConfig.databaseId
  ) {
    const demoPregnancy = pregnancySchema.parse({
      personal: {
        name: "Demo Beneficiary",
        age: 28,
        village: "Demo Village",
        phone: "+919800000000",
        education: "Higher secondary",
      },
      family: {
        incomeRange: "10000-20000",
        dietType: "veg",
        householdSize: 4,
        cleanWater: true,
        sanitation: true,
        phcDistanceKm: 3,
        partnerOccupation: "Shopkeeper",
      },
      obstetric: {
        gravida: 3,
        para: 1,
        abortions: 1,
        previousComplications: "Gestational diabetes",
        previousCSection: true,
        birthSpacingMonths: 24,
      },
      current: {
        lmp: "2025-01-15",
        edd: "2025-10-22",
        trimester: "Trimester 2",
        ancVisits: 2,
        ttDoses: 1,
        ironFolicIntake: "irregular",
      },
      health: {
        heightCm: 162,
        weightKg: 70,
        bmi: 26.7,
        bpSystolic: 130,
        bpDiastolic: 86,
        hemoglobin: 10.4,
        bloodSugar: 118,
        thyroidTsh: 2.8,
        edema: true,
      },
    });

    const risk = evaluateRisk(demoPregnancy);
    const plan = buildActionPlan(risk, demoPregnancy);

    return NextResponse.json({
      predictionId: id,
      pregnancy: demoPregnancy,
      risk: {
        score: risk.ensembleScore,
        riskCategory: risk.category,
        confidence: risk.confidence,
        contributions: risk.contributions,
      },
      actionPlan: plan,
      demoFallback: true,
    });
  }

  try {
    const databases = getServerDatabases();
    const document = await databases.getDocument(
      appwriteServerConfig.databaseId,
      serverCollections.riskPredictions,
      id,
    );
    return NextResponse.json({
      predictionId: id,
      pregnancy: document.input,
      risk: {
        score: document.score,
        riskCategory: document.category,
        confidence: document.confidence,
        contributions: document.explanations,
      },
      actionPlan: document.actionPlan,
      demoFallback: false,
    });
  } catch (error) {
    console.error("Failed to fetch prediction", error);
    return NextResponse.json(
      { error: "Prediction not found." },
      { status: 404 },
    );
  }
}



