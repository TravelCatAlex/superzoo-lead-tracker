-- Create SuperZoo leads table in BigQuery
-- Run this in BigQuery console to set up the table
-- Project: travelcat-analytics
-- Dataset: travel_cat

CREATE OR REPLACE TABLE `travelcat-analytics.travel_cat.superzoo_leads` (
  company_id STRING NOT NULL,
  company_name STRING NOT NULL,
  status STRING,
  notes STRING,
  is_existing STRING,
  contacts STRING,  -- JSON array of contact objects
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
PARTITION BY DATE(updated_at)
CLUSTER BY company_name;

-- Create unique index-like view for deduplication (keep most recent)
CREATE OR REPLACE VIEW `travelcat-analytics.travel_cat.superzoo_leads_latest` AS
SELECT
  company_id,
  company_name,
  status,
  notes,
  is_existing,
  contacts,
  created_at,
  updated_at,
  ROW_NUMBER() OVER (PARTITION BY company_name ORDER BY updated_at DESC) AS rn
FROM `travelcat-analytics.travel_cat.superzoo_leads`
WHERE rn = 1;
