const https = require('https');

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwtMJE9Fz7nM2K8F9jFLrxrGRGPdx7yXwy42ygNxuJaz45_J53tgVmaAtgFBpInOVUH/exec';

// 送資料到 Google Sheets
function sendToSheets(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'script.google.com',
      path: '/macros/s/AKfycbwtMJE9Fz7nM2K8F9jFLrxrGRGPdx7yXwy42ygNxuJaz45_J53tgVmaAtgFBpInOVUH/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ ok: true, body }));
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'POST') {
    try {
      const payload = req.body;
      if (!payload || !payload.score) {
        res.status(400).json({ error: 'missing score' });
        return;
      }
      // 送到 Google Sheets（背景，不等回應）
      sendToSheets(payload).catch(() => {});
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
};
