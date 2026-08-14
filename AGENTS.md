# Repository Guidelines

> [!IMPORTANT]
> **AGENTS DIRECTIVE**: AI coding agents MUST keep this document (`AGENTS.md`) strictly up-to-date after making any significant changes to the repository, including adding new components, routes, database tables, modules, utility scripts, or changing APIs/configurations.

**Project**: Gbookminton  
**Type**: SvelteKit 5 Application (Node.js + SQLite)  
**Purpose**: Premium membership and tournament management for badminton/pickleball groups

---

## Project Overview

Gbookminton is a full-stack web application for managing group memberships and tournaments. It handles user authentication, event management, signup tracking, automated payment matching via Up Bank integration, and balance-based access control.

**Key Integrations**:

- **Up Bank API**: Polls for deposits and matches via shortcodes for automated balance top-ups
- **Resend**: Email notifications for events and reminders
- **BetterAuth**: Session-based authentication with custom user fields

---

## Architecture & Data Flow

### Stack

| Layer     | Technology                            |
| --------- | ------------------------------------- |
| Framework | SvelteKit 5 (SSR + client) via `@sveltejs/adapter-node` |
| Runtime   | Node.js (>= 22)                       |
| Database  | SQLite via `better-sqlite3` + Drizzle ORM (custom path via `DATABASE_PATH`) |
| Packaging | pnpm (bun removed; see `packageManager` in package.json) |
| Styling   | Tailwind CSS v4                       |
| Auth      | BetterAuth                            |
| Build     | Vite                                  |
| Types     | TypeScript (strict)                   |

### Directory Structure

```
src/
├── lib/                    # Shared library code
│   ├── server/            # Server-only utilities (DB, auth, APIs)
│   │   ├── db/
│   │   │   ├── index.ts   # Database connection (better-sqlite3)
│   │   │   └── schema.ts  # ALL Drizzle table definitions
│   │   ├── auth.ts        # BetterAuth configuration
│   │   ├── upbank.ts      # Up Bank API polling
│   │   ├── deadline.ts    # Background deadline processor
│   │   └── resend.ts      # Email client
│   ├── components/        # Reusable Svelte components
│   │   ├── EventForm.svelte # Shared event creation/editing form
│   │   ├── LocalDate.svelte # Date/time display with relative formatting
│   │   └── ui/             # shadcn-svelte UI components
│   │       ├── button/     # Button with href support
│   │       ├── badge/      # Status badges
│   │       ├── input/      # Input with number stepper
│   │       ├── input-group/# Input with prefix/suffix
│   │       ├── label/      # Form labels
│   │       ├── textarea/   # Multi-line text
│   │       ├── switch/     # Toggle switch
│   │       ├── field/      # Form field wrapper
│   │       ├── calendar/   # Calendar component
│   │       ├── popover/    # Popover overlay
│   │       ├── select/     # Select dropdown
│   │       ├── separator/  # Divider
│   │       └── datetime-picker/ # Custom date+time picker
│   └── types.ts           # TypeScript type definitions and enums
├── routes/                # SvelteKit file-based routing
│   ├── (app)/             # Route group: authenticated routes
│   │   ├── dashboard/     # User dashboard
│   │   ├── events/        # Event browsing and details
│   │   ├── account/       # User account settings
│   │   └── admin/         # Admin-only management
│   │       ├── users/     # User management (account types)
│   │       ├── settings/  # System settings (company domains)
│   │       └── events/    # Event creation
├── app.d.ts              # TypeScript declarations (App.Locals)
├── app.html              # HTML template
├── app.css               # Global styles (Tailwind)
├── Dockerfile            # Multi-stage production container build (node:22-slim + pnpm)
└── entrypoint.sh         # Container entrypoint executing auto-migrations & app startup
```

### Data Flow

1. **Request** → SvelteKit route (+page.server.ts)
2. **Auth Check** → BetterAuth session validation
3. **Data Fetch** → Drizzle queries against SQLite
4. **Payment Polling** → Background service in `hooks.server.ts` → Up Bank API
5. **Response** → Svelte page with reactive state ($state, $derived)

### Route Groups

- `(app)/` — Protected routes requiring authentication (redirects to `/signup` if unauthenticated)
- Root level — Public routes (signup, login, home)

---

## Key Modules

### Database (`src/lib/server/db/schema.ts`)

