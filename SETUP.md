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

### Step 3 — Run optional migrations (recommended)

Run in SQL Editor if not already done:

- [`00003_employee_code_trigger.sql`](supabase/migrations/00003_employee_code_trigger.sql) — auto employee IDs
- [`00004_users_update_own.sql`](supabase/migrations/00004_users_update_own.sql) — superseded by 00005 if you run that next
- [`00005_users_last_login_only.sql`](supabase/migrations/00005_users_last_login_only.sql) — **required** — blocks users from changing their own role/status

### Step 4 — Test Phase 1

- [ ] **Employees** → Add employee → appears in list with auto ID
- [ ] Edit employee → save changes
- [ ] Set employee to **Inactive** → linked user becomes disabled
- [ ] **Users** → Create user → pick employee, set role/password
- [ ] Super admin → change another user's role via dropdown
- [ ] Super admin → **Reset password** for a user (no email needed)
- [ ] **Forgot password?** on login page works (or use admin reset if email rate limited)
- [ ] Log in as new user → attendance recorded
- [ ] Sign out → logout time recorded
- [ ] Wrong password → instant error, email kept, can retry
- [ ] Sign in → lands on dashboard without manual refresh
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

## Phase 2 — Suppliers

### Step 1 — Run the Phase 2 migration

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Copy all of [`supabase/migrations/00006_phase2_suppliers.sql`](supabase/migrations/00006_phase2_suppliers.sql)
3. Click **Run**

This creates:

- `suppliers` table + auto ID (`SUP-2026-00001`)
- `supplier_bank_accounts` table (unique account numbers)
- RLS: admin write, accounts read-only

### Step 2 — Restart the dev server

```bash
npm run dev
```

### Step 3 — Test Phase 2

- [ ] **Suppliers** → Add supplier → returns to list with green “Supplier created successfully” message
- [ ] New supplier appears in list with auto ID (e.g. `SUP-2026-00001`)
- [ ] **View** supplier → Overview tab → edit and save → returns to list with “Supplier updated successfully”
- [ ] Bank Accounts tab → add 2 accounts → returns to list with “Bank account added successfully”
- [ ] Open supplier again → set one account as **Primary**
- [ ] Try duplicate account number (same as another supplier) → clear error, form recoverable
- [ ] **Deactivate** supplier → still in list, status shows Inactive
- [ ] **Activate** again → status back to Active
- [ ] Sign in as **Accounts** role → can view list + detail, no Add/Edit/Deactivate buttons
- [ ] Sign in as **Admin** → full create, edit, bank accounts, activate/deactivate
- [ ] Procurements / Payments / Analytics tabs show placeholders (not broken)
- [ ] Search supplier by name or ID works
- [ ] **Regression:** login, employees, users still work

### Phase 2 grade card

| Category | Grade | Notes |
|----------|-------|-------|
| Master data UX | Match | Detail tabs like Odoo/NetSuite |
| Bank accounts | Match | Multiple accounts, unique numbers, primary flag |
| Speed | Match | Paginated list, loading skeleton, parallel fetch on detail |
| Errors | Beat | Plain-language errors, recoverable forms |
| Security | Match | RLS + server role guards |
| Future-proofing | Beat | Placeholder tabs for Phase 3/6/9 |

## Phase 3 — Procurement

### Step 1 — Run the Phase 3 migration

In Supabase Dashboard → **SQL Editor**, run:

`supabase/migrations/00007_phase3_procurement.sql`

This creates `procurement_batches`, batch number auto-generation (`PR-YYYY-000001`), and wires the supplier 90-day inactivity rule.

### Step 2 — Restart dev server (if running)

```bash
npm run dev
```

### Step 3 — Test Phase 3

Use an **accounts** user and an **admin** user (plus super admin for unlock).

- [ ] Open **Procurement** from the sidebar
- [ ] **New batch** — on-site: bags + kg/bag + extra kg; product type preview updates (e.g. Clean New Red)
- [ ] **New batch** — off-site: enter total KG directly when kg/bag is empty
- [ ] Batch number assigned automatically (PR-2026-000001 format)
- [ ] List shows batch, type, product, supplier, kg, status, payment, date
- [ ] **Accounts** user: no unit price / total value columns on list or detail
- [ ] **Admin** user: sees pricing; set unit price on pending batch
- [ ] **Approve batch** (admin) — batch locks; edit form disappears
- [ ] Approve blocked if unit price is zero
- [ ] **Raw products** — quality decision locked to **Processing** only (pre-stock not allowed)
- [ ] Run `supabase/migrations/00012_raw_must_process.sql` to fix any raw batches wrongly marked pre-stock
- [ ] **Super admin** — **Unlock for editing** on approved batch; edit and save again
- [ ] Supplier detail → **Procurements** tab lists batches for that supplier
- [ ] Supplier list **Procurements** column shows count
- [ ] Success banner on list after create / update / approve
- [ ] **Regression:** login, employees, users, suppliers still work

### Phase 3 grade card

