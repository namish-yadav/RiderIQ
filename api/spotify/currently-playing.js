import { getValidAccessToken } from '../_utils.js';

export default async function handler(req, res) {
  let token = await getValidAccessToken(req, res);

  if (!token) {
    return res.status(200).json({
      connected: false,
      error: 'NO_TOKEN',
      profileStatus: 401,
      playerStatus: 401,
      playerErrorBody: 'No access token available in cookies',
      spotifyUserId: null
    });
  }

  try {
    // 1. GET https://api.spotify.com/v1/me
    let profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let profileStatus = profileRes.status;
    let spotifyUserId = null;
    let profileErrorBody = null;

    if (profileRes.ok) {
      const meData = await profileRes.json().catch(() => ({}));
      spotifyUserId = meData?.id || null;
    } else {
      const profileText = await profileRes.text().catch(() => '');
      try {
        profileErrorBody = JSON.parse(profileText);
      } catch {
        profileErrorBody = profileText;
      }
    }

    // 2. GET https://api.spotify.com/v1/me/player?additional_types=track,episode
    let playerRes = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Handle 401 Unauthorized token refresh & retry
    if (playerRes.status === 401) {
      const newToken = await getValidAccessToken(req, res, true);
      if (newToken) {
        token = newToken;
        profileRes = await fetch('https://api.spotify.com/v1/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        profileStatus = profileRes.status;
        if (profileRes.ok) {
          const meData = await profileRes.json().catch(() => ({}));
          spotifyUserId = meData?.id || null;
        }

        playerRes = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    }

    const playerStatus = playerRes.status;
    const wwwAuthenticate = playerRes.headers.get('www-authenticate') || null;
    const retryAfter = playerRes.headers.get('retry-after') || null;

    let playerErrorBody = null;
    if (!playerRes.ok && playerRes.status !== 204) {
      const rawText = await playerRes.text().catch(() => '');
      try {
        playerErrorBody = JSON.parse(rawText);
      } catch {
        playerErrorBody = rawText;
      }
    }

    const responsePayload = {
      connected: true,
      profileStatus,
      playerStatus,
      playerErrorBody,
      spotifyUserId,
      spotifyStatus: playerStatus,
      spotifyErrorBody: playerErrorBody,
      spotifyErrorHeaders: {
        wwwAuthenticate,
        retryAfter
      },
      profileErrorBody
    };

    console.log("[Spotify Production Diagnostic]", JSON.stringify(responsePayload, null, 2));

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("Error running Spotify production diagnostic:", err);
    return res.status(500).json({ error: "INTERNAL_DIAGNOSTIC_ERROR", message: String(err) });
  }
}
