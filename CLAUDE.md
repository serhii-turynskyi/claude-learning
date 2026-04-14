# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup

```bash
npm run setup        # Install deps, generate Prisma client, run migrations
```

Add `ANTHROPIC_API_KEY` to `.env` to enable real AI generation. Without it, the app uses a `MockLanguageModel` that returns sample components.

## Commands

```bash
npm run dev          # Start dev server with Turbopack at localhost:3000
npm run build        # Production build
npm test             # Run all tests (Vitest)
npm test -- --watch  # Watch mode
npm run db:reset     # Reset database (destructive)
npx prisma migrate dev   # Apply schema changes
npx prisma generate      # Regenerate Prisma client after schema changes
```

Note: All scripts require `NODE_OPTIONS='--require ./node-compat.cjs'` (already included in package.json scripts).

## Architecture

UIGen is a Next.js 15 app (App Router) that lets users describe React components in a chat, then generates, previews, and edits them live.

### Key data flows

**Chat → AI → File System → Preview:**
1. User types in `ChatInterface` → `ChatContext` sends message + serialized virtual FS to `/api/chat`
2. `/api/chat/route.ts` calls Claude (claude-haiku-4-5) via `streamText` with two tools: `str_replace_editor` (create/edit files) and `file_manager` (rename/delete)
3. Tool calls update the `VirtualFileSystem` (in-memory only, no disk I/O) via `FileSystemContext`
4. `PreviewFrame` detects entry point (App.jsx/tsx or index.jsx/tsx), transpiles JSX with Babel standalone in an iframe, and renders live

**Authentication:**
- JWT sessions via `jose` stored in httpOnly cookie `auth-token` (7-day expiry)
- `src/middleware.ts` protects `/api/projects` and `/api/filesystem`
- Anonymous users can use the app; projects persist only for authenticated users

**Persistence:**
- SQLite via Prisma. `Project.messages` and `Project.data` are JSON strings (serialized chat history and file system)
- On each AI response finish, `/api/chat` saves the project to DB if user is authenticated

### Module map

| Path | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | AI streaming endpoint; tool definitions; project save |
| `src/lib/contexts/chat-context.tsx` | Client-side chat state using `@ai-sdk/react` |
| `src/lib/contexts/file-system-context.tsx` | In-memory virtual FS state and operations |
| `src/lib/file-system.ts` | `VirtualFileSystem` class (tree operations, serialize/deserialize) |
| `src/lib/provider.ts` | Returns real Anthropic model or `MockLanguageModel` based on API key |
| `src/lib/prompts/generation.tsx` | System prompt given to Claude |
| `src/lib/tools/` | Tool implementations for `str_replace_editor` and `file_manager` |
| `src/lib/transform/` | JSX → preview HTML transformation using Babel standalone |
| `src/components/preview/PreviewFrame.tsx` | Renders virtual FS files in sandboxed iframe |
| `src/components/editor/CodeEditor.tsx` | Monaco Editor integration |
| `src/actions/index.ts` | Server actions: signUp, signIn, signOut, getUser |
| `src/lib/auth.ts` | JWT session creation and verification |
| `src/generated/prisma/schema.prisma` | `User` and `Project` models (authoritative schema location) |

### UI layout

`main-content.tsx` uses resizable panels: left panel (35%) = chat, right panel (65%) = tabbed preview or file tree + code editor. Both panels share `FileSystemProvider` and `ChatProvider` contexts.

### Testing

Tests use Vitest + jsdom + Testing Library. Test files live in `__tests__/` directories alongside the code they test. The vitest config uses `tsconfigPaths()` for `@/*` alias resolution.
