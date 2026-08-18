# SuperZoo Lead Tracker — Quick Start

**3-step deployment: GitHub → Vercel → Live Dashboard**

---

## 📦 Project Structure

Complete file structure ready to push to GitHub:

```
superzoo-lead-tracker/
├── pages/                          # Next.js pages
│   ├── _app.js                    # App initialization
│   ├── _document.js               # HTML document structure
│   ├── index.js                   # Main dashboard page
│   └── api/
│       └── leads.js               # API endpoints (GET/POST/PUT/DELETE)
├── lib/
│   └── bigquery-auth.js           # BigQuery JWT authentication
├── styles/
│   ├── globals.css                # Global styles
│   └── Home.module.css            # Dashboard component styles
├── schema/
│   └── superzoo_leads.sql         # BigQuery table schema
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── package.json                   # NPM dependencies
├── next.config.js                 # Next.js configuration
├── vercel.json                    # Vercel deployment config
├── README.md                      # Full documentation
├── DEPLOYMENT_CHECKLIST.md        # Step-by-step deployment guide
└── QUICKSTART.md                  # This file
```

---

## 🚀 Deployment in 3 Steps

### Step 1: Create GitHub Repo & Push Code (5 min)

```bash
# 1. Create repo on GitHub
#    - Go to github.com/new
#    - Owner: Travel-Cat-Shop
#    - Name: superzoo-lead-tracker
#    - Private ✓
#    - Add .gitignore: Node

# 2. Clone and push code
git clone https://github.com/Travel-Cat-Shop/superzoo-lead-tracker.git
cd superzoo-lead-tracker

# Copy all files from this project into the directory
# (pages/, lib/, styles/, schema/, .env.example, package.json, etc.)

git add .
git commit -m "Initial commit: SuperZoo lead tracker"
git push origin main
```

**Result:** Code is on GitHub ✓

---

### Step 2: Set Up BigQuery Table (5 min)

```sql
-- 1. Go to BigQuery console
-- 2. Select project: travelcat-analytics
-- 3. Click SQL Editor
-- 4. Copy & run this SQL:

CREATE OR REPLACE TABLE `travelcat-analytics.travel_cat.superzoo_leads` (
  company_id STRING NOT NULL,
  company_name STRING NOT NULL,
  status STRING,
  notes STRING,
  is_existing STRING,
  contacts STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
PARTITION BY DATE(updated_at)
CLUSTER BY company_name;
```

**Result:** BigQuery table is ready ✓

---

### Step 3: Deploy to Vercel (10 min)

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **Import Git Repository**
3. Find & select: **Travel-Cat-Shop/superzoo-lead-tracker**
4. Click **Import**

**Environment Variables:**

| Name | Value |
|------|-------|
| `BIGQUERY_PROJECT_ID` | `travelcat-analytics` |
| `BIGQUERY_DATASET` | `travel_cat` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `claude-bigquery-readonly@travelcat-analytics.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | *(copy from existing travelcat-analytics Vercel project env vars)* |

Click **Deploy** and wait 2–3 minutes.

**Result:** Dashboard is live! ✓

Visit: `https://superzoo-lead-tracker.vercel.app` (or your custom domain)

---

## 🎯 Using the Dashboard

### For Danny (Wholesale Sales)

1. **View Leads** → All 79 SuperZoo companies pre-loaded
2. **Update Status** → Expand company, select status from dropdown
3. **Add Notes** → Document follow-up strategy, product interests
4. **Search** → Find leads by company name
5. **Filter** → By status (Need follow-up, Interested, Won, etc.) or Existing customers
6. **Export** → Download pipeline as CSV anytime

### Data Updates

- Changes sync instantly to BigQuery
- No refresh needed — all team members see live updates
- Full history stored for auditing

---

## 📊 Key Features

