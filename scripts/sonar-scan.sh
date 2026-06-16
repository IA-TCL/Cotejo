#!/bin/sh
# Genera reportes de cobertura y lanza sonar-scanner contra localhost:9000
# Uso: ./scripts/sonar-scan.sh
# Requiere: docker compose up sonarqube, SONAR_TOKEN en .env

set -e

# 1. Cobertura backend
echo "==> Generando cobertura backend..."
cd backend
pip install -q pytest-cov
pytest --cov=app --cov-report=xml:coverage.xml -q
cd ..

# 2. Cobertura frontend
echo "==> Generando cobertura frontend..."
cd frontend
npm run test -- --coverage --reporter=lcov
cd ..

# 3. Lanzar sonar-scanner via Docker
echo "==> Lanzando sonar-scanner..."
. .env
docker run --rm \
  --network host \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url="${SONAR_HOST_URL:-http://localhost:9000}" \
  -Dsonar.token="${SONAR_TOKEN}" \
  -Dproject.settings=/usr/src/sonar-project.properties

echo "==> Analisis completo. Revisa los resultados en ${SONAR_HOST_URL:-http://localhost:9000}"
