import { prisma } from "@/lib/prisma";

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Building ──────────────────────────────────────────────────────────────────

export async function getBuildingByPhoneId(phoneNumberId: string): Promise<ToolResult> {
  try {
    const building = await prisma.building.findFirst({
      where: { whatsappPhoneId: phoneNumberId, active: true },
      include: { settings: true },
    });
    return { success: !!building, data: building };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getAllBuildings(): Promise<ToolResult> {
  try {
    const buildings = await prisma.building.findMany({
      where: { active: true },
      include: { settings: true, _count: { select: { residents: true, tickets: true } } },
      orderBy: { name: "asc" },
    });
    return { success: true, data: buildings };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Residents ─────────────────────────────────────────────────────────────────

export async function findOrCreateResident(data: {
  phone: string;
  buildingId: string;
  fullName?: string;
}): Promise<ToolResult<{ id: string; fullName: string; isNew: boolean; unitId?: string | null; unitNumber?: string | null }>> {
  try {
    let resident = await prisma.resident.findUnique({
      where: { phone: data.phone },
      include: { unit: true },
    });
    let isNew = false;

    if (!resident) {
      resident = await prisma.resident.create({
        data: {
          phone: data.phone,
          fullName: data.fullName ?? "Residente",
          buildingId: data.buildingId,
          status: "active",
        },
        include: { unit: true },
      });
      isNew = true;
    }
    return {
      success: true,
      data: {
        id: resident.id,
        fullName: resident.fullName,
        isNew,
        unitId: resident.unitId,
        unitNumber: resident.unit?.number ?? null,
      },
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export async function createTicket(input: {
  buildingId: string;
  residentId?: string;
  unitId?: string;
  category: string;
  title: string;
  description: string;
  priority?: string;
}): Promise<ToolResult<{ id: string; ticketNumber: string }>> {
  try {
    const count = await prisma.ticket.count({ where: { buildingId: input.buildingId } });
    const year = new Date().getFullYear();
    const ticketNumber = `TKT-${year}-${String(count + 1).padStart(3, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        buildingId: input.buildingId,
        residentId: input.residentId,
        unitId: input.unitId,
        ticketNumber,
        category: input.category,
        title: input.title,
        description: input.description,
        priority: input.priority ?? "media",
        status: "abierto",
      },
    });
    return { success: true, data: { id: ticket.id, ticketNumber } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getTicketsByResident(residentId: string): Promise<ToolResult> {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { residentId, status: { notIn: ["cerrado", "resuelto"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return { success: true, data: tickets };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getTicketsByBuilding(buildingId: string, status?: string): Promise<ToolResult> {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { buildingId, ...(status ? { status } : {}) },
      include: { resident: { select: { fullName: true, phone: true } }, unit: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { success: true, data: tickets };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function getPaymentsByResident(residentId: string): Promise<ToolResult> {
  try {
    const payments = await prisma.payment.findMany({
      where: { residentId, status: { in: ["pendiente", "atrasado"] } },
      orderBy: { dueDate: "asc" },
      take: 6,
    });
    return { success: true, data: payments };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getDocuments(buildingId: string, category?: string): Promise<ToolResult> {
  try {
    const docs = await prisma.document.findMany({
      where: { buildingId, isPublic: true, ...(category ? { category } : {}) },
      select: { id: true, title: true, category: true, content: true },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: docs };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Announcements ─────────────────────────────────────────────────────────────

export async function getRecentAnnouncements(buildingId: string): Promise<ToolResult> {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return { success: true, data: announcements };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Surveys ───────────────────────────────────────────────────────────────────

export async function getActiveSurveys(buildingId: string): Promise<ToolResult> {
  try {
    const surveys = await prisma.survey.findMany({
      where: {
        buildingId,
        status: "active",
        OR: [{ closesAt: null }, { closesAt: { gte: new Date() } }],
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    return { success: true, data: surveys };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function saveSurveyResponse(input: {
  surveyId: string;
  questionId: string;
  residentId: string;
  answer: string;
}): Promise<ToolResult> {
  try {
    const response = await prisma.surveyResponse.create({ data: input });
    return { success: true, data: response };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Assembly ──────────────────────────────────────────────────────────────────

export async function getNextAssembly(buildingId: string): Promise<ToolResult> {
  try {
    const assembly = await prisma.assembly.findFirst({
      where: { buildingId, status: "programada", scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
    });
    return { success: true, data: assembly };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Conversations ─────────────────────────────────────────────────────────────

export async function findOrCreateConversation(
  residentId: string,
  buildingId: string
): Promise<ToolResult<{ id: string }>> {
  try {
    const recent = await prisma.conversation.findFirst({
      where: {
        residentId,
        buildingId,
        status: "open",
        aiEnabled: true,
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: "desc" },
    });
    if (recent) return { success: true, data: { id: recent.id } };
    const conv = await prisma.conversation.create({
      data: { residentId, buildingId, status: "open", aiEnabled: true },
    });
    return { success: true, data: { id: conv.id } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function saveMessage(
  conversationId: string,
  sender: string,
  content: string
): Promise<void> {
  await prisma.message.create({ data: { conversationId, sender, content } });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: content.slice(0, 200), updatedAt: new Date() },
  });
}

export async function getConversationHistory(
  residentId: string,
  buildingId: string,
  limit = 12
): Promise<{ messages: Array<{ role: "user" | "assistant"; content: string }>; intent?: string }> {
  try {
    const conv = await prisma.conversation.findFirst({
      where: { residentId, buildingId, status: "open" },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" }, take: limit } },
    });
    if (!conv) return { messages: [] };
    return {
      messages: conv.messages.map((m) => ({
        role: (m.sender === "resident" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      })),
      intent: conv.intent ?? undefined,
    };
  } catch {
    return { messages: [] };
  }
}

export async function updateConversationIntent(
  conversationId: string,
  intent: string,
  handoff = false
): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { intent, assignedToHuman: handoff, aiEnabled: !handoff },
  });
}

// ── Dashboard Metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics(buildingId?: string) {
  const where = buildingId ? { buildingId } : {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalBuildings,
    totalResidents,
    openTickets,
    urgentTickets,
    resolvedToday,
    pendingPayments,
    overduePayments,
    openConversations,
    activeSurveys,
    recentTickets,
  ] = await Promise.all([
    prisma.building.count({ where: { active: true } }),
    prisma.resident.count({ where: { ...where, status: "active" } }),
    prisma.ticket.count({ where: { ...where, status: "abierto" } }),
    prisma.ticket.count({ where: { ...where, status: "abierto", priority: "urgente" } }),
    prisma.ticket.count({ where: { ...where, status: "resuelto", updatedAt: { gte: today } } }),
    prisma.payment.count({ where: { ...where, status: "pendiente" } }),
    prisma.payment.count({ where: { ...where, status: "atrasado" } }),
    prisma.conversation.count({ where: { ...where, status: "open" } }),
    prisma.survey.count({ where: { ...where, status: "active" } }),
    prisma.ticket.findMany({
      where: { ...where },
      include: { resident: { select: { fullName: true } }, unit: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalBuildings,
    totalResidents,
    openTickets,
    urgentTickets,
    resolvedToday,
    pendingPayments,
    overduePayments,
    openConversations,
    activeSurveys,
    recentTickets,
  };
}
