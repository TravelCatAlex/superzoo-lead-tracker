import { queryBigQuery, insertBigQuery } from '../../lib/bigquery-auth.js';

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
            createdAt: f[6].v,
            updatedAt: f[7].v,
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
      const { company_name, status, notes, is_existing, contacts } = req.body;

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
          is_existing: is_existing ? 'true' : 'false',
          contacts: JSON.stringify(contacts),
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
      const { company_name, status, notes } = req.body;

      if (!company_name) {
        return res.status(400).json({ error: 'company_name required' });
      }

      // BigQuery doesn't support UPDATE from API, so we delete and reinsert
      const sql = `
        DELETE FROM \`${process.env.BIGQUERY_PROJECT_ID}.${process.env.BIGQUERY_DATASET || 'travel_cat'}.superzoo_leads\`
        WHERE company_name = '${company_name.replace(/'/g, "\\'")}'
      `;

      await queryBigQuery(sql);

      // Fetch the full record (client should pass it)
      const contacts = req.body.contacts || [];
      const is_existing = req.body.is_existing || false;

      const now = new Date().toISOString();
      const rows = [
        {
          company_id: `${company_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          company_name,
          status: status || 'need-followup',
          notes: notes || '',
          is_existing: is_existing ? 'true' : 'false',
          contacts: JSON.stringify(contacts),
          created_at: req.body.created_at || now,
          updated_at: now,
        },
      ];

      await insertBigQuery('superzoo_leads', rows);
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

      const sql = `
        DELETE FROM \`${process.env.BIGQUERY_PROJECT_ID}.${process.env.BIGQUERY_DATASET || 'travel_cat'}.superzoo_leads\`
        WHERE company_name = '${company_name.replace(/'/g, "\\'")}'
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