All database tables defined here via Drizzle:

- `user` — Custom fields: `role`, `balance`, `shortCode`, `accountType`
- `session`, `account`, `verification` — BetterAuth tables
- `event` — Tournament/event definitions with dual pricing (`costCompany`, `costPlusOne`)
- `eventSignup` — User-to-event mapping with status (enum values: listed/waitlist/locked/withdrawn/removed)
- `transaction` — Balance change ledger with custom fields (`notes` for description/messages, `eventSignupId` linking to the event signup record, and `originalTransactionId` for refunds)
- `companyDomain` — Configurable email domains for auto-classifying users as Company type
- `changelog` — Audit log of insertions, updates, and deletions on important tables (like `user` and `event`) automatically populated via native SQLite triggers

### Shared Types (`src/lib/types.ts`)

TypeScript enums for type-safe string values:

```typescript
export enum EventSignupStatus {
	Listed = 'listed',
	Waitlist = 'waitlist',
	Locked = 'locked',
	Withdrawn = 'withdrawn',
	Removed = 'removed'
}

export enum TransactionType {
	BankDeposit = 'bank_deposit',
	SignupDeduction = 'signup_deduction',
	WithdrawRefund = 'withdraw_refund',
	ManualAdjustment = 'manual_adjustment'
}

export enum UserRole {
	User = 'user',
	Admin = 'admin'
}

export enum AccountType {
	PlusOne = 'plusone',
	Company = 'company'
}
```

### Auth (`src/lib/server/auth.ts`)

BetterAuth configuration with:

- Email/password provider
- Custom user fields (`role`, `balance`, `shortCode`, `accountType`)
- Session management
- Automatic account type assignment based on email domain on user creation

### Account Management (`src/lib/server/account.ts`)

Helper functions for account type management:

- `determineAccountType(email)` — Checks if email domain matches any company domain
- `updateUserAccountType(userId, email)` — Updates user's account type based on their email

### Background Services (`src/hooks.server.ts`)

Three `setInterval`-based background services initialized at startup:

1. **Up Bank Polling** (`src/lib/server/upbank.ts`) — Checks for deposits, matches shortcodes
2. **Deadline Processor** (`src/lib/server/deadline.ts`) — Processes event deadlines, deducts balances
3. **Daily Backup Snapshots** (`src/lib/server/snapshot.ts`) — Performs safe, hot SQLite database snapshots (configurable interval, skips identical copies via hash comparison)

**Graceful Shutdown**:
Registers `SIGINT` and `SIGTERM` OS signal handlers. On shutdown, it immediately sets a flag to reject any new incoming requests with a `503 Service Unavailable` status, clears background intervals, and tracks active requests via SvelteKit's `handle` hook. It awaits their completion with a 5-second timeout, exiting with code `0` on success or code `1` if forced to kill active connections.

### Shared Components (`src/lib/components/`)

#### shadcn-svelte UI Components (`src/lib/components/ui/`)

