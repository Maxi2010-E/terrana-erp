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
- [`00004_users_update_own.sql`](supabase/migrations/00004_users_update_own.sql) — **deprecated**; skip on fresh DB — use `00005` instead
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
4. `supabase/migrations/00020_processing_pre_stock_clean_names.sql` — processing pre-stock uses Clean labels (fixes existing Raw rows)

Ensure Phase 4 migrations **00013 → 00016** are already applied.

### Step 2 — Restart the dev server

```bash
npm run dev
```

### Step 3 — Test Phase 5

Use **admin**, **inventory_manager**, or **super_admin**.

**Pre-stock**
- [ ] Complete a processing session (Phase 4) → pre-stock row appears (`PSK-2026-001`) with **Clean** product type (not Raw)
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

## Phase 6 — Payments (supplier payment queue and records)

### Step 1 — Run migration in Supabase

Run in **Supabase Dashboard → SQL Editor**, after Phase 5 migrations:

1. `supabase/migrations/00021_phase6_payments.sql`
2. `supabase/migrations/00022_payment_bank_account.sql`
3. `supabase/migrations/00024_resolve_user_display_names.sql`

(`00023_resolve_user_emails.sql` was removed — `00024` replaces it.)

This creates `supplier_payments`, payment reference generator (`PAY-2026-000001`), overpayment validation, automatic batch `payment_status` rollup, and links transfer payments to a supplier bank account.

### Step 2 — Restart the dev server

```bash
npm run dev
```

### Step 3 — Test Phase 6

Use **accounts** to record payments and **admin** / **super_admin** to approve.

**Record payment**
- [ ] **Payments → Record payment** — only suppliers with outstanding approved batches appear
- [ ] Select batch → batch value, paid so far, and outstanding display correctly
- [ ] Enter amount + method (Cash / Transfer) → saves as **Pending approval**
- [ ] **Transfer** requires selecting a supplier bank account (defaults to primary)
- [ ] **Cash** does not ask for a bank account
- [ ] Supplier with no bank accounts cannot record a transfer (link to supplier profile shown)
- [ ] Overpayment attempt is rejected (amount greater than outstanding)

**Approve payment**
- [ ] Admin opens a pending **transfer** payment → confirms or changes payout bank account → **Approve payment**
- [ ] Approved transfer shows payout bank account on detail and in payment history
- [ ] Batch `payment_status` updates: unpaid → partially paid → paid when balance reaches zero
- [ ] Partial payments show in **Partially paid** queue; fully paid batches move to **Completed**

**Queues & history**
- [ ] Dashboard cards show Outstanding / Partial / Completed counts
- [ ] Payment queue filters work; search works on batch number / product
- [ ] Payment history lists reference, supplier, batch, amount, date, method, payout account (transfers), approver

**Supplier integration**
- [ ] **Suppliers** list **Outstanding** column shows total unpaid balance per supplier
- [ ] Supplier detail **Payments** tab shows payment history for that supplier

**Roles**
- [ ] **accounts** can record but not approve
- [ ] **inventory_manager** cannot access `/payments`
- [ ] **super_admin** can unlock an approved payment (returns to pending approval)

**Regression**
- [ ] Phases 0–5 still work (procurement, processing, inventory)

---

## Phase 7 — Expenses (manual QA)

Run migration **`00026_phase7_expenses.sql`** in Supabase SQL Editor (after `00024` and `00025` if not applied).

**Petty cash**
- [ ] Admin can **Add petty cash** on Daily Expenses page
- [ ] Balance card shows current petty cash balance and recent top-ups
- [ ] Accounts cannot add petty cash top-ups

**Daily expenses**
- [ ] Accounts can **Add expense** with category, description, amount, method, date, notes
- [ ] New daily expense saves as **Pending approval**
- [ ] Admin sees urgent banner when daily expenses await approval
- [ ] Admin **Approve** on a cash expense reduces petty cash balance
- [ ] Approving a cash expense that exceeds balance is rejected
- [ ] Transfer daily expenses do not affect petty cash balance

**Operational expenses**
- [ ] Create operational expense with type-driven linked record dropdown
- [ ] Cleaning / field transfer out link to processing sessions
- [ ] Grading links to inventory batches
- [ ] Truck offloading links to off-site procurement only
- [ ] Field transfer in links to pre-stock records (bags auto-fill from pre-stock received)
- [ ] Field transfer in dashboard card shows **to record** (amber) and **pending approval** (red badge) counts
- [ ] Miscellaneous allows entry without a linked record
- [ ] Warehouse loading appears disabled with “Available after Logistics module”
- [ ] Bags × rate per bag auto-calculates total; admin can approve

