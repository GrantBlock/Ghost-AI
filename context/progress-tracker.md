# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
- Feature 09 (Share Dialog) — complete

## Current Goal
- Next feature per context/feature-specs/00-feature-list.md (canvas / Liveblocks room at /editor/[roomId])

## Completed

- Feature 01: Design System — shadcn/ui (base-nova, Tailwind v4) initialized; Button/Card/Dialog/Input/Tabs/Textarea/ScrollArea added to components/ui/; lucide-react installed; lib/utils.ts exports cn() built on clsx + tailwind-merge. globals.css is dark-only: project tokens from ui-context.md (--bg-*, --border-*, --text-*, --accent-*, --state-*) with Tailwind aliases (bg-base, text-copy-primary, border-surface-border, text-brand, ...), shadcn tokens mapped onto them, and <html class="dark"> so generated dark: variants always apply. Only change to generated ui files: the import `from "cn"` was corrected to `from "@/lib/utils"` (the CLI wrote the unrelated npm package "cn", which was removed). tsc, lint and build pass.

- Feature 02: Editor Chrome — added components/editor/editor-navbar.tsx (fixed-height navbar, left/center/right sections, sidebar toggle using PanelLeftOpen/PanelLeftClose, right empty), components/editor/project-sidebar.tsx (floating absolute overlay that slides in from the left without pushing content, `isOpen` prop, Projects header + close button, shadcn Tabs "My projects"/"Shared" with empty placeholders, full-width New Project button with Plus icon), and components/editor/editor-dialog.tsx (reusable dialog pattern: title, description, body, footer actions; token-styled, rounded-3xl). No actual dialogs built yet; components are not yet mounted in a route.

- Feature 03: Auth — @clerk/ui installed. ClerkProvider in app/layout.tsx (wrapped in Suspense, required by cacheComponents) uses `clerkAppearance` from lib/clerk-appearance.ts (Clerk `dark` theme + variables mapped to app CSS vars, no hardcoded colors). Sign-in/sign-up pages use components/auth/auth-shell.tsx (two-panel on lg: logo, tagline, text-only feature list | centered Clerk form; form only on small screens). proxy.ts protects all routes except sign-in/sign-up (paths read from NEXT_PUBLIC_CLERK_SIGN_IN_URL / SIGN_UP_URL). `/` redirects to /editor when signed in, else /sign-in. EditorNavbar right section now renders UserButton. Added a minimal app/editor/page.tsx mounting navbar + sidebar so the redirect target exists. `npm run build` passes.

- Feature 04: Project Dialogs — /editor home (heading, description, New Project button with Plus; no cards). hooks/use-project-dialogs.ts owns dialog, form and loading state plus a mock project list (lib/projects.ts: Project type, slugify, MOCK_PROJECTS; mock 400ms latency, no API/persistence). components/editor/project-dialogs.tsx renders Create (name input + live slug preview), Rename (prefilled, current name in description, autofocus, Enter submits) and Delete (destructive confirm only) on top of EditorDialog. ProjectSidebar now lists projects with rename/delete actions for owned projects only (hidden for shared), a New Project button wired to Create, and a mobile backdrop scrim that closes the sidebar on tap. Replaced the earlier standalone create-project-dialog.tsx. tsc and eslint pass.

- Feature 05: Prisma — prisma/schema.prisma (generator `prisma-client` -> app/generated/prisma, postgresql datasource) plus prisma/models/project.prisma: `ProjectStatus` enum (DRAFT, ARCHIVED), `Project` (ownerId = Clerk user id, name, optional description, status, canvasJsonPath, timestamps; indexes on ownerId and createdAt) and `ProjectCollaborator` (cascade-delete relation to Project, email, createdAt; unique [projectId, email]; indexes on email and [projectId, createdAt]). lib/prisma.ts is a cached singleton (cached on globalThis outside production): `prisma+postgres://` URLs use Accelerate, anything else uses @prisma/adapter-pg. First migration `init` applied to Prisma Postgres; client generated; tsc and `npm run build` pass. Not yet wired to the UI (projects are still mock data from lib/projects.ts).

