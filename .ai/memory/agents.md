# Antigravity/Ralph - Long Term Memory (`agents.md`)

This file contains architectural rules, patterns, and "gotchas" for the **tim3** project. All agents must read this before writing code.

## 1. Core Tech Stack

* **Framework**: Next.js 14+ (App Router). Use `app/` directory.
* **Database**: Supabase (PostgreSQL).
  * **Local Dev**: Use Docker. `npx supabase start`.
  * **Migrations**: Always create migrations for schema changes. `npx supabase migration new <name>`.
* **UI**: Tailwind CSS + Shadcn UI (`@kit/ui`).
  * **Styling**: Use utility classes. Avoid CSS modules unless necessary for complex animations.
* **State**: React Query for server state, Context/Zustand for complex local state.

## 2. Architecture Patterns

* **Layered Database**:
  * `public.tables` like `accounts`, `memberships` are **SaaS Layer** (MakerKit). Do not modify lightly.
  * `public.tables` like `employees`, `programs`, `availability_*` are **Business Layer** (tim3). Owned by us.
* **Server Actions**: Use Server Actions for mutations (`POST`, `PUT`, `DELETE`).
* **Client Components**: Push `use client` down the tree. Keep pages as Server Components where possible.

## 3. "Gotchas" & Rules

* **RLS**: Always enable RLS on new tables.
* **TypeScript**: strict mode is ON. No `any`. Define interfaces in `packages/features/tim3/src/types`.
* **Imports**: Use absolute imports (e.g., `import { Button } from '@kit/ui'`).
* **Testing**: We use Vitest. Run `Expected` tests before committing.

## 4. Workflows

* **Ralph Loop**: Read `TASKS.jsonl`. Execute atomic task. Update status.
