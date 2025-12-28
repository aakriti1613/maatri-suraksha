import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { z } from "zod";
import { getServerDatabases, getServerUsers, serverCollections } from "@/lib/appwrite/server";
import { appwriteServerConfig } from "@/lib/appwrite/config";

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z
    .string()
    .min(10)
    .max(15)
    .regex(/^\+?[0-9]{10,14}$/),
  role: z.enum(["asha", "nurse", "doctor", "admin"]),
  password: z.string().min(8),
  facility: z.string().optional(),
  district: z.string().optional(),
  experienceYears: z.string().optional(),
  locale: z.string().optional(),
});

const normalizePhone = (value?: string | null) => {
  if (!value) return null;
  const digitsOnly = value.replace(/[^0-9]/g, "");
  if (digitsOnly.length === 0) return null;

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    throw new Error(
      "Phone number must contain between 10 and 15 digits once spaces and symbols are removed.",
    );
  }

  return `+${digitsOnly}`;
};

export async function POST(request: NextRequest) {
  if (
    !appwriteServerConfig.endpoint ||
    !appwriteServerConfig.apiKey ||
    !appwriteServerConfig.projectId ||
    !appwriteServerConfig.databaseId
  ) {
    return NextResponse.json(
      { error: "Appwrite server configuration is missing." },
      { status: 500 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const {
    fullName,
    email,
    phone,
    password,
    role,
    facility,
    district,
    experienceYears,
    locale,
  } = parsed.data;

  try {
    const users = getServerUsers();
    const databases = getServerDatabases();

    let normalizedPhone: string | null = null;
    try {
      normalizedPhone = normalizePhone(phone);
    } catch (error) {
      return NextResponse.json(
        { error: (error as { message?: string })?.message ?? "Invalid phone number" },
        { status: 422 },
      );
    }

    const userId = ID.unique();
    const user = await users.create(userId, email, normalizedPhone ?? undefined, password, fullName);

    await users.updatePrefs(user.$id, {
      role,
      facility,
      district,
      experienceYears,
      locale,
      languages: locale ? [locale] : ["en"],
    });

    await users.updateLabels(user.$id, [role.toUpperCase()]);

    await databases.createDocument(
      appwriteServerConfig.databaseId,
      serverCollections.users,
      ID.unique(),
      {
        userId: user.$id,
        fullName,
        email,
        phone,
        role,
        facility,
        district,
        experienceYears,
        locale,
        assignedVillages: [],
        createdAt: new Date().toISOString(),
        consentAccepted: true,
      },
    );

    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: user.$id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration failed", error);
    const message =
      (error as { message?: string; response?: { message?: string } })?.response?.message ??
      (error as { message?: string })?.message ??
      "Registration failed";
    const status =
      (error as { response?: { status?: number } })?.response?.status && Number(
        (error as { response?: { status?: number } })?.response?.status,
      );
    return NextResponse.json({ error: message }, { status: status && status >= 400 ? status : 500 });
  }
}


