import { queryBigQuery } from '../../lib/bigquery-auth.js';
import crypto from 'crypto';

function escapeSql(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').substring(0, 1000);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const sql = `
        SELECT 
          company_id,
          company_name,
          status,
          notes,
          is_existing,
          contacts,
          tags,
          created_at,
          updated_at
        FROM \`${process.env.BIGQUERY_PROJECT_ID}.${process.env.BIGQUERY_DATASET || 'travel_cat'}.superzoo_leads\`
        ORDER BY updated_at DESC
      `;

      const result = await queryBigQuery(sql);
      const leads = {};

      if (result.rows) {
        result.rows.forEach(row => {
          const f = row.f;
          leads[f[1].v] = {
            name: f[1].v,
            contacts: JSON.parse(f[5].v || '[]'),
            status: f[2].v || 'need-followup',
            notes: f[3].v || '',
            isExisting: f[4].v === 'true' || f[4].v === true,
            tags: f[6].v ? JSON.parse(f[6].v) : [],
            createdAt: f[7].v,
            updatedAt: f[8].v,
          };
        });
      }

      res.status(200).json({ leads });
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { company_name, status, notes, is_existing, contacts, tags } = req.body;

      if (!company_name || !Array.isArray(contacts)) {
        return res.status(400).json({ error: 'company_name and contacts array required' });
      }

      const now = new Date().toISOString();
      const rows = [
        {
          company_id: `${company_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          company_name,
          status: status || 'need-followup',
          notes: notes || '',
          is_existing: isExisting ? 'true' : 'false',
          contacts: JSON.stringify(contacts),
          tags: tags && tags.length > 0 ? JSON.stringify(tags) : '[]',
          created_at: now,
          updated_at: now,
        },
      ];

      await insertBigQuery('superzoo_leads', rows);
      res.status(201).json({ success: true, company_name });
    } catch (error) {
      console.error('Failed to create lead:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
   const { company_name, status, notes, tags, isExisting, contacts, created_at } = req.body;

      if (!company_name) {
        return res.status(400).json({ error: 'company_name required' });
      }

      const now = new Date().toISOString();
      
      // Use a stable insertId based on company_name so BigQuery deduplicates
      // This effectively replaces the old record with the new one
      const insertId = `${company_name}`;

      const rows = [
        {
          insertId,
          json: {
            company_id: `${company_name.toLowerCase().replace(/\s+/g, '-')}`,
            company_name,
            status: status || 'need-followup',
            notes: notes || '',
           is_existing: isExisting ? 'true' : 'false',
            contacts: JSON.stringify(contacts || []),
            tags: tags && tags.length > 0 ? JSON.stringify(tags) : '[]',
            created_at: created_at || now,
            updated_at: now,
          },
        },
      ];

      const response = await fetch(
        `https://www.googleapis.com/bigquery/v2/projects/${process.env.BIGQUERY_PROJECT_ID}/datasets/${process.env.BIGQUERY_DATASET || 'travel_cat'}/tables/superzoo_leads/insertAll`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getBigQueryAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rows: rows,
            skipInvalidRows: false,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`BigQuery insert error: ${error.error?.message || 'Unknown error'}`);
      }

      res.status(200).json({ success: true, company_name });
    } catch (error) {
      console.error('Failed to update lead:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { company_name } = req.body;

      if (!company_name) {
        return res.status(400).json({ error: 'company_name required' });
      }

      const safeCompanyName = escapeSql(company_name);
      const sql = `
        DELETE FROM \`${process.env.BIGQUERY_PROJECT_ID}.${process.env.BIGQUERY_DATASET || 'travel_cat'}.superzoo_leads\`
        WHERE company_name = '${safeCompanyName}'
      `;

      await queryBigQuery(sql);
      res.status(200).json({ success: true, company_name });
    } catch (error) {
      console.error('Failed to delete lead:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getBigQueryAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY not set');
  }

  const unescapedKey = privateKey.includes('\\n') 
    ? privateKey.replace(/\\n/g, '\n') 
    : privateKey;

  const claimsObject = {
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/bigquery',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaims = Buffer.from(JSON.stringify(claimsObject)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedClaims}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(unescapedKey, 'base64url');

  const jwt = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get BigQuery token: ${tokenData.error_description}`);
  }

  return tokenData.access_token;
}
