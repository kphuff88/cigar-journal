# 🛠️ Admin screen — setup

This turns on the **Admin** option in your ⋮ menu (visible only to you). From
it you can edit the dropdown lists, see all users, give free access, delete
accounts, and moderate the cigar shops. You do this **once**.

Three parts — same pattern as the scanner and billing.

---

## Part A — Database tables
1. Supabase → **SQL Editor** → **New query**
2. Paste everything from **`supabase-admin.sql`** → **Run**
3. You should see "Success" (it creates the dropdown-list and free-access tables and seeds the current lists).

## Part B — Deploy the admin function
1. Supabase → **Edge Functions** → **Deploy a new function**
2. Name it **exactly**: `admin`
3. Delete the sample code, paste everything from
   `supabase/functions/admin/index.ts`
   (raw: `https://raw.githubusercontent.com/kphuff88/cigar-journal/main/supabase/functions/admin/index.ts`)
4. **Deploy** (leave "Verify JWT" ON)

## Part C — Tell it who the admin is
1. Supabase → **Edge Functions → Secrets**
2. Add:
   - **Name:** `ADMIN_EMAIL`
   - **Value:** `kphuff88@gmail.com`  ← the account that gets admin powers
3. **Save**

*(It reuses your existing `STRIPE_SECRET_KEY` secret to show who's subscribed. The service-role access it needs is provided automatically by Supabase.)*

---

## Using it
- Sign in on the app as **kphuff88@gmail.com** → open the **⋮** menu → **🛠️ Admin**.
- **Dropdown lists:** tap **×** to remove a choice, or type one and tap **Add**. Changes show up for everyone (they may need to reload).
- **People:** **Make free** gives unlimited access with no payment; **Remove free** undoes it. **Delete** removes an account and its cigars (asks you to confirm — can't be undone).
- **Cigar shops:** **Delete** removes a bad entry from the shared directory.

## Notes
- Only the `ADMIN_EMAIL` account sees or can use any of this. Everyone else gets "Not authorized" even if they poke at it.
- To hand admin to a different email later, just change the `ADMIN_EMAIL` secret.
- Deleting a user removes their database records; their photo files become orphaned but harmless.
