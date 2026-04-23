import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const buildings = await prisma.building.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { residents: true, tickets: true },
        },
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
    const body = await request.json();
    const { name, address, commune, city, totalUnits, adminPhone, adminEmail, whatsappPhoneId } = body;

    if (!name || !address || !commune) {
      return NextResponse.json({ error: "name, address, commune requeridos" }, { status: 400 });
    }

    const building = await prisma.building.create({
      data: {
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
