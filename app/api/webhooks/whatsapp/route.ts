import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getBuildingByPhoneId,
  findOrCreateResident,
  findOrCreateConversation,
  saveMessage,
  updateConversationIntent,
  getConversationHistory,
  createTicket,
  getTicketsByResident,
  getPaymentsByResident,
  getActiveSurveys,
  getNextAssembly,
  getRecentAnnouncements,
  getDocuments,
} from "@/agents/tools";
import {
  buildMainAgentPrompt,
  buildTicketAgentPrompt,
  buildPaymentAgentPrompt,
  buildInfoAgentPrompt,
  buildAnnouncementAgentPrompt,
} from "@/agents/buildingAgent";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "edificiosIA2025";

// Suppress unused warning for imports used conditionally
void getActiveSurveys;
void getNextAssembly;

// ── GET — webhook verification ────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ── POST — receive WhatsApp messages ─────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" });
    }
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value?.messages?.length) continue;
        for (const msg of value.messages) {
          if (msg.type !== "text") continue;
          const msgTimestamp = parseInt(msg.timestamp ?? "0") * 1000;
          if (Date.now() - msgTimestamp > 60000) continue;
          const phone = `+${msg.from}`;
          const text = msg.text?.body ?? "";
          const phoneNumberId = value.metadata?.phone_number_id;
          await processMessage(phone, text, phoneNumberId).catch((e) =>
            console.error("[Webhook] processMessage error:", e)
          );
        }
      }
    }
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// ── Process message ───────────────────────────────────────────────────────────
async function processMessage(phone: string, text: string, phoneNumberId: string) {
  // 1. Find building
  const buildingResult = await getBuildingByPhoneId(phoneNumberId);
  if (!buildingResult.success || !buildingResult.data) {
    console.error(`[Webhook] No building for phoneNumberId: ${phoneNumberId}`);
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const building = buildingResult.data as any;

  // 2. Find or create resident
  const residentResult = await findOrCreateResident({ phone, buildingId: building.id });
  if (!residentResult.success || !residentResult.data) return;
  const resident = residentResult.data;

  // 3. Get conversation history + current intent
  const { messages: history, intent: currentIntent } = await getConversationHistory(
    resident.id,
    building.id
  );

  // 4. Find or create conversation
  const convResult = await findOrCreateConversation(resident.id, building.id);
  if (!convResult.success || !convResult.data) return;
  const conversationId = convResult.data.id;

  // 5. Save incoming message
  await saveMessage(conversationId, "resident", text);

  // 6. New resident → welcome message
  if (resident.isNew && history.length === 0) {
    const welcomeMsg =
      building.settings?.welcomeMessage ??
      `Hola, bienvenido/a al asistente virtual de ${building.name}. Para comenzar, dime tu nombre y numero de departamento.`;
    await saveMessage(conversationId, "agent", welcomeMsg);
    await sendWhatsAppMessage(phoneNumberId, phone, welcomeMsg, building.whatsappToken);
    return;
  }

  // 7. Route to appropriate agent
  const agentResponse = await routeToAgent(
    text,
    history,
    currentIntent,
    building,
    resident.id
  );

  // 8. Save and send response
  await saveMessage(conversationId, "agent", agentResponse.text);
  await updateConversationIntent(conversationId, agentResponse.intent, agentResponse.handoff);
  await sendWhatsAppMessage(phoneNumberId, phone, agentResponse.text, building.whatsappToken);
}

// ── Agent router ──────────────────────────────────────────────────────────────
async function routeToAgent(
  text: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  currentIntent: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  building: any,
  residentId: string
): Promise<{ text: string; intent: string; handoff: boolean }> {
  const messages = [...history.slice(-10), { role: "user" as const, content: text }];

  try {
    let systemPrompt: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentTools: Anthropic.Tool[] = [];

    // Select agent based on current intent
    if (currentIntent === "ticket") {
      systemPrompt = buildTicketAgentPrompt(building.name);
      agentTools.push(...getTicketTools());
    } else if (currentIntent === "pago") {
      systemPrompt = buildPaymentAgentPrompt(building.name, building.settings?.paymentInfo);
      agentTools.push(...getPaymentTools());
    } else if (currentIntent === "informacion") {
      const docsResult = await getDocuments(building.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = (docsResult.data as any[] ?? []).map((d: any) => `[${d.title}]\n${d.content}`).join("\n---\n");
      systemPrompt = buildInfoAgentPrompt(building.name, docs);
    } else if (currentIntent === "comunicado") {
      systemPrompt = buildAnnouncementAgentPrompt(building.name);
      agentTools.push(...getAnnouncementTools());
    } else {
      // Main routing agent
      systemPrompt = buildMainAgentPrompt(building.name, {
        address: building.address,
        commune: building.commune,
        ...building.settings,
      });
    }

    let response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: systemPrompt,
      tools: agentTools.length > 0 ? agentTools : undefined,
      messages,
    });

    let finalText = "";
    let detectedIntent = currentIntent ?? "consulta";
    let handoff = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentMessages: any[] = [...messages];

    // Agentic loop
    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await executeAgentTool(
          toolUse.name,
          toolUse.input as Record<string, string>,
          { buildingId: building.id, residentId }
        );
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
      }

      agentMessages.push({ role: "assistant", content: response.content });
      agentMessages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        system: systemPrompt,
        tools: agentTools.length > 0 ? agentTools : undefined,
        messages: agentMessages,
      });
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const rawText = textBlock?.text ?? "En que te puedo ayudar?";

    // Main agent returns JSON
    if (!currentIntent) {
      const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          finalText = clean(parsed.response ?? rawText);
          detectedIntent = parsed.intent ?? detectedIntent;
          handoff = parsed.handoff ?? false;
        } catch {
          finalText = clean(rawText);
        }
      } else {
        finalText = clean(rawText);
      }
    } else {
      finalText = clean(rawText);
    }

    return { text: finalText, intent: detectedIntent, handoff };
  } catch (error) {
    console.error("[Agent] Error:", error);
    return {
      text: "Lo siento, tuve un problema tecnico. Por favor intenta nuevamente en un momento.",
      intent: "error",
      handoff: false,
    };
  }
}

