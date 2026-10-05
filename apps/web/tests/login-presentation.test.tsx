import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

test("login conserva campos, autocomplete y acceso al registro", async () => {
  const previousBase = process.env.BASE_URL;
  process.env.BASE_URL = "http://localhost/panel";
  const { AuthProvider } = await import("../src/contexts/AuthContext");
  const { LoginForm } = await import("../src/components/auth/LoginForm");
  if (previousBase === undefined) delete process.env.BASE_URL;
  else process.env.BASE_URL = previousBase;
  const html = renderToStaticMarkup(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>,
  );
  expect(html).toContain("Volvé a tu");
  expect(html).toContain('type="email"');
  expect(html).toContain('autoComplete="email"');
  expect(html).toContain('type="password"');
  expect(html).toContain('autoComplete="current-password"');
  expect(html).toContain("Crear cuenta");
  expect(html).toContain("login-security");
  expect(html).toContain("Entrar con passkey");
  expect(html).not.toContain('id="name"');
  expect(html).not.toContain('id="inviteCode"');
});
