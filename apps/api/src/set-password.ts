// Cambia la contraseña de un usuario y la guarda con el hash PBKDF2 nuevo.
// Uso: bun run set-password <email>   (pide la contraseña por la terminal)
// Con TURSO_DATABASE_URL/TURSO_AUTH_TOKEN en el entorno apunta a la base de producción.
import { initDB, db } from "./lib/db";
import { hashPassword } from "./lib/password";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: bun run set-password <email>");
    process.exit(1);
  }
  const password = prompt("Contraseña nueva (mínimo 8 caracteres):") ?? "";
  if (password.length < 8) {
    console.error("La contraseña tiene que tener al menos 8 caracteres.");
    process.exit(1);
  }

  await initDB();
  const user = await db.execute({ sql: "SELECT id FROM user WHERE email = ?", args: [email] });
  const userId = user.rows[0]?.id as string | undefined;
  if (!userId) {
    console.error(`No existe un usuario con el email ${email}.`);
    process.exit(1);
  }

  const res = await db.execute({
    sql: "UPDATE account SET password = ?, updatedAt = ? WHERE userId = ? AND providerId = 'credential'",
    args: [await hashPassword(password), new Date().toISOString(), userId],
  });
  if (res.rowsAffected === 0) {
    console.error("El usuario no tiene cuenta con email y contraseña.");
    process.exit(1);
  }
  console.log(`✅ Contraseña actualizada para ${email}`);
  process.exit(0);
}

main();
