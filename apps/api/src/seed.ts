import { initDB, dbService, db } from "./lib/db";
import { auth } from "./lib/auth.better";
import { randomUUID } from "crypto";
import type { Absence, Task } from "@dashboard/shared-types";

async function seed() {
  console.log("🌱 Iniciando seed técnico de la base de datos...");
  await initDB();

  console.log("🧹 Limpiando usuarios de test antiguos y forzando recreación de demos...");
  await db.execute(`DELETE FROM user WHERE email LIKE 'auth-test-%'`);
  await db.execute(`DELETE FROM user WHERE email = 'demo@example.com'`);
  await db.execute(`DELETE FROM user WHERE email = 'jose@example.com'`);
  // También limpiamos cuenta/sesión de esos usuarios por las dudas
  await db.execute(`DELETE FROM account`);
  await db.execute(`DELETE FROM session`);

  // Datos demo
  const demoEmail = "demo@example.com";
  const demoPassword = "demo1234";

  const joseEmail = "jose@example.com";
  const josePassword = "jose1234";

  // 1. Usuario demo — creado via Better Auth
  let user = await dbService.users.getByEmail(demoEmail);
  if (!user) {
    await auth.api.signUpEmail({
      body: {
        email: demoEmail,
        password: demoPassword,
        name: "Lucas Demo",
      },
    });
    user = await dbService.users.getByEmail(demoEmail);
    if (!user) throw new Error("No se pudo crear el usuario demo");
    console.log("✅ Usuario demo creado.");
  } else {
    console.log("ℹ️ El usuario demo ya existe.");
  }

  // 2. Usuario dev — José
  let joseUser = await dbService.users.getByEmail(joseEmail);
  if (!joseUser) {
    await auth.api.signUpEmail({
      body: {
        email: joseEmail,
        password: josePassword,
        name: "José",
      },
    });
    console.log(`✅ Usuario dev creado: ${joseEmail} / ${josePassword}`);
  } else {
    console.log("ℹ️ El usuario José ya existe.");
  }

  // 3. UC
  const subjects = [
    { id: randomUUID(), name: "Sistemas Operativos", total_classes: 24, user_id: user.id },
    { id: randomUUID(), name: "Arquitectura de Software", total_classes: 32, user_id: user.id },
  ];
  for (const s of subjects) {
    await dbService.subjects.create(s);
    console.log(`✅ UC creada: ${s.name}`);
  }

  // 4. Inasistencias (riesgo en Sistemas Operativos)
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

  // 5. Tareas
  const tasks: Task[] = [
    {
      id: randomUUID(),
      subject_id: subjects[1].id,
      title: "Diagrama de Microservicios",
      description: "Diseñar la comunicación mediante eventos",
      status: "todo",
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: randomUUID(),
      subject_id: subjects[0].id,
      title: "Laboratorio: Kernel Modules",
      description: "Compilar un módulo simple de Linux",
      status: "in-progress",
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    },
  ];
  for (const t of tasks) {
    await dbService.tasks.create(t);
    console.log(`✅ Tarea creada: ${t.title}`);
  }

  console.log("✨ Seed completado.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error durante el seed:", err);
  process.exit(1);
});
