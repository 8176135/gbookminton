# Repository Guidelines

**Project**: Gbookminton  
**Type**: SvelteKit 5 Application (Bun + SQLite)  
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
| Framework | SvelteKit 5 (SSR + client)            |
| Runtime   | Bun                                   |
| Database  | SQLite via `bun:sqlite` + Drizzle ORM |
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
│   │   │   ├── index.ts   # Database connection (bun:sqlite)
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
└── app.css               # Global styles (Tailwind)
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
- `transaction` — Balance change ledger (enum values: deposit/deduction)
- `companyDomain` — Configurable email domains for auto-classifying users as Company type

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
	Deposit = 'deposit',
	Deduction = 'deduction'
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

Two `setInterval`-based background services initialized at startup:

1. **Up Bank Polling** (`src/lib/server/upbank.ts`) — Checks for deposits, matches shortcodes
2. **Deadline Processor** (`src/lib/server/deadline.ts`) — Processes event deadlines, deducts balances

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
# Install dependencies (Bun)
bun install

# Development server (hot reload)
bun run dev

# Production build
bun run build

# Preview production build
bun run preview

# Type checking
bun run check         # Single run
bun run check:watch   # Watch mode

# Code quality
bun run lint          # ESLint
bun run format        # Prettier

# Database
bun run db:push       # Push schema to SQLite (via drizzle-kit)
bun run db:studio     # Drizzle Studio (DB GUI)
bun run migrate       # Run migrations

# Prepare (post-install)
bun run prepare       # Runs svelte-kit sync
```

**Required Runtime**: Bun (not Node.js)

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

**Adding new components**:

```bash
bunx shadcn-svelte@latest add <component-name>
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

- **Dev**: `bun run dev` → Vite dev server
- **Prod**: `bun run build` → SvelteKit build → `node build`
- **Migrations**: `bun migrate.ts` for database setup

---

## Runtime & Tooling

### Environment

- **Runtime**: Bun (required, not Node.js)
- **Package Manager**: pnpm (based on pnpm-lock.yaml presence)
- **Dev Shell**: Nix via `devenv.yaml` (optional but recommended)

### VSCode Extensions (recommended)

```json
// .vscode/extensions.json
["svelte.svelte-vscode", "bradlc.vscode-tailwindcss", "esbenp.prettier-vscode"]
```

### Environment Variables

Required variables (typically in `.env`):

- `DATABASE_URL` or SQLite file path
- Up Bank API credentials
- Resend API key
- Auth secret

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
