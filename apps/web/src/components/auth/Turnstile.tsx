import React, { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY, registerCaptchaReset, setCaptchaToken } from "../../lib/captcha";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile no cargó")),
    );
    script.addEventListener("error", () => reject(new Error("Turnstile no cargó")));
  });
}

// Widget anti-bots de Cloudflare. En modo "gestionado" casi siempre pasa solo, sin clics.
export const Turnstile: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return;
    let widgetId: string | null = null;
    let cancelled = false;

    loadScript()
      .then((ts) => {
        if (cancelled || !ref.current) return;
        widgetId = ts.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          language: "es",
          callback: (t: string) => setCaptchaToken(t),
          "expired-callback": () => setCaptchaToken(null),
          "error-callback": () => setCaptchaToken(null),
        });
        registerCaptchaReset(() => widgetId && ts.reset(widgetId));
      })
      .catch(() => setCaptchaToken(null));

    return () => {
      cancelled = true;
      registerCaptchaReset(null);
      setCaptchaToken(null);
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="flex justify-center mt-2" />;
};
