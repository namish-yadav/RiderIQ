import { getValidAccessToken } from '../_utils.js';

export default async function handler(req, res) {
  const token = await getValidAccessToken(req, res);

  if (!token) {
    return res.status(200).json({ connected: false });
  }

  try {
    const playerRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (playerRes.status === 204) {
      return res.status(200).json({ connected: true, isPlaying: false, nothingPlaying: true });
    }

    if (playerRes.ok) {
      const data = await playerRes.json();
      if (!data || !data.item) {
        return res.status(200).json({ connected: true, isPlaying: false, nothingPlaying: true });
      }

      const item = data.item;
      return res.status(200).json({
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

  return res.status(200).json({ connected: true, isPlaying: false, nothingPlaying: true });
}
