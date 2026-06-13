#!/usr/bin/env bash
# Ejecuta la suite de pruebas dinámicas del backend I-BuS
set -euo pipefail

BACKEND_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BACKEND_ROOT"

TARGET="${1:-tests}"
COVERAGE="${COVERAGE:-0}"
FILTER="${FILTER:-}"

if [ ! -d "venv" ]; then
  echo "Creando entorno virtual..."
  python -m venv venv
fi

# shellcheck disable=SC1091
source venv/bin/activate
pip install -q -r requirements-dev.txt

ARGS=("$TARGET")
if [ "$COVERAGE" = "1" ]; then
  ARGS+=(--cov=app --cov-report=term-missing)
fi
if [ -n "$FILTER" ]; then
  ARGS+=(-k "$FILTER")
fi

echo "Ejecutando: pytest ${ARGS[*]}"
pytest "${ARGS[@]}"
