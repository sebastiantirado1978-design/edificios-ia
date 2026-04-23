import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");

    const surveys = await prisma.survey.findMany({
      where: buildingId ? { buildingId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        building: { select: { name: true } },
        _count: { select: { questions: true, responses: true } },
      },
    });

    return NextResponse.json({ surveys });
  } catch (error) {
    console.error("[surveys GET]", error);
    return NextResponse.json({ error: "Error fetching surveys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buildingId, title, description, startsAt, endsAt, questions } = body;

    if (!buildingId || !title) {
      return NextResponse.json({ error: "buildingId y title requeridos" }, { status: 400 });
    }

    const survey = await prisma.survey.create({
      data: {
        buildingId,
        title,
        description: description || null,
        status: "draft",
        closesAt: endsAt ? new Date(endsAt) : null,
        questions: questions
          ? {
              create: questions.map((q: { text: string; type?: string; options?: string }, i: number) => ({
                question: q.text,
                type: q.type ?? "open",
                options: q.options ?? "[]",
                order: i + 1,
              })),
            }
          : undefined,
      },
      include: { questions: true },
    });

    return NextResponse.json({ survey }, { status: 201 });
  } catch (error) {
    console.error("[surveys POST]", error);
    return NextResponse.json({ error: "Error creating survey" }, { status: 500 });
  }
}