// ── Tool definitions ──────────────────────────────────────────────────────────
function getTicketTools(): Anthropic.Tool[] {
  return [
    {
      name: "create_ticket",
      description: "Crea un ticket de reclamo o solicitud.",
      input_schema: {
        type: "object" as const,
        properties: {
          category: { type: "string", enum: ["mantencion", "reclamo", "solicitud", "emergencia", "consulta"] },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["baja", "media", "alta", "urgente"] },
        },
        required: ["category", "title", "description"],
      },
    },
    {
      name: "get_my_tickets",
      description: "Obtiene los tickets abiertos del residente.",
      input_schema: { type: "object" as const, properties: {}, required: [] },
    },
  ];
}

function getPaymentTools(): Anthropic.Tool[] {
  return [
    {
      name: "get_my_payments",
      description: "Obtiene los pagos pendientes del residente.",
      input_schema: { type: "object" as const, properties: {}, required: [] },
    },
  ];
}

function getAnnouncementTools(): Anthropic.Tool[] {
  return [
    {
      name: "get_announcements",
      description: "Obtiene los comunicados recientes del edificio.",
      input_schema: { type: "object" as const, properties: {}, required: [] },
    },
  ];
}

// ── Tool executor ─────────────────────────────────────────────────────────────
async function executeAgentTool(
  toolName: string,
  input: Record<string, string>,
  context: { buildingId: string; residentId: string }
): Promise<string> {
  switch (toolName) {
    case "create_ticket": {
      const result = await createTicket({
        buildingId: context.buildingId,
        residentId: context.residentId,
        category: input.category,
        title: input.title,
        description: input.description,
        priority: input.priority ?? "media",
      });
      if (!result.success) return "Error al crear el ticket. Intenta nuevamente.";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return `TICKET_CREADO:${(result.data as any).ticketNumber}`;
    }
    case "get_my_tickets": {
      const result = await getTicketsByResident(context.residentId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tickets = (result.data as any[]) ?? [];
      if (tickets.length === 0) return "No tienes tickets abiertos actualmente.";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return tickets.map((t: any) => `${t.ticketNumber}: ${t.title} (${t.status})`).join("\n");
    }
    case "get_my_payments": {
      const result = await getPaymentsByResident(context.residentId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payments = (result.data as any[]) ?? [];
      if (payments.length === 0) return "No tienes pagos pendientes. Estas al dia.";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return payments.map((p: any) => `${p.period}: $${Number(p.amount).toLocaleString("es-CL")} - ${p.status} (vence ${new Date(p.dueDate).toLocaleDateString("es-CL")})`).join("\n");
    }
    case "get_announcements": {
      const result = await getRecentAnnouncements(context.buildingId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const announcements = (result.data as any[]) ?? [];
      if (announcements.length === 0) return "No hay comunicados recientes.";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return announcements.map((a: any) => `[${new Date(a.createdAt).toLocaleDateString("es-CL")}] ${a.title}: ${a.content.slice(0, 100)}...`).join("\n\n");
    }
    default:
      return "Herramienta no reconocida.";
  }
}

// ── Clean text for WhatsApp ───────────────────────────────────────────────────
function clean(text: string): string {
  return text
    .replace(/\*\*/g, "").replace(/\*/g, "")
    .replace(/__/g, "").replace(/_/g, "")
    .replace(/\s{3,}/g, "\n\n").trim();
}

// ── Send WhatsApp message ─────────────────────────────────────────────────────
async function sendWhatsAppMessage(
  phoneNumberId: string,
  to: string,
  message: string,
  buildingToken?: string | null
) {
  const token = buildingToken ?? process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) { console.log("[WA] No token — msg:", message); return; }
  const toClean = to.startsWith("+") ? to.slice(1) : to;
  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to: toClean, type: "text", text: { body: message } }),
  });
  if (!res.ok) console.error("[WA] Error:", await res.text());
}
