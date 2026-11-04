# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
- Feature 02 (Editor Chrome) — complete

## Current Goal
- Next feature per context/feature-specs/00-feature-list.md

## Completed

- Feature 01: Design System — shadcn/ui (base-nova, Tailwind v4) initialized; Button/Card/Dialog/Input/Tabs/Textarea/ScrollArea added to components/ui/; lucide-react installed; lib/utils.ts exports cn() built on clsx + tailwind-merge. globals.css is dark-only: project tokens from ui-context.md (--bg-*, --border-*, --text-*, --accent-*, --state-*) with Tailwind aliases (bg-base, text-copy-primary, border-surface-border, text-brand, ...), shadcn tokens mapped onto them, and <html class="dark"> so generated dark: variants always apply. Only change to generated ui files: the import `from "cn"` was corrected to `from "@/lib/utils"` (the CLI wrote the unrelated npm package "cn", which was removed). tsc, lint and build pass.

- Feature 02: Editor Chrome — added components/editor/editor-navbar.tsx (fixed-height navbar, left/center/right sections, sidebar toggle using PanelLeftOpen/PanelLeftClose, right empty), components/editor/project-sidebar.tsx (floating absolute overlay that slides in from the left without pushing content, `isOpen` prop, Projects header + close button, shadcn Tabs "My projects"/"Shared" with empty placeholders, full-width New Project button with Plus icon), and components/editor/editor-dialog.tsx (reusable dialog pattern: title, description, body, footer actions; token-styled, rounded-3xl). No actual dialogs built yet; components are not yet mounted in a route.

## In Progress

- None.

## Next Up
- Feature 03 (see context/feature-specs/00-feature-list.md)

## Open Questions

- None yet.

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via @theme inline in globals.css, no tailwind.config.js).
- Dark-only theme: all shadcn :root variables are dark values mapped onto the project tokens; `<html class="dark">` is set permanently so generated `dark:` variants always apply (no theme switching).
- Do not modify generated components/ui/* files after shadcn installation (sole exception: the `cn` import was repointed to `@/lib/utils`).
- Next.js 16 uses proxy.ts (not middleware.ts) — same API, renamed to reflect its purpose.

## Session Notes

- Using Next.js 16.2.4 with React 19 and Tailwind CSS v4.
- shadcn ^4.23.0 (style base-nova, built on @base-ui/react) was used; it auto-detected Tailwind v4. `cn()` uses clsx + tailwind-merge.
- lucide-react ^1.67.0 installed as a direct dependency.
- Node is installed at C:\Program Files\nodejs but was not on PATH in the tool shells; prepend it to PATH before running npm/npx.
- @clerk/nextjs ^7.2.7 and @clerk/ui ^1.6.7 installed.
- @liveblocks/node installed alongside existing @liveblocks/client, @liveblocks/react, @liveblocks/react-flow, @liveblocks/react-ui. Liveblocks client uses lazy init (getLiveblocks()) to avoid key validation errors at build time.
- @vercel/blob ^2.3.3 installed. BLOB_READ_WRITE_TOKEN set in .env.local.
- @trigger.dev/sdk ^4.4.4 installed. trigger.config.ts reads project ref from TRIGGER_PROJECT_REF env var. TRIGGER_SECRET_KEY must be set in .env.local for triggering tasks from server code. Run `npx trigger.dev@latest dev` for local development; deploy with `npx trigger.dev@latest deploy`.
- Prisma 7.8.0 — generated client goes to app/generated/prisma/; import PrismaClient from @/app/generated/prisma/client (no index.ts in v7). Constructor always requires { adapter } argument. @prisma/adapter-pg used for all connections.
- prisma.config.ts uses schema: "prisma/" (multi-file schema) and reads DATABASE_URL from .env via dotenv.
