# Supabase setup — global leaderboard

~10 minutes. Free tier is plenty to launch.

## 1. Create the project
1. Go to **supabase.com** → sign in → **New project**.
2. Name it (e.g. `chartmatch`), set a database password, pick a region near your users → **Create**.

## 2. Create the table
1. Left sidebar → **SQL Editor** → **New query**.
2. Paste the entire contents of **`supabase-schema.sql`** → **Run**.
3. You should see "Success". (This creates the `profiles` table, enables RLS, and adds the policies.)

## 3. Enable anonymous sign-ins
The leaderboard gives each player a frictionless identity via anonymous auth.
1. Left sidebar → **Authentication** → **Sign In / Providers** (or **Providers**).
2. Find **Anonymous sign-ins** → toggle it **on** → save.

## 4. Grab your two values
1. Left sidebar → **Project Settings** → **API** (or **Data API**).
2. Copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
3. Copy the **anon / publishable key** (the *public* one — safe to ship in the browser; it is **not** the `service_role` secret).

## 5. Paste them into the app
Open **`index.html`**, near the top of the main `<script>` find:

```js
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';
```

Fill them in:

```js
const SUPABASE_URL = 'https://abcd1234.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_...';   // or the eyJ... anon key
```

Save, redeploy. The **🏆 Leaderboard** button will now let players pick a name and join the global board. With the fields blank, the app stays in local-only mode (personal stats only) — so it never breaks if the keys aren't set.

## Important
- The **anon/publishable** key is meant to be public; your data is protected by the RLS policies in the schema. **Never** put the `service_role` key in the browser.
- Anonymous identity is per browser/device — a user who clears data or switches devices starts fresh. Permanent accounts (email/Google) are a later step (see `LAUNCH.md`).
