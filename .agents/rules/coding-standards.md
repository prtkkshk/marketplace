# Coding Standards — KGP Bazaar

## Language

- TypeScript everywhere. `strict: true`, `noUncheckedIndexedAccess: true`,
  `noImplicitOverride: true` in `tsconfig.json`.
- `any` is banned. Use `unknown` + narrowing, or write the type. ESLint enforces this
  via `@typescript-eslint/no-explicit-any: error`.
- Prefer `type` aliases for data shapes, `interface` only for extendable contracts.
- No default exports except for route-level page components and Vite config files.
  Named exports make refactors and search reliable.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase file + folder | `ListingCard.tsx` |
| Hooks | `use` prefix, camelCase | `useListings.ts` |
| Data-access functions | verb + noun | `createListing`, `fetchWantedRequests` |
| Types | PascalCase, no `I` prefix | `Listing`, `StudentProfile` |
| Constants | SCREAMING_SNAKE in `src/lib/constants.ts` | `KGP_HALLS`, `CATEGORIES` |
| DB tables/columns | snake_case, tables plural | `listings`, `hall_of_residence` |
| Booleans | `is`/`has`/`can` prefix | `isNegotiable`, `isAdmin` |

## File structure

```
src/
├── main.tsx
├── App.tsx                      # router + providers only
├── components/
│   ├── ui/                      # Button, Input, Sheet, Badge, Skeleton, Toast…
│   └── layout/                  # BottomNav, DesktopHeader, AppShell
├── features/
│   ├── auth/                    # sign-in, sign-up, OTP, profile completion
│   ├── listings/                # feed, card, detail sheet, create/edit form
│   ├── wanted/                  # wanted board, request card, create form
│   ├── profile/                 # my listings, my requests, saved, settings
│   └── admin/                   # dashboard, moderation queue, users, announcements
├── lib/
│   ├── supabase.ts              # single client instance
│   ├── database.types.ts        # generated — never hand-edit
│   ├── data/                    # ALL queries live here, one file per table
│   ├── validation/              # zod schemas
│   ├── hooks/                   # cross-feature hooks
│   ├── constants.ts
│   └── utils/                   # formatINR, whatsappLink, timeAgo, cn
├── routes/                      # page components, thin — compose features
└── styles/index.css
```

- One feature per folder. A feature folder may import from `components/ui`, `lib`, and
  its own files — **never from another feature folder**. Cross-feature sharing means
  the thing belongs in `components/` or `lib/`.
- No component file over ~200 lines. Extract into the same feature folder.
- No barrel `index.ts` re-export files; they hurt tree-shaking and make imports vague.

## Comments and docs

- Comment *why*, not *what*. Delete comments that restate the code.
- Every exported function in `src/lib/` gets a one-line JSDoc describing what it does
  and, if relevant, which RLS policy governs it.
- Any non-obvious workaround must cite the reason (browser bug, Supabase limitation,
  iOS PWA quirk) so the next agent doesn't "clean it up".

## Errors

- Data-layer functions throw typed errors; they never return `null` to mean failure.
- The UI catches at the query boundary (TanStack Query `error` state) and renders a
  human message — never a raw Postgres error string, which can leak schema details.
- Log with `console.error` in dev only; strip in production builds.

## Formatting and tooling

- Prettier with default config + `printWidth: 100`, `singleQuote: true`. Never argue
  about formatting; run `npm run format`.
- ESLint: `eslint:recommended`, `@typescript-eslint/recommended`,
  `react-hooks/recommended`, `jsx-a11y/recommended`. Warnings fail CI.
- Scripts that must exist in `package.json`: `dev`, `build`, `preview`, `lint`,
  `format`, `typecheck`, `test`, `test:e2e`, `db:types`.

## Git

- Conventional Commits: `feat(listings): add category pill filter`.
- One logical change per commit. Never commit generated `dist/`, `.env`, or
  `playwright-report/`.
- Branch per phase: `phase-3-listings`.
