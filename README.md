# HomeOps

Kućni monitoring servisa (HTTP/TCP provere, istorija, Telegram alerti, Prometheus metrike).
Stack: Node.js 22 + TypeScript (Fastify), PostgreSQL, Docker Compose.

## Pokretanje

```bash
cp .env.example .env      # na Windowsu: copy .env.example .env
docker compose up -d --build
```

API: http://localhost:3000

## API

| Metoda | Putanja | Opis |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrike |
| GET | `/api/services` | Lista servisa |
| POST | `/api/services` | Dodaj servis `{name, type: "http"\|"tcp", target}` |
| DELETE | `/api/services/:id` | Obriši servis |
| GET | `/api/services/:id/checks` | Poslednjih 100 provera |

Primer:

```bash
curl -X POST localhost:3000/api/services -H "content-type: application/json" \
  -d '{"name":"Router","type":"http","target":"http://192.168.1.1"}'
```

## Telegram alerti

1. Napravi bota preko `@BotFather` i uzmi token.
2. Uzmi svoj chat id (npr. preko `@userinfobot`).
3. Upiši `TELEGRAM_BOT_TOKEN` i `TELEGRAM_CHAT_ID` u `.env`.

Alert stiže samo kad servis promeni stanje (UP↔DOWN).

## Razvoj

```bash
cd backend && npm install
npm run dev        # potreban Postgres (DATABASE_URL)
npm test && npm run lint && npm run typecheck
```

## Plan

- [x] Faza 1–2: backend, Docker, Compose
- [ ] Frontend (React + Vite)
- [ ] Faza 3: CI (GitHub Actions)
- [ ] Faza 4: CD (GHCR + deploy)
- [ ] Faza 5: Prometheus + Grafana
- [ ] Faza 6: Terraform
