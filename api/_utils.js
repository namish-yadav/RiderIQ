export function getCookies(req) {
  if (req.cookies) return req.cookies;
  const list = {};
  const rc = req.headers?.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts.shift()?.trim();
      if (key) {
        list[key] = decodeURIComponent(parts.join('='));
      }
    });
  }
  return list;
}

export function getCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID || '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'https://rider-iq-seven.vercel.app/api/spotify/callback';
  return { clientId, clientSecret, redirectUri };
}

export async function getValidAccessToken(req, res) {
  const { clientId, clientSecret } = getCredentials();
  const cookies = getCookies(req);

  let accessToken = cookies.spotify_access_token;
  const refreshToken = cookies.spotify_refresh_token;
  const tokenExpiresStr = cookies.spotify_token_expires;
  const tokenExpires = tokenExpiresStr ? parseInt(tokenExpiresStr, 10) : 0;

  // 1. Valid access token active (expires in > 60s)
  if (accessToken && Date.now() < tokenExpires - 60000) {
    return accessToken;
  }

  // 2. Refresh token flow
  if (refreshToken && clientId && clientSecret) {
    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString()
      });

      const data = await response.json();
      if (response.ok && data.access_token) {
        accessToken = data.access_token;
        const expiresInSec = data.expires_in || 3600;
        const expiryTime = Date.now() + expiresInSec * 1000;

        const newCookies = [
          `spotify_access_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${expiresInSec}`,
          `spotify_token_expires=${expiryTime}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
        ];
        if (data.refresh_token) {
          newCookies.push(`spotify_refresh_token=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
        }
        res.setHeader('Set-Cookie', newCookies);
        return accessToken;
      }
    } catch (e) {
      console.error("Error refreshing Spotify token in serverless function:", e);
    }
  }

  return null;
}