The project uses [shadcn-svelte](https://shadcn-svelte.com/) for UI primitives. These are installed via CLI and live in `src/lib/components/ui/`:

**Core Components**:

- `button` — Button with href support, dark theme styled (indigo default, gray outline)
- `input` — Input with custom number stepper (+/- buttons)
- `input-group` — Input wrapper with prefix/suffix slots (e.g., `$` prefix)
- `label` — Form label wrapper
- `textarea` — Multi-line text input
- `switch` — Toggle switch
- `field` — Form field wrapper with label integration

**Overlay Components**:

- `calendar` — Calendar grid using bits-ui + @internationalized/date
- `popover` — Popover overlay
- `datetime-picker` — Custom date+time picker with calendar popup (self-contained)

**Display Components**:

- `badge` — Status badge with variants (default, secondary, outline, destructive)
- `select` — Select dropdown
- `separator` — Horizontal divider

#### Application Components

- **EventForm.svelte**: Shared component for event creation and editing. Used by:
  - `/admin/events/new` - Create event page
  - `/events/[id]` - Edit event (admin only)
- **LocalDate.svelte**: Date/time display with relative formatting

### API Integrations

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (hot reload)
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check         # Single run
pnpm check:watch   # Watch mode

# Code quality
pnpm lint          # Prettier (check only)
pnpm format        # Prettier (write)

# Database
pnpm db:push       # Push schema to SQLite (via drizzle-kit)
pnpm db:studio     # Drizzle Studio (DB GUI)
pnpm db:generate   # Generate migration SQL (via drizzle-kit)
pnpm db:migrate    # Apply generated migration SQL (via drizzle-kit)

# Prepare (post-install)
pnpm prepare       # Runs svelte-kit sync

# Docker
pnpm docker:build  # Build Docker container image locally
pnpm docker:run    # Start container mounting ./data and injecting .env files
pnpm docker:stop   # Stops and removes active container
pnpm docker:up     # Sequence command: builds, stops, and starts container
```

### Utility Scripts

Several helper scripts are available under `scripts/` to assist with database setup, user administration, and testing:

#### Reset User Password (`scripts/reset-password.ts`)

Resets or overrides the password of any user locally. Supports interactive selection or command-line arguments:

```bash
# Interactive mode
pnpm reset-password

# Command-line arguments mode
pnpm reset-password <email> <new-password>
```

#### Generate Test Events / Demo Seeder (`scripts/generate-test-events.ts`)

Interactive demo-data seeder for a fresh database. Creates an admin account plus a batch of Company / Plus One member accounts, a handful of events (some past, some upcoming), a recurring weekly series spanning a couple of weeks, and signups on those events — including balance deductions and `signup_deduction` audit transactions on past (locked) events, mirroring the real deadline processor.

Every setting is prompted with a sensible default (press [Enter] to accept):

- **Setup**: reset (wipe) existing demo data first
- **Accounts**: admin name/email/password, company email domain, number of Company and Plus One members, shared member password, per-member starting balance
- **Events**: past / upcoming one-off event counts, weekly recurrences, capacity, duration, deadline (hours before), Company & Plus One pricing, visibility (onlyCompany/public/private)
- **Signups**: whether to create signups and how many per event (0 = every member)

```bash
# Interactive walk-through (defaults in brackets)
pnpm generate-test-events

# Run with all defaults, no prompts
pnpm generate-test-events --yes

# Print the plan without writing anything
pnpm generate-test-events --dry-run

# Plan only, with defaults
pnpm generate-test-events --dry-run --yes
```

Created accounts are credential logins with `emailVerified` set, so they can sign in immediately. Finishes by printing the admin login and member credentials.

#### Credit User Balance (`scripts/add-funds.ts`)

Manually credits a user's account balance, inserting an audited transaction. Supports interactive selection or command-line arguments:

```bash
# Interactive mode
pnpm add-funds

# Command-line arguments mode
pnpm add-funds <email> <amount_in_dollars> [custom_notes]
```

**Required Runtime**: Node.js (>= 22; scripts run via `tsx`)

---

## Code Conventions

### TypeScript

- Strict mode enabled via `tsconfig.json`
- Use `interface` for public APIs, `type` for unions/intersections
- Avoid `any`; use `unknown` and narrow appropriately

### Svelte 5 Patterns

```svelte
<!-- Props with $props() -->
<script lang="ts">
  let { name, count = 0 } = $props<{ name: string; count?: number }>();
</script>

<!-- Reactive state with $state -->
<script lang="ts">
  let expanded = $state(false);
</script>

<!-- Derived values with $derived -->
<script lang="ts">
  let total = $derived(count * price);
</script>
```

### shadcn-svelte Components

Read: https://www.shadcn-svelte.com/llms.txt for full details.

**Adding new components**:

```bash
pnpm dlx shadcn-svelte@latest add <component-name>
```

**Import pattern**: Always use the index.ts re-export:

```typescript
import { Button } from '$lib/components/ui/button/index.js';
import { Input } from '$lib/components/ui/input/index.js';
```

**Dark theme styling**: Components are pre-styled for dark mode. Custom overrides in:

- `src/lib/components/ui/button/button.svelte` - Button variants
- `src/app.css` - Global theme variables and animations

### Server vs Client

- Files named `*.server.ts` — Server-only, never sent to client
- Files named `*.server.ts` in routes — Server-side load functions
- Use `+page.server.ts` for form actions and server-side data fetching

### Database Access

- All DB queries in `src/lib/server/db/` or `+page.server.ts` files
- Use Drizzle ORM for type-safe queries
- Never expose raw SQL to client

### Form Actions

```typescript
// In +page.server.ts
export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		// Handle form submission
	}
};
```

### Error Handling

- Use SvelteKit's `throw redirect()` for navigation
- Return `{ error: string }` from actions for inline errors
- Never expose stack traces to client

---

## Important Files

### Core Backend

| File                          | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `src/lib/server/db/schema.ts` | **Single source of truth** for all DB tables |
| `src/lib/server/auth.ts`      | Auth configuration, session handling         |
| `src/lib/server/upbank.ts`    | Up Bank API integration                      |
| `src/lib/server/deadline.ts`  | Background deadline processing               |
| `src/hooks.server.ts`         | Initializes background services              |

### UI Components

| File                                     | Purpose                                     |
| ---------------------------------------- | ------------------------------------------- |
| `src/lib/components/EventForm.svelte`    | Shared event form (create/edit)             |
| `src/lib/components/ui/button/`          | Button with href support, dark theme styled |
| `src/lib/components/ui/input/`           | Input with custom number stepper (+/-)      |
| `src/lib/components/ui/input-group/`     | Input with prefix/suffix (e.g., `$` prefix) |
| `src/lib/components/ui/datetime-picker/` | Custom calendar popup with time picker      |
| `src/lib/components/ui/` (other)         | shadcn-svelte components (badge, switch...) |

### Configuration

| File                | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `src/lib/types.ts`  | TypeScript enums for status/type/role         |
| `src/app.d.ts`      | TypeScript types for `App.Locals`, `PageData` |
| `src/app.css`       | Tailwind CSS v4 + dark mode + animations      |
| `components.json`   | shadcn-svelte CLI configuration               |
| `svelte.config.js`  | SvelteKit adapter configuration               |
| `vite.config.ts`    | Vite + Tailwind plugin config                 |
| `drizzle.config.ts` | Drizzle ORM configuration                     |

### Entry Points

- **Dev**: `pnpm dev` → Vite dev server
- **Prod**: `pnpm build` → SvelteKit build → standalone server (`build/index.js`) run via `node build/index.js`
- **Migrations**: `pnpm db:migrate` (i.e. `drizzle-kit migrate`) applies the Drizzle journal; the container entrypoint runs it automatically on startup. The `changelog` table and its audit triggers are created by migration `0004`, so the journal is the single source of truth for schema + audit setup.

---

## Runtime & Tooling

### Environment

- **Runtime**: Node.js (required, not Bun)
- **Package Manager**: pnpm (using pnpm-lock.yaml)
- **Dev Shell**: Nix via `devenv.yaml` / `devenv.nix` (recommended)

#### Nix / Devenv Setup on NixOS

This repository is pre-configured with `devenv` and `direnv` to provide a complete, reproducible environment with Node.js, pnpm, Python, GCC, SQLite, and more.

- **For Developers (with direnv)**:
  Once `direnv` is allowed (`direnv allow`), entering the directory will automatically load the correct versions of all tools into your shell.
- **For AI Agents / Non-Interactive Shells**:
  Standard non-interactive terminals (such as those used by AI agents or CI/CD) do not load `direnv` by default. Use either of the following patterns to run commands:
  - **One-off commands**: Prefix your command with `devenv shell -- `:
    ```bash
    devenv shell -- pnpm dev
    ```
  - **Persistent terminal sessions**: Run `eval "$(direnv export bash)"` at the start of the session to load the devenv environment into the active shell process:
    ```bash
    eval "$(direnv export bash)"
    pnpm dev
    ```

### VSCode Extensions (recommended)

```json
// .vscode/extensions.json
["svelte.svelte-vscode", "bradlc.vscode-tailwindcss", "esbenp.prettier-vscode"]
```

### Environment Variables

Required variables (typically in `.env`):

- `DATABASE_PATH` — Path to SQLite database file (defaults to `local.db`, `/app/data/local.db` in Docker)
- `BETTER_AUTH_SECRET` — For session security.
- `BETTER_AUTH_URL` — Base URL of the auth endpoints.
- `UP_BANK_API_KEY` — Up Bank API credentials.
- `RESEND_API_KEY` — Resend API key for transaction/reminder emails.
- `EXPORT_SECRET_TOKEN` — Security token for transactions export API.

### Docker Containerization

Gbookminton is containerized using a highly optimized, two-stage Docker architecture:
- **Build Stage**: Uses `node:22-slim` with pnpm to download dependencies (including `drizzle-kit`, which ships in the production image so migrations can run at startup) and run the production build (`pnpm build`).
- **Run Stage**: Uses `node:22-slim` for minimal size. Runs strictly under the non-root `node` user (UID/GID 1000) for security.
- **Entrypoint**: Applies migrations automatically (`pnpm exec drizzle-kit migrate`, using `DATABASE_PATH` from the environment via `drizzle.config.ts`) on startup before launching SvelteKit (`exec node build/index.js`).

### Docker Compose & Security Hardening (`docker-compose.yml`)

The application is deployed using Docker Compose with extensive production security constraints:
* **gVisor Sandbox Runtime**: Configured with `runtime: runsc` to execute the application within a highly secure sandbox kernel, isolating container execution from the host OS kernel.
* **Signal Forwarding (Init)**: Configured with `init: true` to run Docker's built-in `tini` as PID 1, ensuring OS signals (`SIGINT`/`SIGTERM`) are correctly propagated to the child Node server process.
* **Non-Root Execution**: Runs as user `1000:1000` (matching the host user and container `node` user) to prevent root escalation and solve SQLite filesystem permission issues.
* **Read-Only Root Filesystem**: Mounted with `read_only: true` to block any runtime file tampering.
* **Linux Capabilities Dropped**: Drops all kernel capabilities (`cap_drop: [ALL]`).
* **No Privilege Escalation**: Restricts binary escalation (`security_opt: [no-new-privileges:true]`).
* **Writable Tmpfs**: Maps `/tmp` to a temporary in-memory write space for server logging/processing.
* **Resource Limits**: Caps limits at 1.0 CPU cores and 512MB RAM.

**Container Deployment Commands:**
```bash
# Build the image via Compose
pnpm docker:build  # Or: docker compose build

