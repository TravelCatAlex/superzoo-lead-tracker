import crypto from 'crypto';

export async function getBigQueryAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY not set');
  }

  // Unescape the key (Vercel env vars escape \n)
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

export async function queryBigQuery(sql) {
  const token = await getBigQueryAccessToken();
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  const dataset = process.env.BIGQUERY_DATASET || 'travel_cat';

  const response = await fetch(
    `https://www.googleapis.com/bigquery/v2/projects/${projectId}/queries?useLegacySql=false`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
        timeoutMs: 30000,
        useLegacySql: false,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`BigQuery error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

export async function insertBigQuery(table, rows) {
  const token = await getBigQueryAccessToken();
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  const dataset = process.env.BIGQUERY_DATASET || 'travel_cat';

  const response = await fetch(
    `https://www.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${dataset}/tables/${table}/insertAll`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rows: rows.map((row, idx) => ({
          insertId: `${table}-${Date.now()}-${idx}`,
          json: row,
        })),
        skipInvalidRows: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`BigQuery insert error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}
