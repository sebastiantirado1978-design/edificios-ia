import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Edificios IA...");

  // ── Edificios Blue Home (demo) ───────────────────────────────────────────────
  const buildings = [
    {
      name: "Blue Home Las Condes",
      address: "Av. Apoquindo 4848",
      commune: "Las Condes",
      totalUnits: 120,
      adminEmail: "admin@bluehome.cl",
      adminPhone: "+56912345001",
      whatsappPhoneId: "TEST_PHONE_LAS_CONDES",
    },
    {
      name: "Blue Home Providencia",
      address: "Av. Providencia 1234",
      commune: "Providencia",
      totalUnits: 80,
      adminEmail: "admin@bluehome.cl",
      adminPhone: "+56912345002",
      whatsappPhoneId: "TEST_PHONE_PROVIDENCIA",
    },
    {
      name: "Blue Home Ñuñoa",
      address: "Av. Irarrázaval 3456",
      commune: "Ñuñoa",
      totalUnits: 64,
      adminEmail: "admin@bluehome.cl",
      adminPhone: "+56912345003",
      whatsappPhoneId: "TEST_PHONE_NUNOA",
    },
  ];

  for (const b of buildings) {
    const building = await prisma.building.upsert({
      where: { id: `seed-${b.commune.toLowerCase().replace(/[^a-z]/g, "")}` },
      update: {},
      create: {
        id: `seed-${b.commune.toLowerCase().replace(/[^a-z]/g, "")}`,
        ...b,
        city: "Santiago",
        active: true,
      },
    });

    // Settings por edificio
    await prisma.buildingSettings.upsert({
      where: { buildingId: building.id },
      update: {},
      create: {
        buildingId: building.id,
        welcomeMessage: `Bienvenido/a a ${b.name} 🏢\nSoy el asistente virtual de tu edificio. ¿En qué te puedo ayudar?`,
        officeHours: "Lunes a Viernes 9:00 - 18:00",
        emergencyPhone: "+56912345000",
        gastosComunesDueDay: 5,
        reglamento: `REGLAMENTO INTERNO - ${b.name}\n\n` +
          "1. HORARIO DE SILENCIO: 22:00 a 08:00 hrs. No se permiten ruidos que molesten a los vecinos.\n" +
          "2. MASCOTAS: Permitidas con registro previo. Deben transitar con correa en áreas comunes.\n" +
          "3. ESTACIONAMIENTOS: Cada propietario cuenta con su número asignado. Prohibido ocupar ajenos.\n" +
          "4. MUDANZAS: Solo días hábiles de 9:00 a 18:00 hrs, con aviso previo de 48 horas.\n" +
          "5. VISITAS: El personal de conserje registrará visitas a partir de las 22:00 hrs.\n" +
          "6. GASTOS COMUNES: Pago antes del día 5 de cada mes. Mora: 3% mensual.\n" +
          "7. ÁREAS COMUNES: Reserva con 48 hrs de anticipación en conserjería.\n" +
          "8. BASURA: Depositar en sala de basura en los horarios establecidos.\n" +
          "9. BICICLETAS: Solo en bicicletero habilitado. Prohibido en pasillos y escaleras.\n" +
          "10. REPARACIONES: Deben realizarse en horario hábil y con materiales adecuados.\n",
        cancellationPolicy: "Los reclamos formales deben presentarse por escrito a la administración.",
      },
    });

    // Unidades de ejemplo
    for (let floor = 1; floor <= 3; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitNum = `${floor}0${unit}`;
        await prisma.unit.upsert({
          where: { id: `seed-${building.id}-${unitNum}` },
          update: {},
          create: {
            id: `seed-${building.id}-${unitNum}`,
            buildingId: building.id,
            number: unitNum,
            floor,
            type: "departamento",
            area: 65 + unit * 5,
            aliquot: (65 + unit * 5) / 1000,
          },
        });
      }
    }

    console.log(`✅ ${b.name} creado (${b.totalUnits} unidades)`);
  }

  // ── Documentos globales ────────────────────────────────────────────────────
  const mainBuilding = await prisma.building.findFirst({
    where: { id: "seed-lascondes" },
  });

  if (mainBuilding) {
    await prisma.document.upsert({
      where: { id: "seed-doc-ley-copropiedad" },
      update: {},
      create: {
        id: "seed-doc-ley-copropiedad",
        buildingId: mainBuilding.id,
        title: "Ley 19.537 - Copropiedad Inmobiliaria",
        category: "legal",
        content:
          "La Ley 19.537 regula el régimen de copropiedad inmobiliaria en Chile. " +
          "Establece los derechos y obligaciones de los copropietarios. " +
          "Las asambleas ordinarias se realizan una vez al año. " +
          "El quorum para acuerdos ordinarios es la mayoría de los copropietarios presentes. " +
          "Para acuerdos extraordinarios se requiere mayoría absoluta de los copropietarios con derecho a voto. " +
          "El administrador es elegido por la asamblea y puede ser removido con mayoría de votos.",
        isPublic: true,
      },
    });
  }

  console.log("🎉 Seed completado exitosamente");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
