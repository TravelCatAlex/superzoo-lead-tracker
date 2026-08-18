# SuperZoo Lead Tracker — Deployment Checklist

Follow these steps in order. Each section takes ~5 minutes.

---

## ✅ Step 1: GitHub Repository (5 min)

### 1.1 Create Repository on GitHub

- [ ] Go to [github.com/new](https://github.com/new)
- [ ] **Owner:** Select `Travel-Cat-Shop` (your organization)
- [ ] **Repository name:** `superzoo-lead-tracker`
- [ ] **Description:** "SuperZoo lead tracking dashboard for wholesale team"
- [ ] **Visibility:** Private ✓
- [ ] **Initialize with .gitignore:** Node
- [ ] **License:** MIT (optional)
- [ ] Click **Create repository**

### 1.2 Push Code to GitHub

```bash
# Clone the repository you just created
git clone https://github.com/Travel-Cat-Shop/superzoo-lead-tracker.git
cd superzoo-lead-tracker

# Remove the default README if it exists
rm README.md || true

# Copy all files from this directory (pages/, lib/, styles/, package.json, etc.)
# into the superzoo-lead-tracker directory

# Add all files
git add .

# Commit
git commit -m "Initial commit: SuperZoo lead tracker

- Next.js dashboard for managing SuperZoo leads
- BigQuery backend for persistence
- API endpoints for CRUD operations
- Deployed to Vercel"

# Push to GitHub
git push origin main
```

**Verify:**
- [ ] GitHub repo contains all files (pages/, lib/, styles/, package.json, etc.)
- [ ] Latest commit message appears on GitHub

---

## ✅ Step 2: BigQuery Table Setup (5 min)

### 2.1 Create BigQuery Table

1. [ ] Go to [console.cloud.google.com/bigquery](https://console.cloud.google.com/bigquery)
2. [ ] Select project: **travelcat-analytics**
3. [ ] Click **SQL Editor** (top left)
4. [ ] Copy and paste the entire contents of `schema/superzoo_leads.sql`
5. [ ] Click **Run** (top right)
6. [ ] Wait for success message

### 2.2 Verify Table Was Created

```sql
-- Run this query to verify
SELECT COUNT(*) as row_count FROM `travelcat-analytics.travel_cat.superzoo_leads`
```

- [ ] Query returns `0` rows (empty table is fine)
- [ ] Table name appears in left sidebar under `travel_cat` dataset

### 2.3 Grant BigQuery Permissions (if not already done)

The service account `claude-bigquery-readonly@travelcat-analytics.iam.gserviceaccount.com` needs **BigQuery Data Editor** role:

1. [ ] Go to [console.cloud.google.com/iam-admin/iam](https://console.cloud.google.com/iam-admin/iam)
2. [ ] Select project: **travelcat-analytics**
3. [ ] Find `claude-bigquery-readonly@travelcat-analytics.iam.gserviceaccount.com` in the list
4. [ ] Click the pencil icon to edit
5. [ ] Verify role includes **BigQuery Data Editor** (not just Viewer)
6. [ ] If missing, click **Add Another Role** and select it
7. [ ] Click **Save**

---

## ✅ Step 3: Vercel Deployment (10 min)

### 3.1 Connect GitHub to Vercel

1. [ ] Go to [vercel.com/new](https://vercel.com/new)
2. [ ] Sign in with your Vercel account (same account used for travelcat-analytics project)
3. [ ] Click **Continue with GitHub**
4. [ ] Authorize Vercel to access your GitHub account
5. [ ] Search for and select: **Travel-Cat-Shop/superzoo-lead-tracker**
6. [ ] Click **Import**

### 3.2 Configure Project

**Framework Preset:** Should auto-detect Next.js ✓

**Environment Variables:**

Add these 4 variables:

| Name | Value | Source |
|------|-------|--------|
| `BIGQUERY_PROJECT_ID` | `travelcat-analytics` | Copy as-is |
| `BIGQUERY_DATASET` | `travel_cat` | Copy as-is |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `claude-bigquery-readonly@travelcat-analytics.iam.gserviceaccount.com` | Copy as-is |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | *(see below)* | Copy from existing project |

**How to find `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`:**

1. [ ] Open a new tab: [vercel.com/dashboard](https://vercel.com/dashboard)
2. [ ] Find the existing **travelcat-analytics** project
3. [ ] Click into it
4. [ ] Go to **Settings** → **Environment Variables**
5. [ ] Find `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
6. [ ] Click the copy icon
7. [ ] Go back to the superzoo-lead-tracker deployment form
8. [ ] Paste into the `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` field

### 3.3 Deploy

- [ ] All 4 environment variables filled in
- [ ] Click **Deploy**
- [ ] Wait 2–3 minutes for build to complete
- [ ] Should see "Congratulations! Deployment successful"

### 3.4 Verify Deployment

1. [ ] Click the preview link or visit the default URL (e.g., `superzoo-lead-tracker.vercel.app`)
2. [ ] Dashboard loads (should see "SuperZoo Lead Tracker" heading)
3. [ ] No errors in console
4. [ ] API check: Open browser DevTools → Network tab → refresh → look for `/api/leads` request (should be 200)

**If `/api/leads` returns 500:**
- [ ] Check Vercel function logs: **Deployments** → click latest → **Function Logs**
- [ ] Look for error message (usually "BigQuery error" or "JWT signing failed")
- [ ] Verify environment variables are correct
- [ ] Verify BigQuery table exists

---

## ✅ Step 4: Initial Data Load (5 min)

### 4.1 Load SuperZoo CSV Data

You have two options:

**Option A: Via BigQuery SQL (Recommended)**

1. [ ] Go back to [BigQuery console](https://console.cloud.google.com/bigquery)
2. [ ] Open **SQL Editor**
3. [ ] Run an INSERT query (see README.md for example format)
4. [ ] Or manually add a few test records:

```sql
INSERT INTO `travelcat-analytics.travel_cat.superzoo_leads`
(company_id, company_name, status, notes, is_existing, contacts, created_at, updated_at)
VALUES
(
  'meijer-1',
  'Meijer',
  'need-followup',
  '',
  'true',
  '[{"name":"Erin Ashcraft","title":"Buyer","email":"Erin.Ashcraft@meijer.com","phone":"16164536711"}]',
  CURRENT_TIMESTAMP(),
  CURRENT_TIMESTAMP()
);
```

**Option B: Via API**

```bash
curl -X POST https://superzoo-lead-tracker.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Meijer",
    "contacts": [{"name": "Erin Ashcraft", "title": "Buyer", "email": "Erin.Ashcraft@meijer.com", "phone": "16164536711"}],
    "status": "need-followup",
    "notes": "",
    "is_existing": true
  }'
```

### 4.2 Verify Data Loads

1. [ ] Refresh the dashboard: `https://superzoo-lead-tracker.vercel.app`
2. [ ] Should see leads appear in the list
3. [ ] Should see stats update (Total leads, etc.)
4. [ ] Click a company to expand and see contact details

---

## ✅ Step 5: Share with Team (2 min)

### 5.1 Give Team Access

Send this to Danny and the team:

```
🚀 SuperZoo Lead Tracker is live!

Dashboard: https://superzoo-lead-tracker.vercel.app

This is your shared lead pipeline tracker. Here's what you can do:

✅ View all 79 SuperZoo leads
✅ Update status (Need follow-up → Interested → Won)
✅ Add notes for follow-up strategy
✅ Search and filter by company or status
✅ Export pipeline to CSV anytime

No login needed. Updates are real-time and synced to BigQuery.

Questions? Contact: [Alex/Ian]
```

### 5.2 Optional: Custom Domain

If you want a custom domain like `leads.travelcatshop.com`:

1. [ ] In Vercel project: **Settings** → **Domains**
2. [ ] Add your domain
3. [ ] Follow DNS setup instructions
4. [ ] Test with `https://leads.travelcatshop.com`

---

## ✅ Step 6: Future Maintenance

### Add More Leads

From dashboard:
- Coming soon: Bulk CSV upload button

From BigQuery console:
- Use INSERT queries to add leads

From API:
- POST requests (see README.md)

### Update Dashboard Code

1. [ ] Edit files in GitHub repo
2. [ ] Commit and push
3. [ ] Vercel auto-deploys within 1 minute
4. [ ] Refresh dashboard to see changes

### Monitor Health

- [ ] Check Vercel dashboard weekly for errors
- [ ] Monitor BigQuery usage (shouldn't cost much)
- [ ] Verify API response times stay <1s

---

## 🎉 You're Done!

Your team now has a shared, real-time lead tracking dashboard deployed on Vercel and backed by BigQuery.

### Next Steps

- [ ] Share the URL with Danny
- [ ] Have Danny test updating lead statuses
- [ ] Load full SuperZoo CSV data
- [ ] Integrate with Slack (optional, see README.md for ideas)
- [ ] Set up email reminders for 30-day follow-up (optional)

---

**Questions?**

- Check the **README.md** for more details
- Look at Vercel **Function Logs** if API errors occur
- Verify **BigQuery table schema** matches `schema/superzoo_leads.sql`
- Check **GitHub Actions** for deployment status
