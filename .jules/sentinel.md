# Sentinel Journal

## 2025-12-29 - [Initial Scan]
**Vulnerability:** None (Clean Start)
**Learning:** The codebase generally follows secure practices (Supabase RLS). found `dangerouslySetInnerHTML` used safely for JSON-LD.
**Prevention:** N/A

## 2025-12-29 - [Enhancement] **HTTP Security Headers**
**Vulnerability:** Missing strict HTTP headers (HSTS, etc.)
**Enhancement:** Added `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, and `Permissions-Policy` to `next.config.mjs`.
**Prevention:** Reduces attack surface (Clickjacking, MITM).

## 2025-12-29 - [Bug Fix] **Hydration Mismatch**
**Issue:** Grammarly/Extensions injecting attributes into `<body>` causing React hydration errors.
**Fix:** Added `suppressHydrationWarning` to `<html>` and `<body>` in `app/layout.tsx`.
**Learning:** Browser extensions modify the DOM before hydration; Next.js 15+ is strict about this. Safe suppression is the standard fix.

## 2025-12-29 - [Upgrade] **Next.js 16**
**Issue:** Project was on Next.js 15.5.9.
**Fix:** Upgraded workspace to Next.js 16.1.1. Updated configuration (`reactCompiler`, `optimizePackageImports`).
**Learning:** `package.json` updates in monorepos require updating all workspace consumers to prevent reversion. `optimizePackageImports` location varies by version.

## 2025-12-29 - [Refactor] **Middleware to Proxy**
**Issue:** "Middleware file convention is deprecated" warning in Next.js 16.
**Fix:** Renamed `middleware.ts` to `proxy.ts` and updated exported function to `proxy`.
**Learning:** Next.js 16 clarifies "middleware" as "proxy" for edge routing/rewrites to distinguish it from Express-style middleware.

## 2025-12-29 - [Security Fix] **RLS Infinite Recursion**
**Issue:** The `memberships` RLS policy "Members can view other members" was querying `memberships` table recursively, causing an infinite loop.
**Fix:** Introduced `kit.get_user_account_ids()` as a `security definer` function to safely retrieve account IDs without triggering RLS, and updated the policy to use it.
**Learning:** Avoid self-referencing RLS policies without a way to break the recursion (like a `security definer` function).

## 2025-12-29 - [Manual Operation] **Account Creation**
**Issue:** Disabling `on_auth_user_created` trigger meant Supabase users had no corresponding `accounts` record, breaking the Profile Page.
**Fix:** Created `manual_create_account.sql` to manually seed the account record for existing users.
**Note:** In a production B2B flows, account creation should be handled via Invite/Onboarding logic.

## 2025-12-29 - [Security Audit] **OWASP Top 10**
**Scope:** IDOR and SQL Injection.
**Finding 1 (Critical):** IDOR in `review_requests` RLS policy. Missing `WITH CHECK` clause allowed users to transfer ownership of requests.
**Fix:** Created migration `20251229124000_fix_review_requests_policy.sql` to enforce location access on updates.
**Finding 2 (High):** Open Redirect in Auth Callback (`auth-callback.service.ts`).
**Fix:** Patched `exchangeCodeForSession` to validate that redirects are relative or match the site URL.
**Finding 3 (Clean):** SQL Injection risks are low due to parameterized queries. Server Actions (`deletePersonalAccount`) use secure `enhanceAction` wrapper.
