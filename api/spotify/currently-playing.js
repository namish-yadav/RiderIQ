import { getValidAccessToken } from '../_utils.js';

export default async function handler(req, res) {
  let token = await getValidAccessToken(req, res);

  if (!token) {
    return res.status(200).json({
      connected: false,
      error: 'NO_TOKEN',
      diagnostics: {
        spotifyStatus: 401,
        spotifyMeStatus: null,
        spotifyPlayerStatus: null,
        spotifyUserId: null,
        spotifyErrorMessage: 'No access token available in cookies'
      }
    });
  }

  try {
    // 1. Test Endpoint 1: GET /v1/me (User Profile)
    let meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let spotifyUserId = null;
    let spotifyUserProduct = null;
    let spotifyMeError = null;

    if (meRes.ok) {
      const meData = await meRes.json().catch(() => ({}));
      spotifyUserId = meData?.id || null;
      spotifyUserProduct = meData?.product || null;
    } else {
      const meErrBody = await meRes.json().catch(() => null);
      spotifyMeError = meErrBody?.error?.message || meErrBody?.error_description || meErrBody?.message || `HTTP ${meRes.status}`;
    }

    // 2. Test Endpoint 2: GET /v1/me/player (Playback State)
    let playerRes = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // If token returned 401 Unauthorized on player endpoint, attempt token refresh and retry
    if (playerRes.status === 401) {
      console.log('[Spotify] Access token 401 Unauthorized on /me/player. Retrying with fresh token...');
      const newToken = await getValidAccessToken(req, res, true);
      if (newToken) {
        token = newToken;
        meRes = await fetch('https://api.spotify.com/v1/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json().catch(() => ({}));
          spotifyUserId = meData?.id || null;
          spotifyUserProduct = meData?.product || null;
        }

        playerRes = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        console.warn('[Spotify] Token refresh failed after 401 on /me/player.');
        return res.status(200).json({
          connected: false,
          error: 'TOKEN_EXPIRED',
          spotifyMeStatus: meRes.status,
          spotifyPlayerStatus: 401,
          spotifyUserId,
          diagnostics: {
            spotifyStatus: 401,
            spotifyMeStatus: meRes.status,
            spotifyPlayerStatus: 401,
            spotifyUserId,
            spotifyErrorMessage: 'Access token expired and refresh token failed'
          }
        });
      }
    }

    // Capture Spotify Player raw error payload if non-2xx
    let playerErrBody = null;
    let spotifyErrorMessage = null;
    let spotifyErrorReason = null;

    if (!playerRes.ok && playerRes.status !== 204) {
      playerErrBody = await playerRes.json().catch(() => null);
      spotifyErrorMessage =
        playerErrBody?.error?.message ||
        playerErrBody?.error_description ||
        playerErrBody?.message ||
        (typeof playerErrBody === 'string' ? playerErrBody : null) ||
        `Spotify API returned HTTP ${playerRes.status}`;
      spotifyErrorReason = playerErrBody?.error?.reason || playerErrBody?.reason || null;
    }

    // Explicit 403 Forbidden handling with full dual-endpoint diagnostics
    if (playerRes.status === 403) {
      const diagnostics = {
        spotifyStatus: 403,
        spotifyMeStatus: meRes.status,
        spotifyPlayerStatus: 403,
        spotifyUserId: spotifyUserId || null,
        spotifyUserProduct: spotifyUserProduct || null,
        spotifyErrorMessage: spotifyErrorMessage || 'Spotify API 403 Forbidden',
        spotifyErrorReason: spotifyErrorReason || null,
        spotifyMeError: spotifyMeError || null,
        spotifyRawErrorBody: playerErrBody,
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
      console.warn('[Spotify 403 Diagnostics]', JSON.stringify(diagnostics, null, 2));

      return res.status(200).json({
        connected: true,
        error: 'SPOTIFY_403_FORBIDDEN',
        spotifyMeStatus: meRes.status,
        spotifyPlayerStatus: 403,
        spotifyUserId: spotifyUserId || null,
        spotifyUserProduct: spotifyUserProduct || null,
        spotifyErrorMessage: spotifyErrorMessage || 'Spotify API 403 Forbidden',
        spotifyErrorReason: spotifyErrorReason || null,
        spotifyMeError: spotifyMeError || null,
        spotifyRawErrorBody: playerErrBody,
        isPlaying: false,
        nothingPlaying: false,
        diagnostics
      });
    }

    if (playerRes.status === 204) {
      const diagnostics = {
        spotifyStatus: 204,
        spotifyMeStatus: meRes.status,
        spotifyPlayerStatus: 204,
        spotifyUserId,
        spotifyUserProduct,
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
      console.log('[Spotify Diagnostics 204]', JSON.stringify(diagnostics));
      return res.status(200).json({
        connected: true,
        isPlaying: false,
        nothingPlaying: true,
        item: null,
        device: null,
        spotifyMeStatus: meRes.status,
        spotifyPlayerStatus: 204,
        spotifyUserId,
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
        spotifyMeStatus: meRes.status,
        spotifyPlayerStatus: playerRes.status,
        spotifyUserId,
        spotifyUserProduct,
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
      console.log('[Spotify Diagnostics 200]', JSON.stringify(diagnostics));

      if (!item) {
        return res.status(200).json({
          connected: true,
          isPlaying: false,
          nothingPlaying: true,
          item: null,
          device: data?.device || null,
          spotifyMeStatus: meRes.status,
          spotifyPlayerStatus: playerRes.status,
          spotifyUserId,
          diagnostics
        });
      }

      return res.status(200).json({
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
        spotifyMeStatus: meRes.status,
        spotifyPlayerStatus: playerRes.status,
        spotifyUserId,
        diagnostics
      });
    }

    const diagnostics = {
      spotifyStatus: playerRes.status,
      spotifyMeStatus: meRes.status,
      spotifyPlayerStatus: playerRes.status,
      spotifyUserId,
      spotifyErrorMessage,
      spotifyErrorReason,
      spotifyRawErrorBody: playerErrBody,
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
    return res.status(200).json({
      connected: true,
      error: `SPOTIFY_${playerRes.status}`,
      spotifyMeStatus: meRes.status,
      spotifyPlayerStatus: playerRes.status,
      spotifyUserId,
      spotifyErrorMessage,
      spotifyErrorReason,
      spotifyRawErrorBody: playerErrBody,
      isPlaying: false,
      nothingPlaying: false,
      diagnostics
    });
  } catch (err) {
    console.error("Error fetching currently playing:", err);
  }

  return res.status(200).json({ connected: true, isPlaying: false, nothingPlaying: true });
}
