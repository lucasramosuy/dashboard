import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";

interface BackButtonProps {
  fallback?: string;
  className?: string;
}

export function BackButton({ fallback = "/", className }: BackButtonProps) {
  const handleBack = () => {
    // Si la página se abrió en una pestaña nueva o se ingresó directo a la URL,
    // history.length será corto (típicamente 1 o 2). En navegadores modernos suele ser > 2
    // para páginas con historial. Si no hay historial real de la SPA/sitio,
    // se navega al fallback para no dejar al usuario "atrapado".
    if (typeof window !== "undefined") {
      if (window.history.length > 2) {
        window.history.back();
      } else {
        window.location.href = fallback;
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`text-theme-text-muted hover:text-theme-text px-2 -ml-2 ${className || ""}`}
      aria-label="Volver a la página anterior"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Volver
    </Button>
  );
}
