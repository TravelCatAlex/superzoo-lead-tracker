# SuperZoo Lead Tracker

A shared team dashboard for tracking and managing SuperZoo trade show leads. Built with Next.js, deployed on Vercel, with data persisted in BigQuery.

**Live Dashboard:** `https://superzoo-leads.vercel.app` (after deployment)

## Quick Setup (5 minutes)

### 1. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new) and create a new repository
   - **Owner:** `Travel-Cat-Shop` (your org)
   - **Repository name:** `superzoo-lead-tracker`
   - **Visibility:** Private
   - **Add .gitignore for Node.js:** Yes

2. Clone the repo locally and add files:
   ```bash
   git clone https://github.com/Travel-Cat-Shop/superzoo-lead-tracker.git
   cd superzoo-lead-tracker
   # Copy all files from this directory into the repo
   git add .
   git commit -m "Initial commit: SuperZoo lead tracker"
   git push origin main
   ```

### 2. Set Up BigQuery Table

1. Go to [BigQuery Console](https://console.cloud.google.com/bigquery)
2. Select project: `travelcat-analytics`
3. Open the **SQL Editor** and run the schema file:
   ```sql
   -- Run the contents of schema/superzoo_leads.sql
   ```
   This creates the `superzoo_leads` table in the `travel_cat` dataset.

4. Verify the table exists:
   ```sql
   SELECT COUNT(*) FROM `travelcat-analytics.travel_cat.superzoo_leads`
   ```

### 3. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in
2. **Import Git Repository:** Select `Travel-Cat-Shop/superzoo-lead-tracker`
3. **Framework:** Next.js (auto-detected)
4. **Environment Variables:** Add these from Vercel Settings:
   ```
   BIGQUERY_PROJECT_ID = travelcat-analytics
   BIGQUERY_DATASET = travel_cat
   GOOGLE_SERVICE_ACCOUNT_EMAIL = claude-bigquery-readonly@travelcat-analytics.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = (copy from Vercel env vars of travelcat-analytics project)
   ```

   **Where to find the private key:**
   - Go to your existing Vercel project: `travelcat-analytics`
   - Settings → Environment Variables
   - Copy the value of `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - Paste it into the new project's env vars

5. **Deploy:** Click "Deploy"
6. **Wait for build** (2–3 minutes)
7. Your dashboard is live! Vercel assigns a default URL like `superzoo-leads.vercel.app`

### 4. Custom Domain (Optional)

1. In Vercel project settings: **Domains**
2. Add custom domain (e.g., `leads.travelcatshop.com`)
3. Follow DNS setup instructions

---

## Features

### For Danny (Wholesale Sales)

- **Lead Status Tracking** — Track each company from discovery through close
  - Need follow-up
  - Contacted
  - Interested
  - Proposal sent
  - Qualified
  - Won / Lost

- **Per-Company Notes** — Document follow-up strategy, product interests, pricing discussions, next steps

- **Existing Customer Flag** — Automatically identifies known Travel Cat customers (Petland, Chewy, Meijer, All Creatures Solutions, Homes Alive Pets, Mounds Pet Food)

- **Search & Filter** — Find leads by company name or filter by status

- **Export to CSV** — Pull pipeline data anytime for reporting

### Team Collaboration

- **Shared Dashboard** — Everyone sees live updates (no refresh needed if data is updated)
- **Real-time Updates** — Changes sync to BigQuery instantly
- **No Local Files** — All data centralized in BigQuery (no "final_v3" spreadsheets)

---

## Architecture

```
GitHub (source of truth)
    ↓
Vercel (auto-deploys on push)
    ├─ Next.js frontend
    └─ API endpoints
         ↓
      BigQuery (persistence)
         └─ superzoo_leads table
```

### API Endpoints

#### `GET /api/leads`
Fetch all leads from BigQuery.

**Response:**
```json
{
  "leads": {
    "Meijer": {
      "name": "Meijer",
      "contacts": [{"name": "Erin Ashcraft", "title": "Buyer", "email": "...", "phone": "..."}],
      "status": "need-followup",
      "notes": "",
      "isExisting": true,
      "createdAt": "2026-08-18T...",
      "updatedAt": "2026-08-18T..."
    },
    ...
  }
}
```

#### `POST /api/leads`
Create a new lead.

**Request:**
```json
{
  "company_name": "New Company",
  "contacts": [{"name": "John Doe", "title": "Manager", "email": "...", "phone": "..."}],
  "status": "need-followup",
  "notes": "",
  "is_existing": false
}
```

#### `PUT /api/leads`
Update an existing lead (status, notes, etc.).

**Request:**
```json
{
  "company_name": "Meijer",
  "status": "contacted",
  "notes": "Called Erin, interested in fall line",
  "contacts": [...],
  "is_existing": true
}
```

#### `DELETE /api/leads`
Delete a lead.

**Request:**
```json
{
  "company_name": "Company Name"
}
```

---

## Development

### Local Setup

```bash
# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your BigQuery credentials

# Run dev server
npm run dev
```

Visit `http://localhost:3000`

### Making Changes

1. Edit files in the repo
2. Test locally (`npm run dev`)
3. Commit and push to GitHub
4. Vercel auto-deploys within 1 minute

### File Structure

```
superzoo-lead-tracker/
├── pages/
│   ├── index.js              # Main dashboard page
│   └── api/
│       └── leads.js          # API endpoints (GET/POST/PUT/DELETE)
├── lib/
│   └── bigquery-auth.js      # BigQuery JWT authentication
├── styles/
│   └── Home.module.css       # Dashboard styles
├── schema/
│   └── superzoo_leads.sql    # BigQuery table schema
├── package.json
├── next.config.js
├── vercel.json
└── README.md
```

---

## Troubleshooting

### API returns 500 error

**Check environment variables:**
```bash
# In Vercel project settings → Environment Variables, verify:
- BIGQUERY_PROJECT_ID
- BIGQUERY_DATASET
- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (is it properly escaped?)
```

**Check BigQuery permissions:**
- Service account must have **BigQuery Data Editor** role (not just Viewer)
- Table must exist: `travelcat-analytics.travel_cat.superzoo_leads`

**Check logs:**
```bash
# In Vercel dashboard → Deployments → click latest → Function Logs
# Look for "BigQuery error" or JWT signing errors
```

### Dashboard loads but no leads appear

1. **BigQuery table is empty** — Run the schema SQL to create the table
2. **API not connected** — Check browser Network tab for `/api/leads` requests
3. **BigQuery auth failing** — Check function logs for "Failed to get BigQuery token"

### Can't push to GitHub

```bash
git remote -v  # Check origin URL
git pull origin main --rebase
git push origin main
```

---

## Adding Leads Manually

If you want to pre-populate with the SuperZoo CSV data:

1. Export from the widget dashboard as CSV
2. In BigQuery console, create an insert query:
   ```sql
   INSERT INTO `travelcat-analytics.travel_cat.superzoo_leads`
   (company_id, company_name, status, notes, is_existing, contacts, created_at, updated_at)
   VALUES
   ('meijer-1', 'Meijer', 'need-followup', '', 'true', '[]', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
   ...
   ```

Or use the API:
```bash
curl -X POST https://superzoo-leads.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Company Name",
    "contacts": [{"name": "John", "title": "Buyer", "email": "john@...", "phone": "..."}],
    "status": "need-followup",
    "notes": "",
    "is_existing": false
  }'
```

---

## Next Steps

### Enhance the Dashboard

- **Slack Integration** — Post updates to `#sales-pipeline` when a lead wins
- **Email Reminders** — Notify Danny of leads approaching 30-day follow-up window
- **Bulk Import** — Upload SuperZoo CSV directly from dashboard
- **Activity Log** — Track who updated what and when
- **Merge Duplicates** — Handle companies that appear under multiple names

### Connect to Analytics

- Sync with Travel Cat Analytics API (`/api/warehouse`, `/api/chat`)
- Pull wholesale order history from Shopify
- Show product interest from trade show notes

---

## Team Access

**Share this URL with the team:**
- Vercel deployment URL (e.g., `https://superzoo-leads.vercel.app`)
- No login required — publicly readable (but modify in next.config.js if private needed)

**Who can modify data:**
- Anyone with access to this dashboard
- Recommend: Danny (primary user), Alex, Ian

---

## Support

Questions? Issues?

1. Check Vercel function logs (Deployments → Logs)
2. Run `npm run build` locally to catch build errors
3. Verify BigQuery table schema matches `schema/superzoo_leads.sql`
4. Check GitHub Actions (if added) for CI/CD failures

---

**Last Updated:** August 2026  
**Maintainer:** Travel Cat Data Team