| Category | Grade | Notes |
|----------|-------|-------|
| Workflow UX | Match | Multi-section create form, list + detail like Odoo |
| Classification | Match | Product type engine (Raw/Clean/Mixed + variants) |
| Approval lock | Match | Admin approve; super admin unlock |
| Price visibility | Match | Hidden from accounts in UI and API strip |
| Speed | Match | Paginated list (25), parallel fetch on supplier tab |
| Security | Match | RLS + server role guards |
| Supplier link | Beat | Live procurements tab + list counts |

---

## Phase 4 — Processing

### Step 1 — Run the Phase 4 migration

In Supabase Dashboard → **SQL Editor**, run:

`supabase/migrations/00009_phase4_processing.sql`

This creates `processing_sessions`, `processing_outputs`, `waste_records`, `pre_stock`, session numbers (`PS-2026-001`), and lets inventory managers read approved procurement batches for the queue.

Then run `supabase/migrations/00010_waste_bags.sql` to store waste as bags × kg per bag, `00011_waste_extra_kg.sql` for optional extra kg per category, and **`00013` then `00014`** for processing session admin approval (run as two separate queries — PostgreSQL requires this).

### Step 2 — Restart dev server (if running)

```bash
npm run dev
```

### Step 3 — Optional logic test (no database)

```bash
node scripts/test-processing-logic.mjs
```

### Step 4 — Test Phase 4

Use **admin**, **inventory_manager**, and **super_admin**. Accounts users should **not** see Processing in the sidebar.

**Queue**
- [ ] Sidebar **Processing** badge shows count of batches waiting (amber); hover shows bags remaining
- [ ] Only **approved** batches with quality decision **Processing** appear
- [ ] Batches with **Pre-stock** decision do **not** appear
- [ ] Remaining bags = batch bags minus bags already sent to sessions
- [ ] **Start** opens new session form

**Start session**
- [ ] Submit bags sent for **admin approval** (does not start work immediately)
- [ ] Session number auto-assigned (`PS-2026-001`)
- [ ] Cannot send more bags than remaining (pending requests reserve bags)
- [ ] **Admin** sees pending requests on Processing page and sidebar badge
- [ ] **Approve** unlocks output & waste recording; **Reject** releases bags

**Session detail (after approval)**
- [ ] Record export output (bags, 25/20 kg package, extra kg)
- [ ] Record waste by category: **bags** × **kg per bag** (15, 20, 25, or 30 kg; default 30) plus optional **extra kg**
- [ ] Yield preview updates
- [ ] **Save progress** works while in progress
- [ ] **Complete processing** locks session, stores yield, creates **pre-stock** row (`PSK-2026-001`)

**Batch close**
- [ ] When last bags are processed, batch leaves the queue (`processing_closed`)

**Roles**
- [ ] **Inventory manager** can read queue and complete sessions (no procurement pricing)
- [ ] **Super admin** can **Unlock for editing** on completed sessions

**Regression**
- [ ] Procurement, suppliers, HR, users still work

### Phase 4 grade card

| Category | Grade | Notes |
|----------|-------|-------|
| Queue routing | Match | Approved + processing decision only |
| Bag control | Match | Cannot exceed remaining bags |
| Output & waste | Match | Export output + waste by bags × kg/bag (4 categories) |
| Yield | Match | Auto-calculated on complete |
| Pre-stock handoff | Match | Auto-create on complete (Phase 5 UI next) |
| Security | Match | RLS + role guards |

---

## Phase 5 — Inventory

### Step 1 — Run the Phase 5 migration

In Supabase Dashboard → **SQL Editor**, run in order:

1. `supabase/migrations/00017_phase5_inventory.sql`
2. `supabase/migrations/00018_procurement_pre_stock.sql` — pre-stock from approved on-site procurement
3. `supabase/migrations/00019_partial_grading.sql` — partial bag grading, mixed types, graded composition

Ensure Phase 4 migrations **00013 → 00016** are already applied.

### Step 2 — Restart the dev server

```bash
npm run dev
```

### Step 3 — Test Phase 5

Use **admin**, **inventory_manager**, or **super_admin**.

**Pre-stock**
- [ ] Complete a processing session (Phase 4) → pre-stock row appears (`PSK-2026-001`)
- [ ] Approve clean on-site procurement with pre-stock → pre-stock row appears
- [ ] **Inventory → Pre-stock** lists number, source link, product, bags available / received, kg, status
- [ ] Search and status filter work
- [ ] Partial grading leaves remaining bags on pre-stock with status **Available**

**Export inventory**
- [ ] **Create inventory batch** → add lines with bags per pre-stock row (mixed product types allowed)
- [ ] Live preview shows procurement-consistent name (`Red Mixed`, `Black Mixed`, `New Combined Mixed`, `Old Combined Mixed`, `Combined Mixed`)
- [ ] Inventory number auto-assigned (`INV-2026-001` display)
- [ ] Fully graded pre-stock → **Allocated**; partial → stays **Available** with reduced bags/kg
- [ ] Detail page shows source pre-stock traceability with product type, bags, and kg per line

**Regression**
- [ ] Processing complete still creates pre-stock
- [ ] Phases 0–4 still work

---

## Next phase

**Phase 6 — Payments**: supplier payment queue and records.

Say **"Start Phase 6"** when Phase 5 tests pass.
