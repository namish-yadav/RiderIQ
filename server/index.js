import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `http://localhost:${PORT}/api/spotify/callback`;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Helper: Basic Auth header for Spotify Token API
function getBasicAuthHeader() {
  return 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
}

// Helper: Automatically validate or refresh Spotify Access Token from HTTP-Only cookies
async function getValidAccessToken(req, res) {
  let accessToken = req.cookies.spotify_access_token;
  const refreshToken = req.cookies.spotify_refresh_token;
  const tokenExpiresStr = req.cookies.spotify_token_expires;
  const tokenExpires = tokenExpiresStr ? parseInt(tokenExpiresStr, 10) : 0;

  // 1. If access token is active and not expiring within 60s
  if (accessToken && Date.now() < tokenExpires - 60000) {
    return accessToken;
  }

  // 2. If access token is expired but refresh token exists, refresh it
  if (refreshToken && SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': getBasicAuthHeader(),
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
        const expiresInMs = (data.expires_in || 3600) * 1000;
        const newExpiry = Date.now() + expiresInMs;

        res.cookie('spotify_access_token', accessToken, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: expiresInMs
        });

        res.cookie('spotify_token_expires', newExpiry.toString(), {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });

        if (data.refresh_token) {
          res.cookie('spotify_refresh_token', data.refresh_token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
          });
        }

        return accessToken;
      }
    } catch (err) {
      console.error("Failed to refresh Spotify token:", err);
    }
  }

  return null;
}

// 1. Initiate Spotify OAuth 2.0 Authorization Flow
app.get('/api/spotify/login', (req, res) => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(400).json({
      error: 'MISSING_CREDENTIALS',
      message: 'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be configured in backend .env file.'
    });
  }

  // Generate cryptographically secure state parameter
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('spotify_auth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const scopes = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-read-recently-played',
    'user-modify-playback-state'
  ].join(' ');

  const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
    show_dialog: 'true'
  }).toString();

  res.redirect(authUrl);
});

// 2. Spotify OAuth Callback Route
app.get('/api/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const storedState = req.cookies.spotify_auth_state;

  res.clearCookie('spotify_auth_state');

  if (error || !state || state !== storedState) {
    console.warn("OAuth Callback Error or State Mismatch:", { error, state, storedState });
    return res.redirect(`${FRONTEND_URL}/#spotify-intercom?error=${encodeURIComponent(error || 'state_mismatch')}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/#spotify-intercom?error=no_code_provided`);
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: SPOTIFY_REDIRECT_URI
      }).toString()
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok || !data.access_token) {
      console.error("Token Exchange Error:", data);
      return res.redirect(`${FRONTEND_URL}/#spotify-intercom?error=${encodeURIComponent(data.error_description || 'token_exchange_failed')}`);
    }

    const expiresInMs = (data.expires_in || 3600) * 1000;
    const expiryTime = Date.now() + expiresInMs;

    // Secure HTTP-Only Cookie Storage (No Tokens in URL or LocalStorage)
    res.cookie('spotify_access_token', data.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: expiresInMs
    });

    if (data.refresh_token) {
      res.cookie('spotify_refresh_token', data.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }

    res.cookie('spotify_token_expires', expiryTime.toString(), {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.redirect(`${FRONTEND_URL}/#spotify-intercom?spotify=connected`);
  } catch (err) {
    console.error("Error exchanging Spotify code:", err);
    return res.redirect(`${FRONTEND_URL}/#spotify-intercom?error=server_error`);
  }
});

// 3. Get Spotify Connection Status & Profile Info
app.get('/api/spotify/status', async (req, res) => {
  const configured = Boolean(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET);
  const token = await getValidAccessToken(req, res);

  if (!token) {
    return res.json({ connected: false, configured });
  }

  try {
    const userRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (userRes.ok) {
      const userData = await userRes.json();
      return res.json({
        connected: true,
        configured: true,
        user: {
          display_name: userData.display_name || userData.id,
          id: userData.id,
          product: userData.product,
          images: userData.images || []
        }
      });
    }
  } catch (err) {
    console.error("Error fetching Spotify user profile:", err);
  }

  return res.json({ connected: false, configured });
});

