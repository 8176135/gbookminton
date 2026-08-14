# Gbookminton

A premium membership and tournament management system for badminton/pickleball groups.

## 🚀 Tech Stack

- **Framework**: [SvelteKit 5](https://svelte.dev/)
- **Runtime**: [Node.js](https://nodejs.org/) (>= 22)
- **Database**: [SQLite](https://www.sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [BetterAuth](https://better-auth.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Email**: [Resend](https://resend.com/) (for verification and notifications)
- **Finance**: [Up Bank API](https://developer.up.com.au/) (integrated for automated payment tracking)

## 🏗️ Architecture

### 1. Database & Schema (`src/lib/server/db`)

The system uses a highly structured Drizzle schema to manage users, sessions, events, and registrations.

- `schema.ts`: Defines the unified types for users (with custom `role`, `balance`, and `shortCode` fields), events, and event registrations.
  - Events carry an `isPrivate` flag; when set, non-admin users can only see registration **counts** (not names) on the event detail page.
- `index.ts`: Handles the database connection using `better-sqlite3`.

### 2. Authentication (`src/lib/server/auth.ts`)

Powered by **BetterAuth**, providing secure email/password authentication with:

- Custom user fields (Role-based access).
- Email verification via Resend.
- **Account Management**: Users can update their display name and change their password.
- **Forgot Password**: Secure password reset flow with email links.
- Database-backed sessions.

### 3. Background Services (`src/hooks.server.ts`)

The server utilizes SvelteKit hooks to run essential background tasks:

- **Up Bank Polling**: Regularly checks the Up Bank API for incoming transactions filtered by specific reference codes (shortcodes) to automatically update user balances.
- **Deadline Processing**: Periodically checks for event deadlines to lock in registrations and handle waitlist promotion.

### 4. Event Detail Page (`src/routes/(app)/events/[id]`)

A **shared, role-aware** event detail page accessible to all logged-in users:

- **Public users** see the event details, the attendee list (names only, no emails), and their own signup status.
- **Private events** (`isPrivate = true`): non-admins only see the registered/waitlist _counts_ — individual names are hidden.
- **Admins** see full attendee details (including emails and withdrawn users) plus an inline **Edit Event** panel where all event fields (title, date, location, description, capacity, cost, deadline, and privacy) can be updated without leaving the page.

### 5. UI/UX Design System

The application features a modern, premium aesthetic:

- **Style**: Dark mode by default with deep indigo/slate color palette.
- **Glassmorphism**: Extensive use of backdrop blurs and subtle borders for a transparent, layered feel.
- **Typography**: Uses **Outfit** and **Inter** for a clean, professional look.
- **Responsive**: Fully optimized for mobile and desktop dashboards.

## 📂 Project Structure

- `src/routes`: SvelteKit's file-based routing.
  - `(app)`: Protected application routes requiring a valid session.
    - `dashboard`: User dashboard with event cards. Event titles link to the detail page.
    - `events/[id]`: Public (role-aware) event detail page — attendee management and admin editing.
    - `admin`: Admin-only overview and management.
    - `admin/events/new`: Create a new event (including privacy setting).
  - `signup`, `login`: Auth entry points.
  - `api/auth`: BetterAuth backend integration.
- `src/lib/server`: Secure server-side utilities (Database, Auth, External APIs).
- `static/`: Public assets and configuration (`robots.txt`).

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22 installed cleanly on your system.
- [pnpm](https://pnpm.io/) (uses the version pinned in `packageManager`).

### Install & Sync

```bash
pnpm install
pnpm prepare        # Runs svelte-kit sync
```

### Database Management

```bash
pnpm db:push       # Push schema to SQLite
pnpm db:studio     # Open DB explorer
pnpm db:setup      # Full programmatic setup (migrations + changelog triggers)
```

### Run Server

```bash
pnpm dev
```

## 🔐 Configuration

Ensure you have the following environment variables in your `.env`:

- `BETTER_AUTH_SECRET`: For session security.
- `RESEND_API_KEY`: For auth emails.
- `UP_BANK_API_KEY`: For transaction tracking.

## 🐳 Docker Deployment

Gbookminton is containerized using a multi-stage Docker build optimized for SvelteKit, Node.js, and SQLite, running under a highly locked-down Docker Compose architecture. 

The container is hardened with state-of-the-art security settings:
* **Non-Root User Execution**: Runs as user `1000:1000` (matching the `node` user in the container and the default UID on host platforms) to ensure secure file permissions and eliminate host-escalation vulnerabilities.
* **Read-Only Root Filesystem**: The container OS filesystem is mounted as read-only (`read_only: true`), preventing any malicious runtime modifications to SvelteKit or server binaries.
* **Dropped Capabilities**: Drops all default Linux kernel privileges (`cap_drop: [ALL]`) since no root-level functions are required.
* **Privilege Escalation Blocked**: Prevents child processes from obtaining new privileges (`security_opt: [no-new-privileges:true]`).
* **Resource Constraints**: Limits CPU and memory consumption to prevent DoS exploits.

### 🚀 Easiest Way: Single Command Up

To automatically build the image, configure container security constraints, load environmental variables from `.env`, and start the application in detached mode:
```bash
pnpm docker:up
```

---

### Step-by-Step Commands

If you prefer to run commands individually, you can use the following scripts:

#### 1. Build the Container Image
```bash
pnpm docker:build
# Or raw command: docker compose build
```

#### 2. Run the Container (Detached)
This launches the container using the security profiles defined in `docker-compose.yml`, binds the local `./data` directory for SQLite persistence, and loads `.env` variables.
```bash
pnpm docker:run
# Or raw command: docker compose up -d
```

#### 3. Stop and Remove the Container
This gracefully shuts down the container, stops the server, and cleans up temporary resources.
```bash
pnpm docker:stop
# Or raw command: docker compose down
```

### 3. Database Migrations

Database migrations are executed **automatically on startup** inside the container before the web server launches (using the programmatic `src/migrate.ts` script). You do not need to run migrations manually.

### 4. Configuration Variables

The following environment variables can be customized in your `.env` file:

| Variable              | Default Value        | Description                                                       |
| --------------------- | -------------------- | ----------------------------------------------------------------- |
| `PORT`                | `3000`               | The port SvelteKit listens on inside the container.               |
| `DATABASE_PATH`       | `/app/data/local.db` | The path to the SQLite file. Mount your volume here.              |
| `BETTER_AUTH_SECRET`  | _(Required)_         | Secret key used for signing session tokens.                       |
| `BETTER_AUTH_URL`     | _(Required)_         | The public URL of the app (e.g. `https://gbookminton.com`).       |
| `RESEND_API_KEY`      | _(Required)_         | API key for transaction and notification emails.                  |
| `UP_BANK_API_KEY`     | _(Required)_         | API key for Up Bank polling.                                      |
| `EXPORT_SECRET_TOKEN` | _(Required)_         | Secret token to secure the Google Sheets transactions export API. |
