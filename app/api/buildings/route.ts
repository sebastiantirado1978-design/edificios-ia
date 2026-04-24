/**
 * GET/POST /api/buildings
 * Siempre filtrado por organizationId — aislamiento multi-tenant.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function resolveOrganizationId(request: Request): Promise<string | null> {
  const fromHeader = request.headers.get("X-Organization-Id");
  if (fromHeader) return fromHeader;
  const fromQuery = new URL(request.url).searchParams.get("organizationId");
  if (fromQuery) return fromQuery;
  // Fallback: primera organización (dev/single-tenant)
  const org = await prisma.organization.findFirst({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return org?.id ?? null;
}

export async function GET(request: Request) {
  try {
    const organizationId = await resolveOrganizationId(request);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const buildings = await prisma.building.findMany({
      where: { organizationId, active: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { residents: true, tickets: true } },
        settings: { select: { emergencyPhone: true, officeHours: true } },
      },
    });

    return NextResponse.json({ buildings });
  } catch (error) {
    console.error("[buildings GET]", error);
    return NextResponse.json({ error: "Error fetching buildings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organizationId = await resolveOrganizationId(request);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, address, commune, city, totalUnits, adminPhone, adminEmail, whatsappPhoneId } = body;

    if (!name || !address || !commune) {
      return NextResponse.json({ error: "name, address, commune requeridos" }, { status: 400 });
    }

    // Verificar límite de edificios por plan
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxBuildings: true, plan: true },
    });
    const currentCount = await prisma.building.count({
      where: { organizationId, active: true },
    });

    if (org && currentCount >= org.maxBuildings) {
      return NextResponse.json(
        { error: `Plan ${org.plan} permite máximo ${org.maxBuildings} edificios. Actualiza tu plan.` },
        { status: 403 }
      );
    }

    const building = await prisma.building.create({
      data: {
        organizationId,
        name,
        address,
        commune,
        city: city ?? "Santiago",
        totalUnits: Number(totalUnits) || 0,
        adminPhone: adminPhone || null,
        adminEmail: adminEmail || null,
        whatsappPhoneId: whatsappPhoneId || null,
      },
    });

    return NextResponse.json({ building }, { status: 201 });
  } catch (error) {
    console.error("[buildings POST]", error);
    return NextResponse.json({ error: "Error creating building" }, { status: 500 });
  }
}
