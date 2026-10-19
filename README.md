# Pulse12

Pulse12 turns long-term goals into focused 12-week cycles, scheduled actions, weekly execution scores, and accountability.

The frontend is a standard **React + TypeScript + Vite + Tailwind** single-page app. **Base44 remains the hosted backend** for authentication, entities, access rules, functions, and integrations. The frontend can run locally or on Vercel without the Base44 builder or Vite plugin.

## Local setup

Use Node.js 22.12+ (Node.js 24 LTS is recommended).

```powershell
npm install
Copy-Item .env.example .env.local
```

Fill in `.env.local`:

```dotenv
VITE_BASE44_APP_ID=your-base44-app-id
VITE_BASE44_APP_BASE_URL=https://your-published-app.base44.app
# Optional: leave unset unless you need a specific deployed functions version.
VITE_BASE44_FUNCTIONS_VERSION=
```

Find the app ID in the Base44 editor URL: `https://app.base44.com/apps/<app-id>/editor`. Use the existing published Base44 app origin for `VITE_BASE44_APP_BASE_URL`, not the editor URL, localhost URL, or Vercel URL. Keep that app and its backend deployed.

```powershell
npm run dev
```

Open the localhost URL printed by Vite (normally http://localhost:5173). Restart Vite after changing environment variables. On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` instead of `npm`.

`npm run dev` runs only the frontend against the hosted backend. You do not need `base44 dev` for this workflow. Use the existing Base44 CLI workflow separately when developing or deploying backend resources in `base44/`.

## Environment and authentication

- `VITE_BASE44_APP_ID`: required public identifier for the existing backend.
- `VITE_BASE44_APP_BASE_URL`: required published Base44 origin used by app settings and hosted authentication flows.
- `VITE_BASE44_FUNCTIONS_VERSION`: optional backend function version.

All `VITE_*` values are embedded in the public browser bundle. Do not put service-role credentials, API keys, or user access tokens in these variables. `.env.local` is ignored by version control; `.env.example` contains only placeholders.

The existing login/register/password-reset screens use Base44 authentication, and the SDK stores the user session. Entity permissions continue to be enforced by Base44. Enable the login methods you need in the existing Base44 app. When configuring OAuth or authentication redirects, ensure the localhost and deployed frontend origins are permitted by your Base44/provider settings. Verify social login and password-reset destinations after changing domains; frontend deployment does not change backend authentication settings automatically.

## Checks and production preview

```powershell
npm run typecheck
npm run lint
npm run build
npm run preview
```

Preview serves `dist/` locally, normally at http://localhost:4173. It is a local production-build check, not a production server. There is currently no automated unit-test suite.

The frontend uses strict TypeScript checking through `tsconfig.json`. `npm run typecheck` checks the source and Vite/Tailwind configuration without emitting files; `npm run build` runs the same check before bundling. Entity contracts and shared planning types live in `src/types/`. The existing backend functions already use TypeScript and run in Base44's Deno environment, so they are separate from the browser compiler configuration.

The initial dependency audit reports 10 findings in the retained React Router 6 / Tailwind 3 dependency trees. Resolving all findings requires a separate dependency migration; the frontend configuration change does not resolve them.

With your Base44 configuration filled in, manually check:

1. Register or log in, refresh the page, and confirm the session remains active.
2. Create a cycle at `/setup`, then check goals and daily actions on `/`.
3. Open a `/cycle/<id>` URL directly and refresh it.
4. Toggle a task, reload, and confirm the change persisted to Base44.
5. Log out; protected pages should return to `/login`.
6. Verify Google login, password reset, and any calendar/accountability functions you use.

Local tests use the configured hosted app's data. Use a separate Base44 test app if you want isolated data.

## Deploy the frontend to Vercel

1. Push this repository to your Git provider and import it into Vercel.
2. Select **Vite**, with the repository root as the root directory.
3. Use `npm run build` as the build command and `dist` as the output directory. These settings are also in `vercel.json`.
4. Add the same `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` values in Vercel Environment Variables for each environment you deploy (Production and/or Preview). Add the functions version only if needed.
5. Deploy. Environment variables are read at build time, so redeploy after changing them.

`vercel.json` supplies the SPA fallback so direct links such as `/setup`, `/login`, and `/cycle/<id>` render the React app. Vite assets are served from `dist/assets/`.

Vercel hosts only the frontend. The entities, RLS rules, functions, and connectors under `base44/` stay on Base44 and must already be deployed there. Deploying this repository to Vercel does not deploy those backend resources.

## Project layout

- `src/App.tsx`: React Router routes and providers.
- `src/api/base44Client.ts`: shared hosted Base44 SDK client.
- `src/lib/app-params.ts`: environment configuration and auth callback token handling.
- `src/lib/pulse/`: cycle, recurrence, scoring, and query logic.
- `base44/entities/`: backend schemas and access rules.
- `base44/functions/`: hosted backend functions.

Core rules include 84-day cycles, at most three active goals (one for free accounts), one active cycle per user, an 85% execution benchmark, and recovery prompts after two scored weeks below that benchmark.

References: [Vite deployment](https://vite.dev/guide/static-deploy.html#vercel) and [Base44 external SDK client](https://docs.base44.com/developers/references/sdk/getting-started/client).
