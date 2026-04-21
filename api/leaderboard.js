const https = require('https');

const SHEETS_URL = 'AKfycbwtMJE9Fz7nM2K8F9jFLrxrGRGPdx7yXwy42ygNxuJaz45_J53tgVmaAtgFBpInOVUH';

function getFromSheets() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'script.google.com',
      path: `/macros/s/${SHEETS_URL}/exec`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    let redirected = false;
    const req = https.request(options, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const loc = res.headers.location;
        if (loc && !redirected) {
          redirected = true;
          const url = new URL(loc);
          const opts2 = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET'
          };
          https.request(opts2, (res2) => {
            let body = '';
            res2.on('data', (c) => body += c);
            res2.on('end', () => {
              try { resolve(JSON.parse(body)); }
              catch(e) { resolve({ leaderboard: [] }); }
            });
          }).on('error', () => resolve({ leaderboard: [] })).end();
        }
        return;
      }
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve({ leaderboard: [] }); }
      });
    });
    req.on('error', () => resolve({ leaderboard: [] }));
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const data = await getFromSheets();
    res.status(200).json(data);
  } catch (e) {
    res.status(200).json({ leaderboard: [] });
  }
};
