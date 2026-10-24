# Katanusa Authentication Experience Redesign

## Goal

Redesign the existing login, registration, MFA, and email-verification experiences so they feel like a direct continuation of the Katanusa landing page: warm, welcoming, distinctly Indonesian, and still predominantly white and clean. Preserve the current authentication and expert-application behavior.

## Observable acceptance criteria

- Login, registration, MFA, and standalone email verification share one recognizable Katanusa visual system rather than unrelated dark/blue screens.
- White remains the dominant surface. Katanusa red is the primary action color; sky blue, warm cream, leaf green, and ink navy are restrained supporting colors drawn from the landing illustration.
- Brand red and validation danger use separate tokens and semantics: the CTA is the single strong red action per screen, while errors use a darker terracotta tone plus icon/text/border and never color alone. Disabled actions use neutral gray.
- The visual language reuses the landing page's cloud, red/green ribbon, archipelago, and cultural-storytelling cues without making form content busy or reducing legibility.
- Login remains a short, focused flow with email/password, password visibility, error/loading states, signup navigation, and MFA challenge fully functional.
- Signup preserves both journeys (`learner` and `expert_applicant`), all current data collection and validation, file upload, consent, submit, OTP, resend, and success behavior.
- Signup progress communicates both the current step and the chosen journey clearly on desktop and mobile.
- Standalone verification preserves token auto-verification and manual six-digit-code verification.
- All form controls have visible labels, keyboard-visible focus, suitable autocomplete/input modes, and icon-only controls have accessible names.
- Wizard step changes move focus to the new step heading; alerts use appropriate live regions. Focus rings use ink navy rather than red so focus is not confused with validation failure.
- Layouts work without horizontal scrolling at approximately 375 px mobile width and remain balanced at desktop widths.
- Existing API endpoints, payloads, routing behavior, and auth/session logic are unchanged except for safe UI-only corrections such as removing a dead link or unused variable.
- `npm run build` succeeds and targeted ESLint checks for changed auth/component files succeed.

## Approach

1. Introduce a shared `AuthShell` component that provides:
   - a white-first page frame and Katanusa logo/home navigation;
   - a restrained scenic panel using existing local landing artwork;
   - cloud/ribbon motifs restricted to the scenic panel and page edges, never behind form controls;
   - optional journey/progress content for long registration pages;
   - responsive behavior that collapses decoration without hiding essential navigation.
2. Add a small authentication-specific stylesheet for reusable design tokens and component classes (fields, focus/error states, cards, stepper, scenic layers, reduced-motion behavior). Keep it scoped under `.auth-experience` to avoid affecting the rest of the application.
3. Refactor `Login.tsx` to use the shared shell for both normal login and MFA. Preserve mutation/session/navigation behavior and add appropriate autocomplete, focus, and error semantics.
4. Refactor only the presentation shell and repeated visual classes in `Signup.tsx`; preserve its existing state machine, request payloads, validation, upload, consents, OTP, and journey branching. Improve the stepper, journey-selection cards, form rhythm, and long-form readability. On desktop use a compact vertical journey rail; on mobile use `Langkah X dari N` plus a thin ribbon-like progress bar derived from the existing `stepsConfig` and `currentStep` (3 learner steps or 4 expert steps, not new wizard state).
   - OTP/email verification is counted as the final step in both totals. Switching journeys immediately recomputes the total and labels from `stepsConfig`.
   - Dense expert steps are visually divided into topic sections/cards so long scrolling remains scannable; the existing top error summary remains prominent and focusable.
5. Add isolated focus management: a presentational step-heading target (`tabIndex=-1`) receives focus when `currentStep` changes; error and resend/status messages use alert/live-region semantics. Keep one OTP field with numeric input mode, one-time-code autocomplete, and no multi-box logic.
6. Refactor `Verify.tsx` onto the same shell and clean white verification card while preserving token and manual-code paths.
7. Perform browser-based visual checks of `/auth/login`, `/auth/signup`, and `/auth/verify` at desktop, tablet, 375 px, and 320 px widths plus keyboard and 200% zoom checks, then correct overflow, hierarchy, contrast, and responsive issues.

## Key decisions and trade-offs

