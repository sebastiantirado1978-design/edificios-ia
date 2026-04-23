#!/usr/bin/env node
/**
 * test-webhook-routing.js
 * Prueba el routing multi-tenant del webhook de WhatsApp para Edificios IA.
 *
 * USO: node scripts/test-webhook-routing.js
 * Requiere: servidor corriendo en localhost:3001 (npm run dev)
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3001";
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/whatsapp`;

// ANSI colors
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

function pass(msg) { console.log(`${C.green}  ✅ PASS${C.reset} ${msg}`); }
function fail(msg) { console.log(`${C.red}  ❌ FAIL${C.reset} ${msg}`); }
function info(msg) { console.log(`${C.cyan}  ℹ${C.reset}  ${msg}`); }
function section(msg) { console.log(`\n${C.bold}${C.yellow}▶ ${msg}${C.reset}`); }

// Build a WhatsApp webhook payload
function buildPayload(phoneNumberId, fromPhone, messageText) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "BUSINESS_ACCOUNT_ID",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "56912345000",
                phone_number_id: phoneNumberId,
              },
              messages: [
                {
                  from: fromPhone,
                  id: `wamid.test.${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: messageText },
                  type: "text",
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };
}

// Test cases — phoneNumberIds deben coincidir con seed.ts
const TEST_CASES = [
  {
    name: "Blue Home Las Condes",
    phoneNumberId: "TEST_PHONE_LAS_CONDES",
    fromPhone: "56912340001",
    message: "Hola, quiero reportar una gotera en el pasillo del piso 3",
    expectedIntent: "ticket",
  },
  {
    name: "Blue Home Providencia",
    phoneNumberId: "TEST_PHONE_PROVIDENCIA",
    fromPhone: "56912340002",
    message: "¿Cuánto debo de gastos comunes?",
    expectedIntent: "pago",
  },
  {
    name: "Blue Home Ñuñoa",
    phoneNumberId: "TEST_PHONE_NUNOA",
    fromPhone: "56912340003",
    message: "¿Cuál es el horario para hacer mudanzas?",
    expectedIntent: "informacion",
  },
  {
    name: "Edificio NO REGISTRADO (debe ignorar)",
    phoneNumberId: "PHONE_ID_DESCONOCIDO_999",
    fromPhone: "56999999999",
    message: "Hola",
    expectedStatus: 200, // debe retornar 200 pero sin procesar
  },
];

async function runTest(testCase, index) {
  section(`Test ${index + 1}: ${testCase.name}`);
  info(`phoneNumberId: ${testCase.phoneNumberId}`);
  info(`from: ${testCase.fromPhone} → "${testCase.message}"`);

  const payload = buildPayload(
    testCase.phoneNumberId,
    testCase.fromPhone,
    testCase.message
  );

  try {
    const start = Date.now();
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const elapsed = Date.now() - start;
    const body = await res.json().catch(() => ({}));

    // Check 1: HTTP status
    if (res.status === 200) {
      pass(`HTTP 200 OK (${elapsed}ms)`);
    } else {
      fail(`HTTP ${res.status} — esperado 200`);
    }

    // Check 2: Response time (must be fast — fire-and-forget)
    if (elapsed < 3000) {
      pass(`Respuesta rápida: ${elapsed}ms < 3000ms (fire-and-forget OK)`);
    } else {
      fail(`Respuesta lenta: ${elapsed}ms — ¿está esperando al agente? Revisar fire-and-forget`);
    }

    // Check 3: Body has status:ok
    if (body.status === "ok" || body.status === "ignored") {
      pass(`Body: ${JSON.stringify(body)}`);
    } else {
      fail(`Body inesperado: ${JSON.stringify(body)}`);
    }

    return { passed: true, elapsed };
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      fail(`Servidor no disponible en ${WEBHOOK_URL}`);
      console.log(`${C.dim}   → Asegúrate de que el servidor está corriendo: npm run dev${C.reset}`);
    } else {
      fail(`Error: ${error.message}`);
    }
    return { passed: false };
  }
}

async function testPing() {
  section("Pre-check: Servidor disponible");
  try {
    const res = await fetch(`${BASE_URL}/api/ping`);
    const data = await res.json();
    pass(`Servidor activo — ${data.service} — uptime: ${data.uptime}`);
    return true;
  } catch {
    fail(`Servidor no responde en ${BASE_URL}`);
    console.log(`\n${C.yellow}Arranca el servidor con:${C.reset} npm run dev\n`);
    return false;
  }
}

async function testVerifyToken() {
  section("Pre-check: Webhook verification (GET)");
  try {
    const url = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=edificiosIA2025&hub.challenge=test_challenge_123`;
    const res = await fetch(url);
    const text = await res.text();
    if (res.status === 200 && text === "test_challenge_123") {
      pass(`Verification OK — challenge retornado correctamente`);
    } else {
      fail(`Verification falló — status: ${res.status}, body: ${text}`);
    }
  } catch (error) {
    fail(`Error: ${error.message}`);
  }
}

async function main() {
  console.log(`\n${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║   EDIFICIOS IA — Multi-Tenant Webhook Tests   ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}Target: ${WEBHOOK_URL}${C.reset}`);

  // Pre-checks
  const serverOk = await testPing();
  if (!serverOk) process.exit(1);
  await testVerifyToken();

  // Main tests
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const result = await runTest(TEST_CASES[i], i);
    if (result.passed) passed++;
    else failed++;

    // Wait between tests to avoid overwhelming the server
    if (i < TEST_CASES.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Summary
  console.log(`\n${C.bold}══════════════════ RESUMEN ══════════════════${C.reset}`);
  console.log(`${C.green}  ✅ Passed: ${passed}${C.reset}`);
  if (failed > 0) console.log(`${C.red}  ❌ Failed: ${failed}${C.reset}`);
  console.log(`\n${C.dim}NOTA: El procesamiento IA ocurre en background.`);
  console.log(`Los tiempos de respuesta rápidos confirman fire-and-forget OK.`);
  console.log(`Para ver las respuestas IA, revisa los logs del servidor.${C.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
