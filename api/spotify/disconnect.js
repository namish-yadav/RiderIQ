export default function handler(req, res) {
  res.setHeader('Set-Cookie', [
    `spotify_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    `spotify_refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    `spotify_token_expires=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    `spotify_auth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  ]);
  return res.status(200).json({ connected: false, message: 'Spotify account disconnected successfully.' });
}
