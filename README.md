# Collaborative Task Board

Real-time Kanban board powered by Next.js + Supabase.

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
2. Run the SQL files in Supabase: `supabase/schema.sql` first, then `supabase/policies.sql`
3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **shadcn/ui** (latest) for UI components
- **Supabase** for auth, database, real-time, and presence
- **@dnd-kit** for drag-and-drop

## Features

- Email/password & Google OAuth authentication
- Real-time collaborative Kanban board
- Drag-and-drop cards with optimistic UI
- Role-based access control (Owner / Admin / Member / Viewer)
- Invite flow with magic token links
- Online presence tracking
- Board settings & member management