**Roles & navigation**
- [ ] **accounts** can record but not approve expenses
- [ ] **inventory_manager** cannot access `/expenses/*`
- [ ] Sidebar badges show pending counts on Daily and Operational nav items

**Regression**
- [ ] Phases 0–6 still work (payments, procurement, processing, inventory)

### Deferred — revisit after Phase 8 or 9

**Field transfer in + waste (not in Phase 7)**

Processing waste (broken flowers, etc.) will eventually be transferred back into the warehouse and should count toward **field transfer in** operational costs — same per-bag labor model as pre-stock intake. That requires a **Waste management** module/tab (log of waste bags eligible for warehouse transfer).

Until then:

- Field transfer in links **only** to **pre-stock** records (`bags_received` auto-fill).
- Do **not** include processing `waste_records` in the field transfer in dropdown, notifications, or bag counts.
- When waste management ships, extend field transfer in to link waste transfer events and auto-fill bag counts from that log.

---

## Phase 8 — Logistics (manual QA)

Run migrations in Supabase SQL Editor (in order):

1. `supabase/migrations/00034_phase8_logistics.sql`
2. `supabase/migrations/00035_operational_expense_shipment_unique.sql`

**Customers**
- [ ] Create customer → auto `CUS-2026-000001` ID
- [ ] List search by name, ID, country
- [ ] Detail: edit overview, deactivate/activate (no delete)
- [ ] Fumigation requirement saved correctly

**Fumigation chambers**
- [ ] Create / edit facility with registration number
- [ ] List search works

**Truck agents**
- [ ] Create / edit agent
- [ ] List search works

**Shipments**
- [ ] Dashboard cards show loaded / in transit / delivered counts
- [ ] Create shipment: customer + inventory selection + container/seal required
- [ ] Selected inventory moves to **allocated** status
- [ ] Detail shows inventory traceability links
- [ ] Advance status: loaded → in transit → delivered
- [ ] Delivered shipment marks inventory **shipped**

**Warehouse loading expense (Phase 7 integration)**
- [ ] Operational expense **Warehouse loading** enabled in form
- [ ] Links to loaded/in-transit shipments without existing expense
- [ ] Bags auto-fill from shipment inventory total
- [ ] Duplicate warehouse loading per shipment rejected

**Roles**
- [ ] **logistics_manager** can access all `/logistics/*` routes
- [ ] **accounts** cannot access `/logistics/*` but can record warehouse loading expense
- [ ] **inventory_manager** cannot access logistics or expenses

**Regression**
- [ ] Phases 0–7 still work

### Deferred — Phase 8 follow-up

- Shipment document uploads (photos, videos, certificates)
- Warehouse loading “to record” notification queue on dashboard cards

---

## Phase 9 — Dashboards (manual QA)

Run migration **`00036_phase9_dashboard_metrics.sql`** in Supabase SQL Editor (after `00035`).

PostgREST aggregate selects (`.sum()`) are disabled by default on Supabase — KPI totals use the `get_dashboard_kpi_metrics` RPC instead.

**Dashboard (`/dashboard`)**
- [ ] **super_admin / admin** see all 8 KPI cards with live values
- [ ] **accounts** sees procurement, suppliers, payments, monthly expenses/value
- [ ] **inventory_manager** sees current inventory + procurement KG
- [ ] **logistics_manager** sees containers in transit + monthly shipments
- [ ] KPI cards link to the correct module pages
- [ ] Recent activity preview shows for admin roles with links to detail pages
- [ ] Second navigation within 30s feels instant (cache)

**Reports (`/reports`) — admin only**
- [ ] Procurement, inventory, expense, and shipment trend charts render (6 months)
- [ ] Recent activity tables: procurements, payments, shipments, expenses
- [ ] Non-admin roles redirected away from `/reports`

**Regression**
- [ ] Phases 0–8 still work
- [ ] Sidebar notification cache still performs under 1s navigation target

### Phase 9 grade card

