import { getCredentials, getValidAccessToken } from '../_utils.js';

export default async function handler(req, res) {
  const { clientId, clientSecret } = getCredentials();
  const configured = Boolean(clientId && clientSecret);
  const token = await getValidAccessToken(req, res);

  if (!token) {
    return res.status(200).json({ connected: false, configured });
  }

  try {
    const userRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (userRes.ok) {
      const userData = await userRes.json();
      return res.status(200).json({
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

  return res.status(200).json({ connected: false, configured });
}
