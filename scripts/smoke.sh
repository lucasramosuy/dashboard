#!/usr/bin/env bash
# Smoke test contra un deploy: health de la API, redirect al login, página de login con
# sus assets y que Better Auth responda (login inválido => 401, o sea que lee la base).
# No crea usuarios ni toca datos. Uso: scripts/smoke.sh [https://lucasramos.uy/dashboard]
set -uo pipefail

BASE="${1:-https://lucasramos.uy/dashboard}"
BASE="${BASE%/}"
ORIGIN="$(printf '%s' "$BASE" | grep -oE '^https?://[^/]+')"
FAIL=0

# En Actions, Cloudflare le muestra el desafío anti-bots a las IPs de datacenter. Si está
# SMOKE_KEY, se manda en el header x-smoke-key y una regla de Cloudflare deja pasar el request.
# Solo contra lucasramos.uy, para no mandar la clave a otros hosts.
CURL=(curl -s)
if [ -n "${SMOKE_KEY:-}" ] && [ "$ORIGIN" = "https://lucasramos.uy" ]; then CURL+=(-H "x-smoke-key: $SMOKE_KEY"); fi

check() {
  local name="$1" expected="$2" got="$3"
  if [ "$got" = "$expected" ]; then
    echo "ok    $name ($got)"
  else
    echo "FALLA $name: esperaba $expected, llegó $got"
    FAIL=1
  fi
}

# Reintenta el health unos segundos por si el deploy recién se está propagando
for _ in 1 2 3 4 5 6; do
  health="$("${CURL[@]}" --max-time 10 "$BASE/api/health" || true)"
  [ "$health" = '{"status":"ok"}' ] && break
  sleep 5
done
check "GET /api/health" '{"status":"ok"}' "$health"

code="$("${CURL[@]}" -o /dev/null --max-time 10 -w '%{http_code} %{redirect_url}' "$BASE/")"
check "GET / sin sesión redirige al login" "302 $BASE/login" "$code"

login="$("${CURL[@]}" --max-time 10 "$BASE/login")"
if printf '%s' "$login" | grep -q '<title>Iniciar Sesión'; then
  echo "ok    GET /login (título)"
else
  echo "FALLA GET /login: no aparece el título 'Iniciar Sesión'"
  FAIL=1
fi

asset="$(printf '%s' "$login" | grep -oE '/dashboard/_astro/[^"]+\.css' | head -1)"
if [ -n "$asset" ]; then
  check "CSS $asset" "200" "$("${CURL[@]}" -o /dev/null --max-time 10 -w '%{http_code}' "$ORIGIN$asset")"
else
  echo "FALLA no se encontró el CSS en /login"
  FAIL=1
fi

code="$("${CURL[@]}" -o /dev/null --max-time 15 -w '%{http_code}' -X POST "$BASE/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' -H "Origin: $ORIGIN" \
  -d '{"email":"smoke-test@example.invalid","password":"smoke-test-no-existe"}')"
check "POST login inválido (auth + base)" "401" "$code"

if [ "$FAIL" -ne 0 ]; then
  echo "Smoke test FALLÓ contra $BASE"
  exit 1
fi
echo "Smoke test OK contra $BASE"
