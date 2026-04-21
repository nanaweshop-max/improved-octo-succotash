const https = require('https');

const CHANNEL_ID = '2009845175';
const REDIRECT_URI = 'https://improved-octo-succotash.vercel.app';

// 用 code 換 access token
function getToken(code) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CHANNEL_ID,
      client_secret: process.env.LINE_CHANNEL_SECRET || ''
    }).toString();

    const options = {
      hostname: 'api.line.me',
      path: '/oauth2/v2.1/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(params)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(params);
    req.end();
  });
}

// 用 access token 取得 profile
function getProfile(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.line.me',
      path: '/v2/profile',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const { code } = req.body;
    if (!code) { res.status(400).json({ error: 'missing code' }); return; }

    const token = await getToken(code);
    if (!token.access_token) {
      res.status(400).json({ error: 'token failed', detail: token });
      return;
    }

    const profile = await getProfile(token.access_token);
    res.status(200).json({
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
