# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

SmartDorm is a smart-dormitory IoT platform (university capstone project; docs and UI text are in Vietnamese). It is a polyglot monorepo with no root package manager — each service is built and run independently:

| Dir | Stack | Port |
|---|---|---|
| `backend/` | NestJS 11 + Prisma 5 + Socket.IO + MQTT client | 3001 (prefix `/api`, Swagger at `/api/docs`) |
| `frontend/` | Next.js 16 (App Router) + React 19 + Tailwind 4 + Zustand + Recharts | 3000 |
| `ml-service/` | FastAPI + scikit-learn (GBM forecaster, IsolationForest, RandomForest occupancy) | 8000 (`/ml/*`, docs at `/docs`) |
| `hardware/` | ESP32 C++ firmware (PlatformIO; Wokwi digital twin via `diagram.json`/`wokwi.toml`) | — |
| `simulator/` | Python scripts that publish fake room telemetry over MQTT | — |

Infrastructure: Mosquitto MQTT (1883, WS 9001), InfluxDB 2.7 (8086). `docker-compose.yml` also starts PostgreSQL, but the backend actually runs on **SQLite** (`backend/prisma/dev.db`, committed); `schema.postgresql.prisma` is an alternate, unused-by-default schema.

## Commands

All-in-one local start (Windows): `.\start.ps1` (`-WithSimulator` to also run the simulator). Docker: `cp .env.docker.example .env.docker && docker compose --env-file .env.docker up -d --build`, then seed with `docker exec smartdorm-backend node dist/prisma/seed-demo.js`.

Backend (`cd backend`):
- `npm run start:dev` — watch mode; first run needs `npx prisma generate && npx prisma db push`
- `npm run build` — compile check (used as the pre-deploy check)
- `npm run lint` (note: runs eslint with `--fix`), `npm run format`
- `npm test` — Jest, specs are `src/**/*.spec.ts`; single file: `npx jest src/intelligence/copilot/copilot.spec.ts`; by name: `npx jest -t "<test name>"`
- `npm run test:e2e` — uses `test/jest-e2e.json`
- `npm run seed:demo` — seed demo data (`prisma/seed-demo.ts`)
- Prod entry is `dist/src/main.js` (not `dist/main.js`) because `prisma/` is compiled alongside `src/`.

Frontend (`cd frontend`):
- `npm run dev`, `npm run build`, `npm run lint`
- Type check: `npx tsc --noEmit`
- No test suite.

ML service (`cd ml-service`):
- `python -m uvicorn app.main:app --reload --port 8000`
- `pytest tests/ -v`; single test: `pytest tests/test_forecast.py::<test_name> -v`
- Training scripts in `training/` (`train_forecast.py`, `train_anomaly.py`, `train_occupancy.py`, `retraining_job.py`) write `.joblib` artifacts + `*_metrics.json` to `models/`. Dataset: `generate_dataset.py` → `data/curated/`.

Firmware: `& "$HOME\.platformio\penv\Scripts\platformio.exe" run -d hardware -t upload`

## Architecture

**Data flow:** ESP32/simulator → MQTT → NestJS → (Prisma SQLite + InfluxDB) → Socket.IO → Next.js. Commands go the reverse way: REST → NestJS → MQTT publish → ESP32.

**MQTT topic scheme:** `dormitory/{building}/{floor}/{room}/<suffix>`. Backend subscribes to `sensor/data`, `access/rfid`, `emergency`, `status`, `command/ack` (see `backend/src/mqtt/mqtt.service.ts`). `MqttService` is an EventEmitter: domain services (`sensors`, `devices`, `access-log`, `intelligence/decision-engine`) each register `mqttService.on('message', ...)` and filter by topic themselves — there is no central router. Changing the topic format requires updating firmware (`hardware/src/main.cpp` `topicBase`), simulator, and every listener.

**Realtime to frontend:** `backend/src/gateway/events.gateway.ts` emits named events (`sensor:update`, `room:sensor` to `room:{id}` rooms, `device:status`, `emergency:alert`/`emergency:resolved`, `command:new`/`command:log`, `access:log`, `ai:anomaly`, `ai:recommendation`). Frontend consumes via the singleton in `frontend/src/lib/socket.ts`.

**Backend patterns:**
- Device control uses the **Command pattern** (`backend/src/devices/commands/`, executed via `CommandInvoker`), each command publishing to MQTT and logging to `CommandLog`.
- Emergencies use the **Strategy pattern** (`backend/src/emergency/strategies/` — fire, gas leak).
- `backend/src/intelligence/` is the AI layer: `ml-client` calls the FastAPI service and **falls back to a synthetic diurnal forecast** if ML is unreachable; `decision-engine` (rule engine with `rules/*`) evaluates telemetry; `recommendation`/`automation` manage recommendation lifecycle and rules; `copilot` is a Gemini-backed assistant grounded via `CopilotToolsService` (read-only tools over DB data); `llm` wraps the provider (`GEMINI_API_KEY`/`LLM_PROVIDER`/`LLM_MODEL`).
- Auth: JWT + `RolesGuard` with roles `ADMIN` | `STUDENT`; students are scoped to their own room. Global `ThrottlerGuard`, global `ValidationPipe({ whitelist: true })`.
- SQLite has no enums: role/device type/emergency type/level are plain strings validated in code (allowed values listed at the top of `prisma/schema.prisma`).
- Notifications (Telegram bot polling + SMTP) in `notifications/`. Only one process may poll a given `TELEGRAM_BOT_TOKEN` — running local and VPS backends together causes `409 Conflict`.

**ML service:** `app/main.py` mounts routers from `app/api/`; models are loaded via `app/services/model_registry.py` from `models/*.joblib`. The service reads telemetry from InfluxDB and directly from the backend's SQLite file (`DATABASE_URL`, default `sqlite:///../backend/prisma/dev.db`; in Docker `backend/prisma` is volume-shared into both containers). Root-level packages (`forecasting/`, `anomaly/`, `occupancy/`, `preprocessing/`, `evaluation/`) hold the model code shared by `app/` and `training/`, so run commands from `ml-service/`.

**Frontend:** two portals under `src/app/` — `dashboard/` (admin) and `student/` (mobile-first, bottom nav), each with its own `layout.tsx`. All HTTP goes through `src/lib/api.ts` (axios, attaches JWT from `localStorage`, redirects to `/login` on 401). `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` are baked in at **build time**, so a Docker/VPS frontend rebuild must pass them as `--build-arg`.

**Next.js caveat** (from `frontend/AGENTS.md`): Next.js 16 has breaking changes versus older versions — consult `frontend/node_modules/next/dist/docs/` before writing framework-level code and heed deprecation notices.

## Deployment

Production runs on a Cloud VPS via Docker Compose at `/app/smartdorm` (details and re-deploy workflow in `README.md` and `HUONG_DAN_THUE_VA_CAI_DAT_VPS_CLOUD.md`; one-shot script `deploy_vps.sh`). Rebuild only the changed service (`docker compose --env-file .env.docker up -d --build <service>`). The firmware hardcodes the VPS IP as primary MQTT broker with `broker.hivemq.com` as fallback.

Demo accounts (from seed): `admin@ktx.edu.vn` / `admin123`, `sv001@student.edu.vn` / `sinhvien123`.
