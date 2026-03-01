import { initDB, dbService } from "./lib/db";
import { hashPassword } from "./lib/auth";
import { randomUUID } from "crypto";
import type { UserRecord } from "./types/internal";
import type { Absence, Task } from "@dashboard/shared-types";

async function seed() {
  console.log("🌱 Iniciando seed técnico de la base de datos...");
  initDB();

  // Datos demo
  const DEMO_USER_ID = "2d2f9c04-414e-4ae4-b084-8da7b9bd8a76";
  const demoEmail = "demo@example.com";
  const demoPassword = "demo123";

  const JOSE_USER_ID = "06130585-9acb-4467-bf46-85ca922cc10f";
  const joseEmail = "jose@example.com";
  const josePassword = "jose123";

  // 1. Usuario demo
  let user = await dbService.users.getByEmail(demoEmail); // ← getByEmail, no getById
  if (!user) {
    const demoUser: UserRecord = {
      id: DEMO_USER_ID,
      name: "Claudio Demo",
      email: demoEmail,
      passwordHash: await hashPassword(demoPassword),
      role: "admin",
    };
    await dbService.users.create(demoUser);
    user = await dbService.users.getByEmail(demoEmail);
    if (!user) throw new Error("No se pudo crear el usuario demo");
    console.log("✅ Usuario demo creado.");
  } else {
    console.log("ℹ️ El usuario demo ya existe.");
  }

  // Usuario dev — José
  let joseUser = await dbService.users.getByEmail(joseEmail);
  if (!joseUser) {
    const newJoseUser: UserRecord = {
      id: JOSE_USER_ID,
      name: "José",
      email: joseEmail,
      passwordHash: await hashPassword(josePassword),
      role: "admin",
    };
    await dbService.users.create(newJoseUser);
    console.log(`✅ Usuario dev creado: ${joseEmail} / ${josePassword}`);
  } else {
    console.log("ℹ️ El usuario José ya existe.");
  }

  // 2. Materias
  const subjects = [
    { id: randomUUID(), name: "Sistemas Operativos", total_classes: 24, user_id: user.id },
    { id: randomUUID(), name: "Arquitectura de Software", total_classes: 32, user_id: user.id },
  ];
  for (const s of subjects) {
    await dbService.subjects.create(s);
    console.log(`✅ Materia creada: ${s.name}`);
  }

  // 3. Inasistencias (riesgo en Sistemas Operativos)
  console.log("⚠️ Generando datos de riesgo de asistencia...");
  for (let i = 0; i < 6; i++) {
    const absence: Absence = {
      id: randomUUID(),
      subject_id: subjects[0].id,
      date: new Date(`2026-02-${10 + i}`),
      type: "standard",
      calculated_value: 1.0,
    };
    await dbService.absences.create(absence);
  }

  // 4. Tareas — due_date como Date, no como string
  const tasks: Task[] = [
    {
      id: randomUUID(),
      subject_id: subjects[1].id,
      title: "Diagrama de Microservicios",
      description: "Diseñar la comunicación mediante eventos",
      status: "todo",
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // ✅ Date, no string
    },
    {
      id: randomUUID(),
      subject_id: subjects[0].id,
      title: "Laboratorio: Kernel Modules",
      description: "Compilar un módulo simple de Linux",
      status: "in-progress",
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // ✅ Date, no string
    },
  ];
  for (const t of tasks) {
    await dbService.tasks.create(t); // ✅ sin "as any"
    console.log(`✅ Tarea creada: ${t.title}`);
  }

  console.log("✨ Seed completado.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error durante el seed:", err);
  process.exit(1);
});
