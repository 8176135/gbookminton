# Gookminton

A premium membership and tournament management system for badminton/pickleball groups.

## 🚀 Tech Stack

- **Framework**: [SvelteKit 5](https://svelte.dev/)
- **Runtime**: [Bun](https://bun.sh/)
- **Database**: [SQLite](https://www.sqlite.org/) via [`bun:sqlite`](https://bun.sh/docs/api/sqlite)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [BetterAuth](https://better-auth.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Email**: [Resend](https://resend.com/) (for verification and notifications)
- **Finance**: [Up Bank API](https://developer.up.com.au/) (integrated for automated payment tracking)

## 🏗️ Architecture

### 1. Database & Schema (`src/lib/server/db`)
The system uses a highly structured Drizzle schema to manage users, sessions, events, and registrations.
- `schema.ts`: Defines the unified types for users (with custom `role`, `balance`, and `shortCode` fields), events, and event registrations.
- `index.ts`: Handles the database connection using `bun:sqlite`.

### 2. Authentication (`src/lib/server/auth.ts`)
Powered by **BetterAuth**, providing secure email/password authentication with:
- Custom user fields (Role-based access).
- Email verification via Resend.
- Database-backed sessions.

### 3. Background Services (`src/hooks.server.ts`)
The server utilizes SvelteKit hooks to run essential background tasks:
- **Up Bank Polling**: Regularly checks the Up Bank API for incoming transactions filtered by specific reference codes (shortcodes) to automatically update user balances.
- **Deadline Processing**: Periodically checks for event deadlines to lock in registrations and handle waitlist promotion.

### 4. UI/UX Design System
The application features a modern, premium aesthetic:
- **Style**: Dark mode by default with deep indigo/slate color palette.
- **Glassmorphism**: Extensive use of backdrop blurs and subtle borders for a transparent, layered feel.
- **Typography**: Uses **Outfit** and **Inter** for a clean, professional look.
- **Responsive**: Fully optimized for mobile and desktop dashboards.

## 📂 Project Structure

- `src/routes`: SvelteKit's file-based routing.
  - `(app)`: Protected application routes (Admin/Dashboard).
  - `signup`, `login`: Auth entry points.
  - `api/auth`: BetterAuth backend integration.
- `src/lib/server`: Secure server-side utilities (Database, Auth, External APIs).
- `static/`: Public assets and configuration (`robots.txt`).

## 🛠️ Development

### Prerequisites
- [Bun](https://bun.sh/) installed cleanly on your system.

### Install & Sync
```bash
bun install
bunx svelte-kit sync
```

### Database Management
```bash
bunx drizzle-kit push  # Update schema
bunx drizzle-kit studio # Open DB explorer
```

### Run Server
```bash
bun dev
# For full Bun integration
bun --bun run dev
```

## 🔐 Configuration
Ensure you have the following environment variables in your `.env`:
- `BETTER_AUTH_SECRET`: For session security.
- `RESEND_API_KEY`: For auth emails.
- `UP_BANK_API_KEY`: For transaction tracking.