| Feature | Details |
|---------|---------|
| **Lead Status Tracking** | Need follow-up → Contacted → Interested → Proposal → Qualified → Won/Lost |
| **Per-Company Notes** | Document every interaction, follow-up strategy, product interests |
| **Contact Management** | Name, title, email, phone for each buyer |
| **Existing Customer Flag** | Auto-flagged for known Travel Cat accounts (Petland, Chewy, Meijer, etc.) |
| **Search & Filter** | By company name, status, or existing customer |
| **CSV Export** | Download pipeline for reporting |
| **Real-Time Sync** | All changes persist to BigQuery instantly |
| **Team Collaboration** | No file sharing — everyone sees live dashboard |

---

## 🔧 API Endpoints

**Dashboard uses these endpoints automatically. For manual testing:**

### Fetch All Leads
```bash
curl https://superzoo-lead-tracker.vercel.app/api/leads
```

### Create Lead
```bash
curl -X POST https://superzoo-lead-tracker.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "New Company",
    "contacts": [{"name": "John Doe", "title": "Manager", "email": "john@...", "phone": "555-1234"}],
    "status": "need-followup",
    "notes": "",
    "is_existing": false
  }'
```

### Update Lead
```bash
curl -X PUT https://superzoo-lead-tracker.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Meijer",
    "status": "interested",
    "notes": "Interested in fall line, send samples",
    "contacts": [...],
    "is_existing": true
  }'
```

### Delete Lead
```bash
curl -X DELETE https://superzoo-lead-tracker.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Company Name"}'
```

---

## 🐛 Troubleshooting

### Dashboard loads but shows no leads

1. Check BigQuery table exists: `travelcat-analytics.travel_cat.superzoo_leads`
2. Check API logs in Vercel dashboard
3. Verify all 4 environment variables are set correctly
4. Try API directly: `curl https://superzoo-lead-tracker.vercel.app/api/leads`

### API returns 500 error

1. Open Vercel dashboard → Deployments → latest → Function Logs
2. Look for `BigQuery error` or `JWT signing failed`
3. Verify:
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` is properly escaped (has `\n` for newlines)
   - Service account has **BigQuery Data Editor** role
   - Project ID and dataset are correct

### Changes don't save

1. Check browser console for network errors
2. Verify API `/leads` endpoint responds to PUT requests
3. Check BigQuery quota (unlikely to be an issue)

---

## 📝 Making Code Changes

1. Edit files in your local repo (e.g., `pages/index.js`)
2. Test locally: `npm install && npm run dev`
3. Commit and push: `git add . && git commit -m "..." && git push`
4. Vercel auto-deploys within 1 minute
5. Visit dashboard to see changes

---

## 🌐 Custom Domain (Optional)

To use `leads.travelcatshop.com` instead of `superzoo-lead-tracker.vercel.app`:

1. In Vercel project: Settings → Domains
2. Add domain: `leads.travelcatshop.com`
3. Follow DNS setup instructions
4. Test: `https://leads.travelcatshop.com`

---

## 📚 Full Documentation

- **README.md** — Comprehensive guide, architecture, API docs
- **DEPLOYMENT_CHECKLIST.md** — Step-by-step checklist for deployment
- **schema/superzoo_leads.sql** — BigQuery table schema
- **lib/bigquery-auth.js** — BigQuery authentication implementation
- **pages/api/leads.js** — API endpoints implementation

---

## 🎉 Next Steps

1. ✅ Push to GitHub
2. ✅ Create BigQuery table
3. ✅ Deploy to Vercel
4. ✅ Load SuperZoo data
5. ✅ Share URL with Danny
6. (Optional) Integrate with Slack
7. (Optional) Add email reminders

---

## 💬 Support

- GitHub Issues: Create an issue in the repo
- Vercel Logs: Dashboard → Deployments → Function Logs
- BigQuery Console: Test queries directly

---

**Built with:** Next.js, Vercel, BigQuery  
**Last Updated:** August 2026
