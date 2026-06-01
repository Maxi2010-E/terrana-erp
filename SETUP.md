# Terrana ERP — Setup Guide

## Phase 0 (done)

Foundation: login, sidebar, roles, placeholder modules.

Migration: `supabase/migrations/00001_phase0_foundation.sql`

---

## Phase 1 — Employees + Users

### Step 1 — Run the Phase 1 migration

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Copy all of [`supabase/migrations/00002_phase1_hr_users.sql`](supabase/migrations/00002_phase1_hr_users.sql)
3. Click **Run**

This creates:

- `employees` table + auto ID function (`EMP-2026-00001`)
- `attendance` table
- Links `users.employee_id` → `employees`
- Trigger: inactive/archived employee disables linked user

### Step 2 — Restart the dev server

```bash
npm run dev
```

Ensure `.env.local` includes `SUPABASE_SECRET_KEY` (needed to create user accounts).

### Step 3 — Test Phase 1

- [ ] **Employees** → Add employee → appears in list with auto ID
- [ ] Edit employee → save changes
- [ ] Set employee to **Inactive** → linked user becomes disabled
- [ ] **Users** → Create user → pick employee, set role/password
- [ ] Log in as new user → attendance recorded
- [ ] Sign out → logout time recorded
- [ ] Payroll / Leave / Advances / Bonuses still show placeholders (later phase)

---

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

**No spaces** after `=`.

### Password reset (Supabase Auth)

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to `http://localhost:3000` (or your production URL)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - Your production URL + `/auth/callback` when you deploy
4. Ensure **Email** provider is enabled under **Authentication** → **Providers**

Users can use **Forgot password?** on the login page. They receive an email link, set a new password, then sign in.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login fails | Check Supabase Auth user email/password |
| Password reset email not arriving | Check Supabase URL config + spam folder; enable Email provider |
| **Email rate limit exceeded** | Supabase caps auth emails on free tier (~4/hour). **Immediate fix:** Supabase Dashboard → **Authentication** → **Users** → set a new password (no email). Or, if logged in as **super admin** or **admin**: **Users → Reset password** (super admin accounts: super admin only). Wait ~1 hour before using **Forgot password?** again. |
| Reset link expired | Request a new link from **Forgot password?** |
| "Could not generate employee ID" | Run migration `00002` |
| "Missing SUPABASE_SECRET_KEY" | Add secret key to `.env.local`; restart dev server |
| Create user fails | Employee must be **Active** and not already linked |
| User disabled after employee inactive | Expected — re-enable employee or user manually |

---

## Next phase

**Phase 2 — Suppliers**: supplier records + bank accounts.

Say **"Start Phase 2"** when Phase 1 tests pass.
