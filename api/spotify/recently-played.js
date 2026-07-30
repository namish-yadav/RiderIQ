import { getValidAccessToken } from '../_utils.js';

export default async function handler(req, res) {
  const token = await getValidAccessToken(req, res);

  if (!token) {
    return res.status(200).json({ connected: false, items: [] });
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
      return res.status(200).json({ connected: true, items });
    }
  } catch (err) {
    console.error("Error fetching recently played:", err);
  }

  return res.status(200).json({ connected: true, items: [] });
}