- Feature 06: Project APIs — app/api/projects/route.ts with GET (list caller's projects, newest first), POST (create; missing/blank name defaults to "untitled-project"; id via schema cuid()), PATCH (rename, body {id, name}) and DELETE (body {id}). ownerId is the Clerk userId. Unauthenticated -> 401, non-owner rename/delete -> 403, unknown id -> 404, bad input -> 400; consistent `{ error }` JSON. proxy.ts now skips auth.protect() for /api routes (it would return 404 to unauthenticated API calls), so handlers enforce auth themselves. Backend only; UI still uses mock projects. `npm run build` passes.

- Feature 07: Wire Editor — /editor is a server component (Suspense + `getUserProjects()` in lib/project-data.ts: owned projects, plus shared projects matched by the user's Clerk emails against ProjectCollaborator, case-insensitive) passing both lists to the client `EditorShell` (navbar, sidebar, dialogs; components/editor/editor-shell.tsx, editor-home.tsx). hooks/use-project-actions.ts replaces the mock use-project-dialogs.ts: create (short random suffix generated when the dialog opens, `buildRoomId` = slugify(name)-suffix, POST /api/projects with {id, name}, then router.push to /editor/{id}), rename (stores target id + name, PATCH /api/projects/[id], router.refresh), delete (DELETE /api/projects/[id]; router.replace("/editor") when on that workspace, else refresh); API errors are shown in the dialogs. Create dialog previews the room ID. Backend changes: POST /api/projects now accepts an optional `id` (lowercase slug pattern, 409 if taken) so project ID == Liveblocks room ID; new app/api/projects/[id]/route.ts (PATCH/DELETE, same owner checks); shared helpers moved to lib/project-api.ts; the body-based PATCH/DELETE on /api/projects remain. Added a placeholder app/editor/[projectId]/page.tsx (shows name + room ID, notFound() without access) so create has somewhere to navigate. lib/projects.ts: MOCK_PROJECTS and Project.slug removed. tsc, eslint and `npm run build` pass; not exercised against a live signed-in session.

- Feature 08: Editor Workspace Shell — route renamed to app/editor/[roomId]/page.tsx (server component): redirects unauthenticated users to /sign-in, renders new components/editor/access-denied.tsx (centered, lock icon, message, link back to /editor) for both missing and unauthorized projects. lib/project-access.ts holds `getCurrentIdentity()` (Clerk userId + primary email + verified flag) and `getProjectIfAccessible(id, identity)` (owner, or collaborator by case-insensitive verified primary email; null otherwise). EditorShell takes an optional `projectName`; when set it renders the workspace layout: navbar with project name, Share button (no behavior yet) and AI sidebar toggle, the existing ProjectSidebar (current room highlighted via pathname), a canvas placeholder filling remaining space, and a collapsible right AI sidebar placeholder (open by default). No canvas, Liveblocks, AI chat or sharing logic. tsc and `npm run build` pass; not exercised in a live signed-in session.

- Feature 09: Share Dialog — the navbar Share button now opens `components/editor/share-dialog.tsx` (EditorDialog-based; state in hooks/use-project-share.ts). Owners can invite by email, see collaborators, remove them, and copy the project link (`/editor/{id}`; button shows "Copied!" for 2s). Collaborators see the list and Copy link only (no invite form or remove buttons). API: app/api/projects/[id]/collaborators/route.ts — GET (owner or collaborator), POST {email} and DELETE {email} (owner only, enforced server-side via `authorizeOwner`; 401/403/404/400/409 with `{ error }`). POST lowercases emails, validates shape, rejects the owner's own email and duplicates (case-insensitive). lib/project-collaborators.ts lists collaborators and enriches them via Clerk Backend API (`users.getUserList({ emailAddress })`) with display name + avatar; unmatched emails (or a Clerk failure) fall back to email only. No local user table. `EditorShell` gained `projectId` / `isOwner` props (passed from the [roomId] page); `EditorNavbar` gained `onShare`. tsc, eslint and `npm run build` pass; not exercised in a live signed-in session. Note: invited users who don't have a Clerk account yet gain access after signing up with the invited (verified) email.

## In Progress

- None.

## Next Up
- Next feature per context/feature-specs/00-feature-list.md (canvas workspace at /editor/[projectId]; Liveblocks room = project ID).

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
- Prisma 7.10.1 (CLI, client and adapter pinned to v7; v8 is still a release candidate) — generated client goes to app/generated/prisma/; import PrismaClient from @/app/generated/prisma/client (no index.ts in v7). lib/prisma.ts passes { accelerateUrl } for prisma+postgres:// URLs and { adapter: new PrismaPg(...) } (@prisma/adapter-pg) for all other URLs.
- The Prisma CLI loads prisma7.config.ts (it takes precedence over prisma.config.ts, so only that file exists). It uses schema: "prisma" (multi-file schema) and reads DATABASE_URL from .env.local then .env via dotenv. DATABASE_URL is the pooled Prisma Postgres URL; `prisma migrate dev` did not generate the client here, so run `npx prisma generate` afterwards.

- CodeRabbit PR #1 follow-up: project API now validates name/id types and maps Prisma P2002/P2025 to 409/404; shared-project lookup uses verified emails only; AuthShell has the large-screen left panel; Tabs forwards orientation; ProjectSidebar onClose is required; context docs and CLAUDE.md Trigger.dev reference corrected.
