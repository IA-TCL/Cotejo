#!/bin/sh
# Genera reportes de cobertura y lanza sonar-scanner contra localhost:9000
# Uso: MSYS_NO_PATHCONV=1 ./scripts/sonar-scan.sh
# Requiere: docker compose up -d

set -e

# 1. Cobertura backend (dentro del container de backend)
echo "==> Generando cobertura backend..."
docker compose exec backend pytest --cov=app --cov-report=xml:/app/coverage.xml -q

# Corregir rutas: pytest genera /app/app pero el scanner ve /usr/src/backend/app
sed -i 's|/app/app|/usr/src/backend/app|g' backend/coverage.xml
echo "    Rutas de coverage.xml corregidas."

# 2. Cobertura frontend
echo "==> Generando cobertura frontend..."
cd frontend
npm run test -- --run --coverage
cd ..

# 3. Lanzar sonar-scanner via Docker
echo "==> Lanzando sonar-scanner..."
. .env
MSYS_NO_PATHCONV=1 docker run --rm \
  --network prototipo_default \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli \
  -Dsonar.host.url=http://sonarqube:9000 \
  -Dsonar.login="${SONAR_TOKEN}" \
  -Dsonar.projectBaseDir=/usr/src

echo ""
echo "==> Analisis completo: http://localhost:9000/dashboard?id=portal-cotejo"
