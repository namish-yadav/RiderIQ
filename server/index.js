import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const router = express.Router();
const PORT = process.env.PORT || 3001;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

// Helper: Determine dynamic base URL for production on Vercel or local dev
function getBaseUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  if (req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers?.host;
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `${proto}://${host}`;
    }
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return 'https://rider-iq-seven.vercel.app';
}

function getSpotifyRedirectUri(req) {
  if (process.env.SPOTIFY_REDIRECT_URI) return process.env.SPOTIFY_REDIRECT_URI;
  return `${getBaseUrl(req)}/api/spotify/callback`;
}

function getFrontendUrl(req) {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  return getBaseUrl(req);
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    // Allow credentials with any origin (production domain or dev)
    return callback(null, true);
  },
  credentials: true
}));

// Helper: Basic Auth header for Spotify Token API
function getBasicAuthHeader() {
  return 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
}

// Helper: Automatically validate or refresh Spotify Access Token from HTTP-Only cookies
async function getValidAccessToken(req, res, forceRefresh = false) {
  let accessToken = req.cookies?.spotify_access_token;
  const refreshToken = req.cookies?.spotify_refresh_token;
  const tokenExpiresStr = req.cookies?.spotify_token_expires;
  const tokenExpires = tokenExpiresStr ? parseInt(tokenExpiresStr, 10) : 0;

  // 1. If access token is active and not expiring within 60s (unless forceRefresh requested)
  if (!forceRefresh && accessToken && Date.now() < tokenExpires - 60000) {
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

        const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

        res.cookie('spotify_access_token', accessToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: isProd,
          maxAge: expiresInMs
        });

        res.cookie('spotify_token_expires', newExpiry.toString(), {
          httpOnly: true,
          sameSite: 'lax',
          secure: isProd,
          maxAge: 30 * 24 * 60 * 60 * 1000
        });

        if (data.refresh_token) {
          res.cookie('spotify_refresh_token', data.refresh_token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProd,
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
router.get('/spotify/login', (req, res) => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(400).json({
      error: 'MISSING_CREDENTIALS',
      message: 'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be configured in backend environment variables.'
    });
  }

  const redirectUri = getSpotifyRedirectUri(req);

  // Generate cryptographically secure state parameter
  const state = crypto.randomBytes(16).toString('hex');
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

  res.cookie('spotify_auth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
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
    redirect_uri: redirectUri,
    state: state,
    show_dialog: 'true'
  }).toString();

  res.redirect(authUrl);
});

// 2. Spotify OAuth Callback Route
router.get('/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const storedState = req.cookies?.spotify_auth_state;
  const redirectUri = getSpotifyRedirectUri(req);
  const frontendUrl = getFrontendUrl(req);

  res.clearCookie('spotify_auth_state');

  if (error || !state || state !== storedState) {
    console.warn("OAuth Callback Error or State Mismatch:", { error, state, storedState });
    return res.redirect(`${frontendUrl}/#spotify-intercom?error=${encodeURIComponent(String(error || 'state_mismatch'))}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/#spotify-intercom?error=no_code_provided`);
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
        redirect_uri: redirectUri
      }).toString()
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok || !data.access_token) {
      console.error("Token Exchange Error:", data);
      return res.redirect(`${frontendUrl}/#spotify-intercom?error=${encodeURIComponent(data.error_description || 'token_exchange_failed')}`);
    }

    const expiresInMs = (data.expires_in || 3600) * 1000;
    const expiryTime = Date.now() + expiresInMs;
    const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

    // Secure HTTP-Only Cookie Storage
    res.cookie('spotify_access_token', data.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: expiresInMs
    });

    if (data.refresh_token) {
      res.cookie('spotify_refresh_token', data.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }

    res.cookie('spotify_token_expires', expiryTime.toString(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.redirect(`${frontendUrl}/#spotify-intercom?spotify=connected`);
  } catch (err) {
    console.error("Error exchanging Spotify code:", err);
    return res.redirect(`${frontendUrl}/#spotify-intercom?error=server_error`);
  }
});

