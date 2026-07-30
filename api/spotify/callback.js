import { getCredentials, getCookies } from '../_utils.js';

export default async function handler(req, res) {
  const { clientId, clientSecret, redirectUri } = getCredentials();

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rider-iq-seven.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const frontendUrl = process.env.FRONTEND_URL || `${proto}://${host}`;

  const { code, state, error } = req.query || {};
  const cookies = getCookies(req);
  const storedState = cookies.spotify_auth_state;

  const clearStateCookie = `spotify_auth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

  if (error || !state || state !== storedState) {
    console.warn("OAuth Callback Error or State Mismatch:", { error, state, storedState });
    res.setHeader('Set-Cookie', [clearStateCookie]);
    return res.redirect(302, `${frontendUrl}/#spotify-intercom?error=${encodeURIComponent(String(error || 'state_mismatch'))}`);
  }

  if (!code) {
    res.setHeader('Set-Cookie', [clearStateCookie]);
    return res.redirect(302, `${frontendUrl}/#spotify-intercom?error=no_code_provided`);
  }

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri
      }).toString()
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok || !data.access_token) {
      console.error("Token Exchange Error:", data);
      res.setHeader('Set-Cookie', [clearStateCookie]);
      return res.redirect(302, `${frontendUrl}/#spotify-intercom?error=${encodeURIComponent(data.error_description || 'token_exchange_failed')}`);
    }

    const expiresInSec = data.expires_in || 3600;
    const expiryTime = Date.now() + expiresInSec * 1000;

    const cookieList = [
      clearStateCookie,
      `spotify_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${expiresInSec}`,
      `spotify_token_expires=${expiryTime}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    ];

    if (data.refresh_token) {
      cookieList.push(`spotify_refresh_token=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    }

    res.setHeader('Set-Cookie', cookieList);
    return res.redirect(302, `${frontendUrl}/#spotify-intercom?spotify=connected`);
  } catch (err) {
    console.error("Error exchanging Spotify code:", err);
    res.setHeader('Set-Cookie', [clearStateCookie]);
    return res.redirect(302, `${frontendUrl}/#spotify-intercom?error=server_error`);
  }
}
