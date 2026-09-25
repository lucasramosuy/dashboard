import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";

async function getTestCookie(): Promise<string> {
  const email = `limits-${Date.now()}@test.com`;
  await auth.api.signUpEmail({ body: { email, password: "test12345", name: "Test" } });
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password: "test12345" }),
    headers: { "Content-Type": "application/json" },
  });
  return res.headers.get("set-cookie") || "";
}

describe("Límites de tamaño", () => {
  let cookie: string;

  beforeEach(async () => {
    cookie = await getTestCookie();
  });

  const post = (path: string, body: unknown) =>
    app.request(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", Cookie: cookie },
    });

  it("rechaza bodies de más de 64 KB con 413", async () => {
    const res = await post("/api/subjects", { name: "x".repeat(70 * 1024), total_classes: 1 });
    expect(res.status).toBe(413);
  });

  it("rechaza textos más largos que el máximo con 400", async () => {
    const res = await post("/api/subjects", { name: "x".repeat(201), total_classes: 1 });
    expect(res.status).toBe(400);
  });

  it("acepta textos normales", async () => {
    const res = await post("/api/subjects", { name: "Matemática", total_classes: 1 });
    expect(res.status).toBe(201);
  });
});
