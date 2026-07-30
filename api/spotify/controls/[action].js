import { getValidAccessToken } from '../../_utils.js';

export default async function handler(req, res) {
  const token = await getValidAccessToken(req, res);
  const action = req.query?.action;

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
      spotifyEndpoint = `https://api.spotify.com/v1/me/player/volume?volume_percent=${req.body?.volume_percent || 80}`;
      method = 'PUT';
      break;
    case 'seek':
      spotifyEndpoint = `https://api.spotify.com/v1/me/player/seek?position_ms=${req.body?.position_ms || 0}`;
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
      return res.status(200).json({ success: true });
    } else {
      const errData = await controlRes.json().catch(() => ({}));
      return res.status(controlRes.status).json({ success: false, error: errData });
    }
  } catch (err) {
    console.error(`Error performing Spotify control action (${action}):`, err);
    return res.status(500).json({ error: 'CONTROL_ACTION_FAILED' });
  }
}