| Area | Grade | Notes |
|------|-------|-------|
| UX | Match | Role-aware KPIs, bar trends, recent activity |
| Data model | Match | Aggregates on existing indexed columns |
| Speed | Match | 30s memory + unstable_cache; no full-table scans for KPIs |
| Security | Match | RLS on all underlying tables; reports admin-only |

---

## Office — Attendance, Company Board, Geofence

Run in Supabase SQL Editor (in order):

1. [`00037_office_board.sql`](supabase/migrations/00037_office_board.sql) — general board, private messages, daily tasks
2. [`00038_attendance_geofence.sql`](supabase/migrations/00038_attendance_geofence.sql) — facility geofence + `record_login_attendance` RPC

### Configure facility geofence

1. **Settings** → Facility geofence
2. Enter latitude/longitude (Google Maps → right-click → copy coordinates)
3. Set radius (default 200m)
4. Enable **Require on-site location for valid attendance**

Until geofence is enabled, login works without location (attendance still recorded).

### Test Office

- [ ] **Office → Attendance** (admin): all active users; **Present** only after valid on-site login
- [ ] **Office → Company board → General**: any user can read/post; admin can remove posts
- [ ] **Office → Private**: message another user; only they see the thread
- [ ] **Office → Tasks**: admin adds task; stays open until checked off (carries to next day)
- [ ] Login outside geofence (when enabled): blocked with clear error
- [ ] Login at facility: succeeds; roster shows **Present**

---

## HR Payroll (leave, advances, bonuses)

Run [`00039_hr_payroll.sql`](supabase/migrations/00039_hr_payroll.sql) in Supabase SQL Editor.

### Net pay formula (per employee, per month)

```
daily_rate = monthly_salary ÷ working_days_in_month (Mon–Fri only)
leave_deduction = daily_rate × unpaid_leave_weekdays
gross_pay = monthly_salary − leave_deduction + approved_bonuses
advance_deduction = min(outstanding_advances, gross_pay)
net_pay = gross_pay − advance_deduction   (minimum 0)
```

- **Paid leave** — no salary deduction
- **Unpaid leave** — deducts pro-rata for weekdays overlapping the pay month
- **Advances** — approved advances with balance remaining; deducted on finalize
- **Bonuses** — approved bonuses tagged to the pay month

### Test checklist

- [ ] `npm run test:payroll` passes
- [ ] Record unpaid leave → payroll preview shows deduction
- [ ] Record paid leave → no deduction
- [ ] Approve advance → deducted on payroll finalize
- [ ] Approve bonus → added to net pay
- [ ] Accounts role can open payroll; admin can finalize

---

## Production migrations (full list)

Before deploying to a **new** Supabase project, run migrations manually in **SQL Editor** — one file per query unless noted.

```bash
npm run audit:migrations
```

That prints the authoritative run order, skip list, and split pairs.

### Do not run

| File | Reason |
|------|--------|
| ~~`00040_expense_payment_made.sql`~~ | Removed — was a comment-only stub |

### Skip on fresh database (run replacement)

| Skip | Use instead |
|------|-------------|
| `00004_users_update_own.sql` | `00005_users_last_login_only.sql` |

### Two-step runs (wait for success between)

| Step 1 | Step 2 |
|--------|--------|
| `00013_processing_session_approval.sql` | `00014_processing_session_approval_apply.sql` |
| `00040_expense_payment_made_enum.sql` | `00041_expense_payment_made_apply.sql` |
| `00049_rbac_enum_values.sql` | `00050_rbac_and_dual_approval_apply.sql` |

### After Phase 9 (00036–00039)

Run in order:

1. `00037_office_board.sql`
2. `00038_attendance_geofence.sql`
3. `00039_hr_payroll.sql`
4. `00040_hr_payroll_individual.sql`
5. `00040_expense_payment_made_enum.sql` then `00041_expense_payment_made_apply.sql` (split)
6. `00042_pre_stock_depleted_kg.sql` through `00048_waste_reprocessing.sql`
7. `00049_rbac_enum_values.sql` then `00050_rbac_and_dual_approval_apply.sql` (split)
8. `00052_procurement_cash_confirmation.sql`
9. `00053_cash_manager_processing_read.sql`

Note: two files share the `00040_` prefix (`hr_payroll_individual` and `expense_payment_made_enum`) — the old combined stub was removed.

---

## Next (post Phase 9)

Per architecture doc — only after Phase 9 ships:

- Audit logs
- SOP management
- CAPA / quality / ISO compliance layer
