import { queryBigQuery, insertBigQuery } from '../../lib/bigquery-auth.js';

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
          is_existing: is_existing ? 'true' : 'false',
          contacts: JSON.stringify(contacts),
          tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
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
      const { company_name, status, notes, tags, is_existing, contacts, created_at } = req.body;

      if (!company_name) {
        return res.status(400).json({ error: 'company_name required' });
      }

      const now = new Date().toISOString();
      const safeCompanyName = escapeSql(company_name);
      const safeStatus = escapeSql(status || 'need-followup');
      const safeNotes = escapeSql(notes || '');
      const safeContacts = escapeSql(JSON.stringify(contacts || []));
      const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : '[]';
      const safeTags = escapeSql(tagsJson);
      const safeIsExisting = is_existing ? 'true' : 'false';

      // Use UPDATE to modify the record
      const updateSql = `
        UPDATE \`${process.env.BIGQUERY_PROJECT_ID}.${process.env.BIGQUERY_DATASET || 'travel_cat'}.superzoo_leads\`
        SET
          status = '${safeStatus}',
          notes = '${safeNotes}',
          is_existing = '${safeIsExisting}',
          contacts = '${safeContacts}',
          tags = '${safeTags}',
          updated_at = CURRENT_TIMESTAMP()
        WHERE company_name = '${safeCompanyName}'
      `;

      await queryBigQuery(updateSql);
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