// 3. Get Spotify Connection Status & Profile Info
router.get('/spotify/status', async (req, res) => {
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
router.get('/spotify/currently-playing', async (req, res) => {
  let token = await getValidAccessToken(req, res);

  if (!token) {
    return res.json({ connected: false });
  }

  try {
    let playerRes = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // If token returned 401 Unauthorized, automatically refresh access token and retry
    if (playerRes.status === 401) {
      console.log('[Spotify Server] Access token 401 Unauthorized. Attempting refresh token flow...');
      const newToken = await getValidAccessToken(req, res, true);
      if (newToken) {
        token = newToken;
        playerRes = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        console.warn('[Spotify Server] Refresh token flow failed after 401 Unauthorized.');
        return res.json({
          connected: false,
          error: 'TOKEN_EXPIRED',
          diagnostics: {
            spotifyStatus: 401,
            hasItem: false,
            itemType: null,
            trackName: null,
            artistName: null,
            isPlaying: null,
            deviceName: null,
            deviceType: null,
            hasDeviceId: false,
            progressMs: null,
            durationMs: null
          }
        });
      }
    }

    if (playerRes.status === 204) {
      const diagnostics = {
        spotifyStatus: 204,
        hasItem: false,
        itemType: null,
        trackName: null,
        artistName: null,
        isPlaying: false,
        deviceName: null,
        deviceType: null,
        hasDeviceId: false,
        progressMs: null,
        durationMs: null
      };
      console.log('[Spotify Diagnostics]', JSON.stringify(diagnostics));
      return res.json({
        connected: true,
        isPlaying: false,
        nothingPlaying: true,
        item: null,
        device: null,
        diagnostics
      });
    }

    if (playerRes.ok) {
      const data = await playerRes.json();
      const item = data?.item || null;
      const itemType = data?.currently_playing_type || item?.type || 'track';

      let artistName = 'Unknown Artist';
      if (item) {
        if (item.artists && Array.isArray(item.artists) && item.artists.length > 0) {
          artistName = item.artists.map(a => a.name).join(', ');
        } else if (item.show && item.show.name) {
          artistName = item.show.name;
        } else if (item.show && item.show.publisher) {
          artistName = item.show.publisher;
        }
      }

      let albumName = '';
      if (item) {
        if (item.album && item.album.name) {
          albumName = item.album.name;
        } else if (item.show && item.show.name) {
          albumName = item.show.name;
        }
      }

      let coverUrl = '';
      if (item) {
        if (item.album && item.album.images && item.album.images[0]) {
          coverUrl = item.album.images[0].url;
        } else if (item.images && item.images[0]) {
          coverUrl = item.images[0].url;
        } else if (item.show && item.show.images && item.show.images[0]) {
          coverUrl = item.show.images[0].url;
        }
      }

      const diagnostics = {
        spotifyStatus: playerRes.status,
        hasItem: Boolean(item),
        itemType: itemType,
        trackName: item?.name || null,
        artistName: artistName || null,
        isPlaying: typeof data?.is_playing === 'boolean' ? data.is_playing : null,
        deviceName: data?.device?.name || null,
        deviceType: data?.device?.type || null,
        hasDeviceId: Boolean(data?.device?.id),
        progressMs: typeof data?.progress_ms === 'number' ? data.progress_ms : null,
        durationMs: typeof item?.duration_ms === 'number' ? item.duration_ms : null
      };
      console.log('[Spotify Diagnostics]', JSON.stringify(diagnostics));

      if (!item) {
        return res.json({
          connected: true,
          isPlaying: false,
          nothingPlaying: true,
          item: null,
          device: data?.device || null,
          diagnostics
        });
      }

      return res.json({
        connected: true,
        isPlaying: Boolean(data.is_playing),
        nothingPlaying: false,
        item: {
          name: item.name || 'Unknown Track',
          artist: artistName,
          album: albumName,
          coverUrl: coverUrl,
          durationMs: item.duration_ms || 0,
          progressMs: data.progress_ms || 0,
          spotifyUrl: item.external_urls ? item.external_urls.spotify : '',
          type: itemType
        },
        device: data.device || null,
        diagnostics
      });
    }

    const diagnostics = {
      spotifyStatus: playerRes.status,
      hasItem: false,
      itemType: null,
      trackName: null,
      artistName: null,
      isPlaying: null,
      deviceName: null,
      deviceType: null,
      hasDeviceId: false,
      progressMs: null,
      durationMs: null
    };
    console.warn('[Spotify Diagnostics Error]', JSON.stringify(diagnostics));
    return res.json({
      connected: true,
      isPlaying: false,
      nothingPlaying: true,
      diagnostics
    });
  } catch (err) {
    console.error("Error fetching currently playing:", err);
  }

  return res.json({ connected: true, isPlaying: false, nothingPlaying: true });
});

// 5. Get Recently Played Tracks
router.get('/spotify/recently-played', async (req, res) => {
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
router.post('/spotify/controls/:action', async (req, res) => {
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
      if (req.body && (req.body.context_uri || req.body.uris)) {
        body = req.body;
      }
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
router.post('/spotify/disconnect', (req, res) => {
  res.clearCookie('spotify_access_token');
  res.clearCookie('spotify_refresh_token');
  res.clearCookie('spotify_token_expires');
  res.clearCookie('spotify_auth_state');
  return res.json({ connected: false, message: 'Spotify account disconnected successfully.' });
});

// Register router under both /api and / to handle all routing environments
app.use('/api', router);
app.use('/', router);

export default app;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`⚡ RiderIQ Spotify OAuth Backend Server listening on http://localhost:${PORT}`);
  });
}
