import crypto from 'crypto';
import { getCredentials } from '../_utils.js';

export default function handler(req, res) {
  const { clientId, clientSecret, redirectUri } = getCredentials();

  if (!clientId || !clientSecret) {
    return res.status(400).json({
      error: 'MISSING_CREDENTIALS',
      message: 'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be configured in backend environment variables.',
      debug: {
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret)
      }
    });
  }

  const state = crypto.randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', [
    `spotify_auth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  ]);

  const scopes = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-read-recently-played',
    'user-modify-playback-state'
  ].join(' ');

  const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: state,
    show_dialog: 'true'
  }).toString();

  res.redirect(302, authUrl);
}
