# Terrana ERP — deployment log

Production app: **https://terrana-erp.vercel.app**  
Supabase prod project: **Terrana Africa Erp-Prod**

---

## Release: UX — settings, profiles, user creation, change password

**Git commit:** `40b688a` — `UX: settings hub, profile names/photos, user creation, change password`  
**Branch:** `main`

### Summary

| Area | Change |
|------|--------|
| Create user | Employee-first; email from HR; no username; admin sets password + role only |
| Header | Welcome, full name from linked employee (no email fallback) |
| Sidebar | First name + role; profile photo replaces orange T when on file |
| Settings | All roles see Settings nav; super admin = geofence only; everyone else = change password |
| Change password | In-app at `/settings/password` (no email link); super admin excluded |
| Users | Username column removed; super admin accounts protected from admin actions |
| Geofence | Super admin only (`/settings/geofence`) |
| Photos | Upload `useActionState` transition fix |
| DB | Migration `00054_employee_self_read.sql` |

### Files (26 changed)

See `git show 40b688a --stat`.

---

## Deploy checklist

### 1. App (Vercel)

```bash
git checkout main
git pull origin main
# Already on 40b688a or later
```

Vercel redeploys automatically on push to `main` (~2–3 min).

### 2. Database (Supabase prod — required)

Run in **SQL Editor** (or `supabase db push` linked to prod):

`supabase/migrations/00054_employee_self_read.sql`

Allows each user to read their own employee row for header name and sidebar photo.

### 3. Smoke test (production)

- [ ] Super admin → Settings → Attendance geofence only
- [ ] Admin → Users in sidebar; super admin row = “Protected account”
- [ ] Staff → Settings → Change password (current + new → re-login)
- [ ] Create user: administrative employee, email prefilled, no username
- [ ] Header: Welcome, [First Last]; sidebar: first name + photo if uploaded
- [ ] Employee photo upload: no console error

---

## Prior production fix (already on main)

**Commit `9fe6b16`** — Removed `unstable_cache` around cookie-based Supabase reads (fixed dashboard 500 on prod).
