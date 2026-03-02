# Guía de buenas prácticas para handlers, errores y logs en React + TypeScript

---

## 1. Estructura del handler y flujo de control

## 1.1. Patrón general recomendado

- Usar funciones `async` para handlers que llamen APIs o servicios (ej. `authClient.signOut()`).
- Encapsular la lógica potencialmente fallida dentro de un `try/catch`.
- Usar `finally` solo para tareas que deban ejecutarse siempre (limpieza, cierre de modals, reseteo de flags), no para decisiones de flujo que dependan de éxito o error.

```ts
const handleAction = async () => {
  try {
    await doSomethingAsync();
    // Lógica de éxito (redirigir, mostrar mensaje de éxito, etc.)
  } catch (error) {
    // Manejo de error (log, feedback al usuario)
  } finally {
    // Limpieza que debe ocurrir siempre (opcional)
  }
};
```

## 1.2. Evitar finally para decisiones críticas

- Mala práctica típica en logout:

```ts
const handleLogout = async () => {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error("Error logging out", error);
  } finally {
    // Esto se ejecuta incluso si signOut falla
    window.location.replace("/login");
  }
};
```

- Mejor:

```ts
const handleLogout = async () => {
  try {
    await authClient.signOut();
    window.location.replace("/login");
  } catch (error) {
    logger.error("Error logging out", error);
    showToast("No se pudo cerrar sesión. Intenta nuevamente.");
  }
};
```

# 2. Manejo de errores a nivel código

## 2.1. Capturar errores donde tenga sentido

- Capturá el error lo más cerca posible del lugar donde puedas tomar una decisión (mostrar mensaje, reintentar, cancelar navegación, etc.).
- No uses catch masivo en una capa muy alta si luego no sabés qué hacer concretamente con el error.

```ts
const handleLogout = async () => {
  try {
    await authClient.signOut();
    navigate("/login", { replace: true });
  } catch (error) {
    logger.error("Error logging out", error);
    showToast("No se pudo cerrar sesión. Intenta nuevamente.");
  }
};
```

## 2.2. No dejar catch vacío

- Evitar:

```ts
try {
  await authClient.signOut();
} catch (error) {
  // silencio absoluto
}
```

- Mejor siempre:
  - Log técnico (aunque sea solo en desarrollo).
  - Algún tipo de feedback al usuario cuando la acción es relevante (submit, logout, pago, etc.).

```ts
try {
  await authClient.signOut();
} catch (error) {
  logger.error("Error logging out", error);
  showToast("No se pudo cerrar sesión. Intenta nuevamente.");
}
```

## 2.3. Normalizar y tipar errores cuando sea posible

En TypeScript, es común que el catch reciba unknown. Buen patrón:

```ts
const toError = (err: unknown): Error => {
  if (err instanceof Error) return err;
  return new Error(String(err));
};

const handleLogout = async () => {
  try {
    await authClient.signOut();
    navigate("/login", { replace: true });
  } catch (err) {
    const error = toError(err);
    logger.error("Error logging out", error.message, error.stack);
    showToast("No se pudo cerrar sesión.");
  }
};
```

# 3. Logging: buenas prácticas

## 3.1. Evitar uso directo masivo de console.log

- No llenar el código con console.log repartidos.
- Centralizar el logging en un pequeño módulo (logger) con niveles (debug, info, warn, error).
- Filtrar según entorno (en producción, menos ruido).

```ts
// logger.ts
export const logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[DEBUG]", ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },
};
```

- Uso:

```ts
import { logger } from "./logger";

const handleLogout = async () => {
  try {
    await authClient.signOut();
    logger.info("User logged out successfully");
    navigate("/login", { replace: true });
  } catch (error) {
    logger.error("Error logging out", error);
    showToast("No se pudo cerrar sesión.");
  }
};
```

## 3.2. No loguear datos sensibles

- Evitar loguear:
  - Tokens JWT, API keys, cookies.
  - Datos personales (documentos, emails, teléfonos) sin necesidad.
  - Respuestas completas de APIs si contienen datos sensibles.

- Malo:

```ts
logger.error("SignOut failed", response); // response puede tener datos sensibles
```

- Mejor:

```ts
logger.error("SignOut failed", {
  code: response.status,
  message: response.data?.message,
});
```

# 4. UX de errores: lo que ve el usuario

## 4.1. Separar mensaje técnico del mensaje al usuario

- El log es para desarrollo y soporte.
- El mensaje al usuario debe ser corto, claro y no técnico.

Ejemplo:

```ts
try {
  await authClient.signOut();
  navigate("/login", { replace: true });
} catch (error) {
  logger.error("Error logging out", error);
  showToast("No se pudo cerrar sesión. Verifica tu conexión e intenta nuevamente.");
}
```

## 4.2. Usar patrones consistentes para feedback

- Para acciones puntuales (logout, submit): toast, snackbar, mensaje cercano al botón.
- Para errores globales (falló toda la app): error boundary + pantalla de error.

# 5. Error boundaries y errores globales

## 5.1. Uso de Error Boundaries en React

Para errores de renderizado (no errores en handlers async), usar un Error Boundary:

```ts
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("Unhandled UI error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div>Ha ocurrido un error. Recarga la página.</div>;
    }
    return this.props.children;
  }
}
```

- Uso:

```tsx
<AppErrorBoundary>
  <App />
</AppErrorBoundary>
```

# 6. Navegación después del logout

## 6.1. Usar el router cuando sea posible

En una SPA con React Router (u otro), preferible:

```ts
const navigate = useNavigate();

const handleLogout = async () => {
  try {
    await authClient.signOut();
    navigate("/login", { replace: true }); // evita volver con "atrás"
  } catch (error) {
    logger.error("Error logging out", error);
    showToast("No se pudo cerrar sesión.");
  }
};
```

- Ventajas:
  - No recarga toda la página.
  - Mantiene el control del historial.
  - Mejor experiencia de usuario.

## 6.2. Cuándo usar window.location.replace

- window.location.replace("/login") puede tener sentido si:
  - Querés resetear completamente el estado global (store, caches, etc.).
  - Estás limpiando cosas a nivel de ventana (ej. iframes, integraciones raras).
  - Quieres forzar una recarga desde el servidor (no desde el bundle actual).

- Patrón:

```ts
const handleLogout = async () => {
  try {
    await authClient.signOut();
  } catch (error) {
    logger.error("Error logging out", error);
    // Podrías decidir no redirigir en caso de error grave
  } finally {
    window.location.replace("/login");
  }
};
```

- Este patrón debe usarse conscientemente: siempre va a redirigir, incluso si el logout falla.

# 7. Buenas prácticas específicas para TypeScript

## 7.1. Tipar correctamente handlers y props

- Tipar el componente y el handler para aprovechar TS al máximo.

```ts
type LogoutButtonProps = {
  onLoggedOut?: () => void;
};

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onLoggedOut }) => {
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      await authClient.signOut();
      onLoggedOut?.();
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const error = toError(err);
      logger.error("Error logging out", error);
      showToast("No se pudo cerrar sesión.");
    }
  };

  return <button onClick={handleLogout}>Salir</button>;
};
```

## 7.2. Función utilitaria para errores

- Reutilizable en toda la app:

```ts
export const toError = (err: unknown): Error => {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  return new Error("Unknown error");
};
```

# 8. Organización del código

## 8.1. Separar preocupaciones

- Componente: UI + llamada al handler.
- Handler: orquestación (llamar servicio de auth, router, feedback).
- Servicios: lógica de negocio (por ejemplo, authClient.signOut()).
- Utilidades: logging, helpers de error.

Estructura simple:

```text
src/
  auth/
    authClient.ts
  components/
    LogoutButton.tsx
  utils/
    logger.ts
    errors.ts
```

## 8.2. Evitar lógica pesada directamente en el JSX

- Malo:

```ts
<button
  onClick={async () => {
    try {
      await authClient.signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
    }
  }}
>
  Salir
</button>
```

- Mejor:

```ts
<button onClick={handleLogout}>Salir</button>
```

Con handleLogout definido fuera del JSX.

# 9. Checklist rápido para revisar tu código

- Antes de dar por bueno un handler como handleLogout, revisá:
  - [ ] ¿Tiene try/catch alrededor de la operación async crítica?
  - [ ] ¿El finally solo se usa para tareas que deben ocurrir siempre?
  - [ ] ¿No hay catch vacío sin log ni feedback?
  - [ ] ¿Los logs pasan por un wrapper (no console.log directo por todos lados)?
  - [ ] ¿No se registran datos sensibles en los logs?
  - [ ] ¿El usuario recibe un mensaje claro si algo sale mal?
  - [ ] ¿La navegación post-logout usa replace para evitar volver a la pantalla protegida?
  - [ ] ¿La lógica de negocio está en servicios/utilidades y no embutida en el JSX?

---

AGENTE: NO debes modificar el #9. Solamente debes confirmar que has ejecutado el checklist y que el código cumple con las buenas prácticas. Si no cumple, debes modificar el código para que cumpla con las buenas prácticas.
