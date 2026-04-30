# Todolish - LINE Connected To-Do List

Full-stack To-Do List Web Application built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase, and LINE Messaging API.

## Features

- **Minimal Modern UI** with pastel gradients, Framer Motion animations, and micro-interactions
- **Hash Navigation** (`/#dashboard`, `/#rank`, `/#list`) within the Todolist page
- **Dashboard** with stats cards, progress bar, and Recharts pie chart
- **Leaderboard** with user rankings and points
- **LINE Bot Integration** supporting Thai and English commands:
  - `เพิ่ม/add [ชื่อ]` - Create Todo
  - `ลบ/delete [เลข]` - Delete Todo
  - `รายการ/list` - List Todos
  - `เช็ค/done [เลข]` - Complete Todo (+points)
  - `คะแนน/point` - Show points
  - `ช่วยเหลือ/help` - Show help
- **Notification System** via Vercel Cron (`/api/cron/notify`) sends LINE push messages 15 minutes before due date
- **Toast Notifications** with Sonner

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui components
- Framer Motion animations
- Recharts charts
- Supabase (PostgreSQL + Row Level Security)
- LINE Messaging API (`@line/bot-sdk`)

## Project Structure

```
app/
  page.tsx              # Home (Hero + Stats)
  todolist/
    page.tsx            # Todolist with Hash Navigation
  api/
    todos/route.ts      # Todo CRUD API
    rank/route.ts       # Leaderboard API
    line/webhook/       # LINE Bot Webhook
    cron/notify/        # Vercel Cron Job
components/
  ui/                   # shadcn/ui components
  navbar.tsx
  todo-list.tsx
  todo-form.tsx
  dashboard.tsx
  rank-board.tsx
lib/
  supabase.ts           # Supabase clients + helpers
  line.ts               # LINE API helpers
  utils.ts              # cn() utility
types/
  index.ts              # TypeScript types
supabase/
  schema.sql            # Database schema + RLS
```

## Environment Variables

Copy `env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Run the SQL in `supabase/schema.sql` in the SQL Editor
   - Copy your project URL and anon/service role keys to `.env.local`

3. **Set up LINE Bot:**
   - Create a Messaging API channel in [LINE Developers](https://developers.line.biz/)
   - Set the Webhook URL to `https://your-domain.com/api/line/webhook`
   - Enable webhook and auto-reply
   - Copy Channel Access Token and Channel Secret to `.env.local`

4. **Run locally:**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel:**
   - Connect your GitHub repo to Vercel
   - Add environment variables in Vercel Dashboard
   - The `vercel.json` cron job runs every 1 minute for notifications

## Database Schema

### users
| Column | Type |
|--------|------|
| id | UUID (PK) |
| line_user_id | TEXT (unique) |
| display_name | TEXT |
| picture_url | TEXT |
| total_points | INTEGER |
| created_at | TIMESTAMPTZ |

### todos
| Column | Type |
|--------|------|
| id | UUID (PK) |
| user_id | UUID (FK) |
| title | TEXT |
| description | TEXT |
| due_date | TIMESTAMPTZ |
| priority | INTEGER (1-3) |
| status | TEXT (pending/completed) |
| points_reward | INTEGER |
| is_notified | BOOLEAN |
| created_at | TIMESTAMPTZ |

### todo_logs
| Column | Type |
|--------|------|
| id | UUID (PK) |
| todo_id | UUID (FK) |
| user_id | UUID (FK) |
| action | TEXT |
| created_at | TIMESTAMPTZ |

## License

MIT