// 4. Get Currently Playing Track & Playback Telemetry
app.get('/api/spotify/currently-playing', async (req, res) => {
  const token = await getValidAccessToken(req, res);

  if (!token) {
    return res.json({ connected: false });
  }

  try {
    const playerRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (playerRes.status === 204) {
      // Nothing is currently playing
      return res.json({ connected: true, isPlaying: false, nothingPlaying: true });
    }

    if (playerRes.ok) {
      const data = await playerRes.json();
      if (!data || !data.item) {
        return res.json({ connected: true, isPlaying: false, nothingPlaying: true });
      }

      const item = data.item;
      return res.json({
        connected: true,
        isPlaying: data.is_playing,
        nothingPlaying: false,
        item: {
          name: item.name,
          artist: item.artists ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist',
          album: item.album ? item.album.name : '',
          coverUrl: item.album && item.album.images && item.album.images[0] ? item.album.images[0].url : '',
          durationMs: item.duration_ms || 0,
          progressMs: data.progress_ms || 0,
          spotifyUrl: item.external_urls ? item.external_urls.spotify : ''
        },
        device: data.device || null
      });
    }
  } catch (err) {
    console.error("Error fetching currently playing:", err);
  }

  return res.json({ connected: true, isPlaying: false, nothingPlaying: true });
});

// 5. Get Recently Played Tracks
app.get('/api/spotify/recently-played', async (req, res) => {
  const token = await getValidAccessToken(req, res);

  if (!token) {
    return res.json({ connected: false, items: [] });
  }

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      const items = (data.items || []).map(entry => ({
        name: entry.track.name,
        artist: entry.track.artists.map(a => a.name).join(', '),
        album: entry.track.album.name,
        coverUrl: entry.track.album.images[0]?.url || '',
        playedAt: entry.played_at,
        spotifyUrl: entry.track.external_urls?.spotify || ''
      }));
      return res.json({ connected: true, items });
    }
  } catch (err) {
    console.error("Error fetching recently played:", err);
  }

  return res.json({ connected: true, items: [] });
});

// 6. Playback Controls Proxy (Play, Pause, Next, Previous, Volume, Seek)
app.post('/api/spotify/controls/:action', async (req, res) => {
  const token = await getValidAccessToken(req, res);
  const { action } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  let spotifyEndpoint = '';
  let method = 'PUT';
  let body = undefined;

  switch (action) {
    case 'play':
      spotifyEndpoint = 'https://api.spotify.com/v1/me/player/play';
      method = 'PUT';
      break;
    case 'pause':
      spotifyEndpoint = 'https://api.spotify.com/v1/me/player/pause';
      method = 'PUT';
      break;
    case 'next':
      spotifyEndpoint = 'https://api.spotify.com/v1/me/player/next';
      method = 'POST';
      break;
    case 'previous':
      spotifyEndpoint = 'https://api.spotify.com/v1/me/player/previous';
      method = 'POST';
      break;
    case 'volume':
      spotifyEndpoint = `https://api.spotify.com/v1/me/player/volume?volume_percent=${req.body.volume_percent || 80}`;
      method = 'PUT';
      break;
    case 'seek':
      spotifyEndpoint = `https://api.spotify.com/v1/me/player/seek?position_ms=${req.body.position_ms || 0}`;
      method = 'PUT';
      break;
    default:
      return res.status(400).json({ error: 'INVALID_ACTION' });
  }

  try {
    const controlRes = await fetch(spotifyEndpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (controlRes.ok || controlRes.status === 204) {
      return res.json({ success: true });
    } else {
      const errData = await controlRes.json().catch(() => ({}));
      return res.status(controlRes.status).json({ success: false, error: errData });
    }
  } catch (err) {
    console.error(`Error performing Spotify control action (${action}):`, err);
    return res.status(500).json({ error: 'CONTROL_ACTION_FAILED' });
  }
});

// 7. Disconnect / Logout Spotify Session
app.post('/api/spotify/disconnect', (req, res) => {
  res.clearCookie('spotify_access_token');
  res.clearCookie('spotify_refresh_token');
  res.clearCookie('spotify_token_expires');
  res.clearCookie('spotify_auth_state');
  return res.json({ connected: false, message: 'Spotify account disconnected successfully.' });
});

app.listen(PORT, () => {
  console.log(`⚡ RiderIQ Spotify OAuth Backend Server listening on http://localhost:${PORT}`);
});