- **Existing artwork, not new generated art:** `/public/assets/bg-utama.webp` already defines the Katanusa identity and avoids introducing an inconsistent illustration style. It will be cropped and softened as supporting scenery rather than used as a full-screen form background.
- **Intentional crops:** each shell variant receives an explicit crop/object position. Desktop crops must retain more than one cultural figure plus a visible ribbon; MFA/verify uses a calmer sky-heavy crop. Mobile uses a short scenic band only on entry screens and does not load/display an oversized decorative panel where it would delay the form.
- **White-first, not illustration-first:** form surfaces remain white; illustration is limited to a secondary scenic region and subtle edge motifs.
- **Shared shell, local flow logic:** centralize visual language while leaving complex signup/auth behavior in its current files, reducing regression risk in a dirty worktree.
- **Presentational boundaries:** `AuthShell` and progress UI receive props and render JSX only. They do not read or mutate signup state. The existing auth files were copied to `/private/tmp/katanusa-auth-before-redesign` before implementation so the user's uncommitted version remains recoverable without creating a commit or stash.
- **Progressive cultural detail:** richer storytelling appears on wide screens; small screens retain compact motifs and the core form.
- **No unsupported social login or password-reset implementation:** the current app has no configured social auth and no `/forgot-password` route. Do not imply those capabilities.

## Confirmed assumptions and sources

- The current landing identity is driven by `/public/assets/bg-utama.webp`, white clouds, Katanusa red, green ribbon accents, pale sky, playful rounded display type, and the hand-lettered logo (`src/pages/Home/LandingPage.tsx`, supplied screenshot).
- Login currently supports email/password plus an MFA challenge (`src/pages/Auth/Login.tsx`).
- Signup currently supports learner and expert-applicant journeys, expert evidence upload, granular consent, verification OTP, resend, and success routing (`src/pages/Auth/Signup.tsx`).
- Standalone verification supports a URL token or a manual code (`src/pages/Auth/Verify.tsx`).
- Routes are `/auth/login`, `/auth/signup`, and `/auth/verify` (`src/App.tsx`).
- The checkout already contains extensive user changes, especially a large signup rewrite. These must be preserved; the redesign is additive and carefully scoped.
- Baseline commit: `8e3f48e43a13c4edb22d557dec6b5a1883c93b63`; baseline `npm run build` passes on 2026-10-21.

## Non-goals

- Changing backend endpoints, payload schemas, session handling, MFA policy, expert-review rules, or upload behavior.
- Adding Google/social sign-in, implementing password reset, or changing post-auth destinations.
- Redesigning the landing page, authenticated dashboard, or expert marketplace.
- Replacing the global brand logo or generating a new cultural illustration.

## Risks

- `Signup.tsx` is large and already heavily modified; broad markup replacement could regress behavior. Mitigation: keep handlers/state intact and make bounded presentation edits.
- Local font import depends on Google Fonts at runtime. Existing fallback fonts remain usable; no new remote dependency will be added.
- The large landing artwork may crop differently across viewports. Mitigation: dedicated object positioning and mobile-specific simplified decoration.
- Brand red can make both calls-to-action and errors feel alarming. Mitigation: distinct `--kn-cta` and `--kn-danger` tokens, neutral disabled actions, navy focus rings, and icon/text/error semantics.
- Wizard focus can be stranded after a step unmounts. Mitigation: isolated heading-focus effect and live-region feedback without modifying payload or navigation handlers.
- No browser-level automated tests currently exist. Mitigation: production build, targeted lint, and manual desktop/mobile visual inspection.

## Verification

### Automated proof

- `npm run build`
- `./node_modules/.bin/eslint src/components/auth/AuthShell.tsx src/pages/Auth/Login.tsx src/pages/Auth/Signup.tsx src/pages/Auth/Verify.tsx`

Expected: both commands exit 0. Existing Vite large-chunk warning may remain; no new build error is acceptable.

### Manual and visual proof

- Open `/auth/login` at desktop and mobile widths; verify clear form priority, working password toggle, visible errors/loading, signup navigation, and no horizontal overflow.
- Exercise/inspect the MFA view and confirm it uses the same shell and accepts only six digits.
- Open `/auth/signup`; inspect learner and expert choices, progress steps, step transitions, long expert form, upload/consent presentation, OTP state, and mobile wrapping.
- Complete a keyboard-only pass through the signup journey; verify focus lands on each new step heading and all cards/toggles have visible navy focus.
- Open `/auth/verify` with and without `email` query parameter; inspect manual-code, loading, error, and success presentation.
- Repeat layout checks at 320 px, 375 px, 768 px, desktop, and 200% browser zoom; temporarily inspect for genuine horizontal overflow rather than hiding it.
- Confirm the page remains predominantly white and visually recognizable as the same Katanusa shown in the supplied landing-page screenshot.