# Start the container detached
pnpm docker:run    # Or: docker compose up -d

# Stop and remove container
pnpm docker:stop   # Or: docker compose down

# Fast Build & Up (Recommended)
pnpm docker:up     # Or: docker compose up -d --build
```

---

## Testing & QA

**Status**: No testing infrastructure currently exists.

- No test directories (`test/`, `tests/`, `__tests__/`, `spec/`)
- No test scripts in `package.json`
- No Jest, Vitest, or other test framework configuration
- No test files (`*.test.ts`, `*.spec.ts`)

**Note**: This is a known gap. When adding tests, consider:

- Vitest (already a transitive dep via `better-auth`)
- Playwright for E2E (SvelteKit recommends)
- Unit tests for server utilities (`src/lib/server/`)

---

## Architecture Notes

### Privacy-Aware Event Visibility

Event details (`/events/[id]`) show different information based on:

- User authentication status
- User role (admin vs regular user)
- Event visibility settings

### Event Templates & Duplication

Admin users can build new events based on existing ones:

- **Template Selection**: On the create event screen (`/admin/events/new`), admins can select any past or current event from a dropdown. This reloads the page with `?templateId=<id>` to pre-populate all event settings (title, duration, capacity, pricing, description, visibility, and location).
- **Duplication**: On the event details screen (`/events/[id]`), admin users are presented with a "Duplicate" button next to "Edit Event" which redirects directly to the create screen pre-populated with that event's details.
- **Date Shifting**: The template's date and withdrawal deadline are automatically shifted forward by **exactly +1 week (+7 days)** by default to streamline scheduling weekly recurring matches.

### Balance-Based Access Control

- Users maintain a `balance` field
- Event signup may deduct balance at deadline
- Up Bank integration allows automated top-ups via shortcodes

### Background Services

Two persistent processes run via `setInterval` in `hooks.server.ts`:

1. **Up Bank Polling**: Every ~60 seconds, checks for new deposits
2. **Deadline Processing**: Checks event deadlines, deducts balances, sends reminders

---

## Common Patterns

### Route Protection

```typescript
// +page.server.ts
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.session) {
		throw redirect(303, '/signup');
	}
	return { user: locals.user };
};
```

### Admin-Only Routes

```typescript
// In load function or hooks
if (locals.user?.role !== 'admin') {
	throw redirect(303, '/dashboard');
}
```

### Form with Server Action

```svelte
<form method="POST" action="?/signup">
	<button>Sign Up</button>
</form>
```

### Component Props

```svelte
<!-- LocalDate.svelte pattern -->
<script lang="ts">
	let { date }: { date: Date | string } = $props();
</script>
```
