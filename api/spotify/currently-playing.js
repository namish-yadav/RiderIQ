import { getValidAccessToken } from '../_utils.js';

export default async function handler(req, res) {
  let token = await getValidAccessToken(req, res);

  if (!token) {
    return res.status(200).json({ connected: false });
  }

  try {
    let playerRes = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // If token returned 401 Unauthorized, automatically refresh access token and retry
    if (playerRes.status === 401) {
      console.log('[Spotify] Access token 401 Unauthorized. Attempting refresh token flow...');
      const newToken = await getValidAccessToken(req, res, true);
      if (newToken) {
        token = newToken;
        playerRes = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        console.warn('[Spotify] Refresh token flow failed after 401 Unauthorized.');
        return res.status(200).json({
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
      return res.status(200).json({
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
        return res.status(200).json({
          connected: true,
          isPlaying: false,
          nothingPlaying: true,
          item: null,
          device: data?.device || null,
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
    return res.status(200).json({
      connected: true,
      isPlaying: false,
      nothingPlaying: true,
      diagnostics
    });
  } catch (err) {
    console.error("Error fetching currently playing:", err);
  }

  return res.status(200).json({ connected: true, isPlaying: false, nothingPlaying: true });
}
