# CLAUDE.md

This file provides guidance for AI assistants (and developers) working with the **PA Flag Tool** (`needyseedy/Claude`).

## What This Project Is

A monitoring and briefing automation tool for UK public affairs professionals. It:

1. **Scans sources** — Outlook emails, parliamentary feeds, gov.uk, RSS/news
2. **Detects developments** — new items are stored and de-duplicated
3. **Generates tactical flags** — uses Claude API to draft flags in the user's own writing style
4. **Serves a dashboard** — browser UI to review, edit, copy, and manage flags

Tech stack: Node.js, TypeScript, Express, SQLite (better-sqlite3), Claude API (Anthropic SDK), Microsoft Graph API (Outlook), rss-parser.

## Project Structure

```
pa-flag-tool/
├── src/
│   ├── index.ts                  # Express server entrypoint
│   ├── types/index.ts            # Shared TypeScript interfaces
│   ├── utils/
│   │   ├── config.ts             # Env var loading
│   │   └── html.ts               # HTML stripping / text utils
│   ├── db/
│   │   ├── migrate.ts            # SQLite schema + seed data
│   │   └── repository.ts         # All database queries
│   ├── services/
│   │   ├── outlook.ts            # Microsoft Graph / Outlook client
│   │   └── flagwriter.ts         # Claude API flag generation + relevance
│   ├── monitors/
│   │   ├── rss.ts                # RSS feed checker
│   │   ├── outlook.ts            # Outlook inbox checker
│   │   └── scheduler.ts          # Cron-based monitoring loop
│   ├── routes/
│   │   ├── sources.ts            # CRUD for monitored sources
│   │   ├── developments.ts       # Developments list + actions
│   │   ├── flags.ts              # Flag CRUD + status management
│   │   ├── style.ts              # Style example management
│   │   ├── topics.ts             # Client topic CRUD
│   │   └── monitor.ts            # Manual scan + bulk generate
│   └── __tests__/
│       ├── html.test.ts
│       └── repository.test.ts
├── public/
│   └── index.html                # Single-page dashboard (vanilla JS)
├── data/                         # SQLite database (gitignored)
├── package.json
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── .env.example
└── .gitignore
```

## Getting Started

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY (required) and Azure creds (optional)

# Run in development mode (auto-reloads)
npm run dev

# Open http://localhost:3000 in your browser
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with auto-reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm test` | Run tests once (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run db:reset` | Delete and re-create the database |

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for flag generation |
| `AZURE_CLIENT_ID` | No | Azure AD app ID for Outlook access |
| `AZURE_CLIENT_SECRET` | No | Azure AD app secret |
| `AZURE_TENANT_ID` | No | Azure AD tenant ID |
| `PORT` | No | Server port (default: 3000) |
| `MONITOR_INTERVAL_MINUTES` | No | How often to auto-scan (default: 15) |

Outlook integration is optional — the tool works with RSS sources alone.

## Architecture Decisions

- **SQLite via better-sqlite3**: Zero-config local database. No cloud dependency. Synchronous API for simplicity in the Express routes.
- **Vanilla JS dashboard**: No build step for the frontend. Single `public/index.html` file keeps things simple and fast to iterate on.
- **De-duplication by title + source**: Developments are only created once per unique (title, source_id) pair.
- **Style examples**: The user pastes their own past flags. These are injected into the Claude system prompt so generated flags match their voice.
- **Client topics with keywords**: Used for relevance filtering — Claude assesses each development against active topics before generating a flag.
- **Cron-based monitoring**: `node-cron` runs scans at the configured interval. Manual scans are also available via the dashboard or API.

## API Endpoints

All endpoints are prefixed with `/api`.

- `GET /api/health` — Status check (shows which integrations are configured)
- `GET/POST /api/sources` — List / create monitored sources
- `PATCH /api/sources/:id/toggle` — Enable/disable a source
- `GET /api/developments` — List detected developments
- `GET /api/developments/new` — List unprocessed developments
- `POST /api/developments/:id/generate-flag` — Generate a flag for one development
- `GET /api/flags` — List all flags (filter by `?status=draft|reviewed|sent`)
- `PATCH /api/flags/:id` — Update a flag (content, status, tags)
- `GET/POST /api/style-examples` — Manage writing style examples
- `GET/POST /api/topics` — Manage client topics
- `POST /api/monitor/scan` — Trigger a manual source scan
- `POST /api/monitor/generate-all` — Generate flags for all new developments

## Code Conventions

- **TypeScript strict mode** with ESM modules (`"type": "module"`)
- Interfaces live in `src/types/index.ts`
- Database queries live in `src/db/repository.ts` — routes should not contain raw SQL
- Route files export a factory function: `(db: Database) => Router`
- Services (`flagwriter`, `outlook`) are initialised once at startup
- Use `console.log`/`console.error` with `[module]` prefixes for logging

## AI Assistant Guidelines

When working in this repository:

1. **Read before writing** — Always read existing files before proposing changes
2. **Run `npm test` after changes** — All 15 tests must pass
3. **Run `npx tsc --noEmit` to type-check** — Must compile clean
4. **Keep the dashboard simple** — It's vanilla HTML/JS in a single file by design
5. **Add queries to repository.ts** — Don't put SQL in route handlers
6. **Respect the style example system** — Don't hardcode writing style; it's user-configurable
7. **Don't over-engineer** — This is a practical day-to-day tool, not a framework

## Default Monitored Sources

Pre-seeded on first run:
- UK Parliament Commons Hansard
- UK Parliament Lords Hansard
- UK Parliament Bills
- UK Parliament Written Questions
- UK Parliament Written Statements
- GOV.UK Publications
- GOV.UK Press Releases
- Outlook Inbox (requires Azure config)
