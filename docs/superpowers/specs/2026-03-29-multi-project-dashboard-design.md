# Multi-Project Security Dashboard — Design Spec

**Date:** 2026-03-29
**Status:** Approved
**Series:** qcrypt Phase 1 — Foundation

## Problem

qcrypt-migrate is currently a one-shot scan tool with in-memory storage. Results vanish on restart, there's no way to track multiple projects, and no historical view to see if a codebase is improving or degrading. It feels like a demo, not a tool.

## Solution

Transform the web UI into a persistent multi-project security dashboard. SQLite stores all scan results and migration plans. An overview page shows org-level stats across all projects. Each project has a detail page with scan history, trend charts, and migration steps.

## Architecture

### Storage

SQLite via `better-sqlite3`. Single file at `~/.qcrypt/qcrypt.db` (created on first run).

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE scans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scanned_at TEXT NOT NULL,
  grade TEXT NOT NULL,
  files_scanned INTEGER NOT NULL,
  critical INTEGER NOT NULL,
  warning INTEGER NOT NULL,
  info INTEGER NOT NULL,
  ok INTEGER NOT NULL,
  report_json TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

Summary columns (`grade`, `critical`, etc.) enable fast aggregate queries. JSON blobs store full ScanReport and MigrationPlan for rendering detail views.

### Project Identity

A project is identified by its resolved absolute path. First scan of a path auto-creates the project. Rescanning the same path adds to that project's history. Project name defaults to the folder basename (e.g., `/Users/varma/auth-server` → "auth-server").

### API

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/projects` | GET | List all projects with latest scan stats |
| `GET /api/projects/:id` | GET | Project detail with all scan history |
| `DELETE /api/projects/:id` | DELETE | Delete project and all its scans |
| `POST /api/projects/:id/scan` | POST | Rescan project, store result |
| `POST /api/scan` | POST | Scan a path — auto-creates project if new, returns project + latest scan |
| `GET /api/overview` | GET | Aggregate stats: total projects, worst grade, total critical findings |
| `GET /api/browse` | GET | (existing) List directories for folder browser |

The existing `/api/migrate` endpoint stays for CLI backward compatibility.

### Project Structure (additions)

```
src/
├── db/
│   ├── index.ts          # SQLite connection, init tables
│   ├── projects.ts       # CRUD for projects table
│   └── scans.ts          # CRUD for scans table
```

## Web UI

### Sidebar

- **Overview** (new home, `/`)
- **Benchmark** (renamed from Dashboard, `/benchmark`)
- **Comparison** (`/comparison`)
- **Education** (`/education`)

"Migrate" is removed as a standalone page — absorbed into project detail.

### Overview Page (`/`)

**Top stats bar** — four cards in a row:
- Total Projects
- Worst Grade (with grade badge)
- Total Critical Issues
- Total Scans

**Project cards grid** — each card shows:
- Grade badge (A/B/C/D/F, color-coded)
- Project name and path
- Finding counts (critical, warning, info)
- Last scan timestamp (relative, e.g., "2 hours ago")
- Trend sparkline (grade over last N scans)

**"Scan New Project" button** — opens folder browser, scans the selected path, auto-creates project, navigates to its detail page.

### Project Detail Page (`/projects/:id`)

**Header:** Project name, path, large grade badge, "Rescan" button, "Delete" button.

**Scan History Chart:** Line chart showing grade over time (last N scans). Grade mapped to numeric: A=4, B=3, C=2, D=1, F=0.

**Latest Scan Summary:** The existing summary card — grade badge, files scanned, crypto usages found, actions needed, critical issues, color-coded risk bar.

**Migration Steps:** The existing phased expandable cards (Immediate / Short-term / Long-term).

**Download as Markdown** button.

## CLI

No changes to CLI flags. The `--serve` flag starts the server which now uses SQLite. Scans via CLI (`npx qcrypt-migrate [path]`) still work as terminal/json/markdown output without persisting (persistence is server-only).

## Tech Stack

Additions to existing stack:
- `better-sqlite3` — SQLite driver (synchronous API, fast, no ORM needed)
- `@types/better-sqlite3` — TypeScript types

## Testing Strategy

### Unit Tests
- Database CRUD: create project, create scan, list projects, get project with scans, delete project cascades, aggregate stats
- Auto-create project on scan (new path creates project, same path reuses project)

### API Tests
- All new endpoints (GET /api/projects, POST /api/scan, DELETE, etc.)
- Overview stats calculation

### E2E Tests
- Scan a path via API, verify project created, rescan, verify history grows
- Delete project, verify scans gone

## Out of Scope (Phase 1)

- User authentication / multi-tenant
- CI/CD integration (Phase 3)
- Compliance mapping (Phase 2)
- PDF export (Phase 2)
- Project renaming/management UI
- Slack/webhook notifications (Phase 3)
