import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, 
  Disc, Zap, CheckCircle2, Sliders, ExternalLink, LogOut, Radio, AlertCircle, 
  Music, Clock, RefreshCw, Key
} from 'lucide-react';

interface CurrentlyPlayingTrack {
  name: string;
  artist: string;
  album: string;
  coverUrl: string;
  durationMs: number;
  progressMs: number;
  spotifyUrl: string;
  isPlaying: boolean;
}

interface RecentlyPlayedTrack {
  name: string;
  artist: string;
  album: string;
  coverUrl: string;
  playedAt: string;
  spotifyUrl: string;
}

const riderPlaylists: Record<string, { name: string; spotifyUrl: string }> = {
  twisties: {
    name: "🏍️ Mountain Twisties Heavy Beat",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM"
  },
  highway: {
    name: "⚡ Highway Cruise Synthwave",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM"
  },
  night: {
    name: "🌃 Night Ride Lo-Fi",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM"
  },
  track: {
    name: "🔥 Track Day High Octane",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM"
  }
};

// PKCE Helper Functions
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export default function SpotifyMusicHUD() {
  // App Spotify Client ID configured by Developer in .env
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || (window.location.origin + '/');

  // User Spotify Session States
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('spotify_user_access_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('spotify_user_refresh_token'));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<{ display_name: string; images?: Array<{ url: string }> } | null>(null);

  // Playback Telemetry States
  const [currentlyPlaying, setCurrentlyPlaying] = useState<CurrentlyPlayingTrack | null>(null);
  const [nothingPlaying, setNothingPlaying] = useState<boolean>(false);
  const [progressMs, setProgressMs] = useState<number>(0);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>([]);

  // Motorcycle Audio Intelligence States
  const [activePlaylistKey, setActivePlaylistKey] = useState<string>("twisties");
  const [speedAdaptiveVolume, setSpeedAdaptiveVolume] = useState<boolean>(true);
  const [autoDucking, setAutoDucking] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(112); // km/h
  const [radarAlertActive, setRadarAlertActive] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Error Message State
  const [apiError, setApiError] = useState<string | null>(null);

  const progressTimerRef = useRef<any>(null);

  // 1. Process OAuth Callback & Check Spotify Backend Session Status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error') || hashParams.get('error');
    const spotifyConnected = urlParams.get('spotify') === 'connected' || hashParams.get('spotify') === 'connected';

    if (error) {
      if (error === 'access_denied') {
        setApiError("Spotify authorization was denied.");
      } else {
        setApiError(`Spotify Authorization Error: ${error}`);
      }
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    } else if (spotifyConnected) {
      setApiError(null);
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }

    // Check backend session status (HTTP-Only Cookie flow)
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/spotify/status', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setIsConnected(true);
            if (data.user) setUserProfile(data.user);
            setApiError(null);
          }
        }
      } catch (e) {
        console.warn("Spotify status check failed:", e);
      }
    };
    checkStatus();

    if (code && state) {
      const storedState = sessionStorage.getItem('spotify_auth_state');
      const codeVerifier = sessionStorage.getItem('spotify_code_verifier');

      sessionStorage.removeItem('spotify_auth_state');
      sessionStorage.removeItem('spotify_code_verifier');

      if (state !== storedState || !codeVerifier) {
        setApiError("Authorization state mismatch. Please try connecting again.");
        window.history.replaceState(null, '', window.location.pathname + window.location.hash);
        return;
      }

      const handleTokenExchange = async () => {
        setIsConnecting(true);
        try {
          const bodyParams = new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          });

          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: bodyParams.toString()
          });

          const data = await response.json();

          if (response.ok && data.access_token) {
            saveUserTokens(data.access_token, data.refresh_token, data.expires_in);
            setApiError(null);
          } else {
            setApiError(`Spotify Authorization Failed: ${data.error_description || data.error || 'Invalid code'}`);
          }
        } catch (err) {
          console.error("Token exchange failed:", err);
          setApiError("Failed to connect with Spotify.");
        } finally {
          setIsConnecting(false);
          window.history.replaceState(null, '', window.location.pathname + window.location.hash);
        }
      };

      handleTokenExchange();
    }
  }, []);

  // Save tokens per-user securely
  const saveUserTokens = (accToken: string, refToken?: string, expiresInSec: number = 3600) => {
    setToken(accToken);
    localStorage.setItem('spotify_user_access_token', accToken);
    const expiryTime = Date.now() + expiresInSec * 1000;
    localStorage.setItem('spotify_user_token_expires', expiryTime.toString());

    if (refToken) {
      setRefreshToken(refToken);
      localStorage.setItem('spotify_user_refresh_token', refToken);
    }

    setIsConnected(true);
  };

  // 2. Token Refresh Utility
  const getValidAccessToken = async (): Promise<string | null> => {
    if (!token) return null;

    const expiresStr = localStorage.getItem('spotify_user_token_expires');
    const expiresAt = expiresStr ? parseInt(expiresStr, 10) : 0;

    // Token active for > 60 seconds
    if (Date.now() < expiresAt - 60000) {
      return token;
    }

    const currentRefreshToken = refreshToken || localStorage.getItem('spotify_user_refresh_token');
    if (!currentRefreshToken || !clientId) {
      handleDisconnect();
      return null;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: 'refresh_token',
          refresh_token: currentRefreshToken
        }).toString()
      });

      const data = await response.json();
      if (response.ok && data.access_token) {
        saveUserTokens(data.access_token, data.refresh_token || currentRefreshToken, data.expires_in);
        return data.access_token;
      } else {
        handleDisconnect();
        return null;
      }
    } catch (e) {
      console.warn("Spotify token refresh error:", e);
      return null;
    }
  };

  // 3. User Profile & Telemetry Sync
  useEffect(() => {
    let isMounted = true;

    const syncSpotifyData = async () => {
      // 1. Try backend serverless endpoints (/api/spotify/* with HTTP-only cookies)
      try {
        const cpRes = await fetch('/api/spotify/currently-playing', { credentials: 'include' });
        if (cpRes.ok) {
          const data = await cpRes.json();
          if (data.connected && isMounted) {
            setIsConnected(true);
            setNothingPlaying(Boolean(data.nothingPlaying));
            if (data.item) {
              setCurrentlyPlaying({
                name: data.item.name,
                artist: data.item.artist,
                album: data.item.album,
                coverUrl: data.item.coverUrl,
                durationMs: data.item.durationMs,
                progressMs: data.item.progressMs,
                spotifyUrl: data.item.spotifyUrl,
                isPlaying: Boolean(data.isPlaying)
              });
              setProgressMs(data.item.progressMs || 0);
            } else {
              setCurrentlyPlaying(null);
            }

            // Fetch recent tracks via backend
            const recRes = await fetch('/api/spotify/recently-played', { credentials: 'include' });
            if (recRes.ok) {
              const recData = await recRes.json();
              if (recData.items && isMounted) {
                setRecentlyPlayed(recData.items);
              }
            }

            // Fetch profile if missing
            if (!userProfile) {
              const stRes = await fetch('/api/spotify/status', { credentials: 'include' });
              if (stRes.ok) {
                const stData = await stRes.json();
                if (stData.user && isMounted) {
                  setUserProfile(stData.user);
                }
              }
            }
            return;
          }
        }
      } catch (err) {
        // Ignore backend fetch errors and fallback to client-side token if present
      }

      // 2. Fallback for client-side direct token (if stored in localStorage)
      if (!token) {
        if (isMounted) {
          setIsConnected(false);
          setCurrentlyPlaying(null);
          setRecentlyPlayed([]);
        }
        return;
      }

      if (isMounted) setIsConnected(true);

      const validToken = await getValidAccessToken();
      if (!validToken) return;

      try {
        if (!userProfile) {
          const userRes = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${validToken}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (isMounted) setUserProfile({ display_name: userData.display_name || userData.id, images: userData.images });
          } else if (userRes.status === 401) {
            handleDisconnect();
            return;
          }
        }

        const playerRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: { Authorization: `Bearer ${validToken}` }
        });

        if (playerRes.status === 204) {
          if (isMounted) {
            setNothingPlaying(true);
            setCurrentlyPlaying(null);
          }
        } else if (playerRes.ok) {
          const data = await playerRes.json();
          if (isMounted) {
            if (!data || !data.item) {
              setNothingPlaying(true);
              setCurrentlyPlaying(null);
            } else {
              setNothingPlaying(false);
              setCurrentlyPlaying({
                name: data.item.name,
                artist: data.item.artists ? data.item.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist',
                album: data.item.album ? data.item.album.name : '',
                coverUrl: data.item.album?.images?.[0]?.url || '',
                durationMs: data.item.duration_ms || 0,
                progressMs: data.progress_ms || 0,
                spotifyUrl: data.item.external_urls?.spotify || '',
                isPlaying: data.is_playing
              });
              setProgressMs(data.progress_ms || 0);
            }
          }
        }

        const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
          headers: { Authorization: `Bearer ${validToken}` }
        });

        if (recentRes.ok) {
          const recentData = await recentRes.json();
          if (isMounted && recentData.items) {
            const items = recentData.items.map((entry: any) => ({
              name: entry.track.name,
              artist: entry.track.artists.map((a: any) => a.name).join(', '),
              album: entry.track.album.name,
              coverUrl: entry.track.album.images?.[0]?.url || '',
              playedAt: entry.played_at,
              spotifyUrl: entry.track.external_urls?.spotify || ''
            }));
            setRecentlyPlayed(items);
          }
        }
      } catch (err) {
        console.warn("Spotify API telemetry sync error:", err);
      }
    };

    syncSpotifyData();
    const interval = setInterval(syncSpotifyData, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  // Local progress ticker for smooth progress bar updates
  useEffect(() => {
    if (currentlyPlaying?.isPlaying) {
      progressTimerRef.current = setInterval(() => {
        setProgressMs((prev) => {
          if (prev >= currentlyPlaying.durationMs) return prev;
          return prev + 1000;
        });
      }, 1000);
    } else {
      clearInterval(progressTimerRef.current);
    }

    return () => clearInterval(progressTimerRef.current);
  }, [currentlyPlaying?.isPlaying, currentlyPlaying?.durationMs]);

  // Start Spotify Production Backend OAuth Flow Redirect
  const handleConnectSpotify = async () => {
    setIsConnecting(true);
    setApiError(null);
    window.location.href = '/api/spotify/login';
  };

  // Disconnect Spotify Account
  const handleDisconnect = async () => {
    try {
      await fetch('/api/spotify/disconnect', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn("Spotify disconnect error:", e);
    }
    setToken(null);
    setRefreshToken(null);
    setIsConnected(false);
    setUserProfile(null);
    setCurrentlyPlaying(null);
    setRecentlyPlayed([]);
    setNothingPlaying(false);
    localStorage.removeItem('spotify_user_access_token');
    localStorage.removeItem('spotify_user_refresh_token');
    localStorage.removeItem('spotify_user_token_expires');
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatRelativeTime = (isoString: string) => {
    const time = new Date(isoString).getTime();
    const diffMin = Math.floor((Date.now() - time) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Calculate dynamic effective volume gain for motorcycle riding telemetry
  const calculateEffectiveGain = () => {
    if (isMuted) return 0;
    let gain = volume;
    if (speedAdaptiveVolume && simSpeed >= 100) {
      gain = Math.min(100, gain + 15);
    }
    if (autoDucking && radarAlertActive) {
      gain = Math.max(10, gain - 35);
    }
    return gain;
  };

  const effectiveGain = calculateEffectiveGain();

  return (
    <div className="rounded-3xl glass-panel border border-white/15 p-6 md:p-8 relative overflow-hidden shadow-2xl">
      {/* Ambient Album Blur Background */}
      {currentlyPlaying?.coverUrl && (
        <div 
          className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-all duration-700 bg-cover bg-center"
          style={{ backgroundImage: `url(${currentlyPlaying.coverUrl})` }}
        />
      )}

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-[#1DB954] uppercase tracking-widest mb-1 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span>SPOTIFY INTERCOM COCKPIT</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Motorcycle Intercom Music
            {isConnected && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse"></span>
                Spotify Connected ✓
              </span>
            )}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/40">
                {userProfile?.images?.[0]?.url ? (
                  <img src={userProfile.images[0].url} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#1DB954]"></span>
                )}
                <span>{userProfile?.display_name || 'Spotify User'}</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Spotify</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectSpotify}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-extrabold transition-all cursor-pointer bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 text-black shadow-lg shadow-[#1DB954]/30 hover:scale-105"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Spotify...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Connect Spotify</span>
                </>
              )}
            </button>
          )}

          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono bg-white/5 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>CARDO PACKTALK INTERCOM</span>
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {apiError && (
        <div className="mb-6 relative z-10 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Main Player HUD Card */}
        <div className="lg:col-span-7 bg-black/85 rounded-2xl border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl">
          
          {/* STATE 1: Disconnected State */}
          {!isConnected && !isConnecting && (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/40 flex items-center justify-center mx-auto shadow-xl">
                <svg className="w-10 h-10 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-2xl font-black text-white">Spotify</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Connect your Spotify account to sync live riding soundtracks directly to your helmet intercom.
                </p>
              </div>

              <button
                onClick={handleConnectSpotify}
                className="px-8 py-3.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-sm transition-all cursor-pointer shadow-xl shadow-[#1DB954]/30 hover:scale-105 inline-flex items-center gap-2 font-mono uppercase tracking-wider"
              >
                <Key className="w-4 h-4" />
                <span>Connect Spotify</span>
              </button>
            </div>
          )}

          {/* STATE 2: Connecting State */}
          {isConnecting && (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-[#1DB954] animate-spin mx-auto" />
              <p className="text-sm font-mono text-neutral-300">Connecting to Spotify...</p>
            </div>
          )}

          {/* STATE 3: Connected & Nothing Playing */}
          {isConnected && !isConnecting && nothingPlaying && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center mx-auto text-[#1DB954]">
                <Music className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#1DB954] uppercase tracking-wider font-bold">Spotify Connected ✓</div>
                <h4 className="text-xl font-bold text-white">Nothing is playing right now.</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto pt-1">
                  Start playing music on any Spotify device to sync live telemetry.
                </p>
              </div>

              <button
                onClick={handleDisconnect}
                className="mt-4 px-4 py-2 rounded-full text-xs font-mono text-neutral-400 hover:text-red-400 bg-white/5 border border-white/10 transition-all cursor-pointer"
              >
                Disconnect Spotify
              </button>
            </div>
          )}

          {/* STATE 4: Connected & Currently Playing Live Spotify Song */}
          {isConnected && !isConnecting && currentlyPlaying && (
            <div className="space-y-6">
              
              <div className="text-xs font-mono text-[#1DB954] uppercase tracking-wider font-bold flex items-center justify-between">
                <span>Spotify Connected ✓</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${currentlyPlaying.isPlaying ? 'bg-[#1DB954] animate-pulse' : 'bg-neutral-500'}`}></span>
                  ● {currentlyPlaying.isPlaying ? 'Playing' : 'Paused'}
                </span>
              </div>

              {/* Track Info Header */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group flex-shrink-0">
                  <img
                    src={currentlyPlaying.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80'}
                    alt={currentlyPlaying.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border border-white/15 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  />
                  {currentlyPlaying.isPlaying && (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center gap-1">
                      <span className="w-1.5 h-7 bg-[#1DB954] animate-pulse"></span>
                      <span className="w-1.5 h-11 bg-[#1DB954] animate-pulse delay-100"></span>
                      <span className="w-1.5 h-8 bg-[#1DB954] animate-pulse delay-200"></span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                  <h4 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    <span>{currentlyPlaying.name}</span>
                    {currentlyPlaying.spotifyUrl && (
                      <a href={currentlyPlaying.spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </h4>
                  <p className="text-neutral-300 text-sm font-medium truncate">
                    {currentlyPlaying.artist}
                  </p>
                  {currentlyPlaying.album && (
                    <p className="text-neutral-500 text-xs font-mono truncate">
                      Album: {currentlyPlaying.album}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Scrubber */}
              <div className="space-y-1.5">
                <div className="w-full bg-neutral-800 h-2 rounded-lg overflow-hidden">
                  <div 
                    className="bg-[#1DB954] h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (progressMs / (currentlyPlaying.durationMs || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>{formatTime(progressMs)}</span>
                  <span>{formatTime(currentlyPlaying.durationMs)}</span>
                </div>
              </div>

              {/* Volume & Telemetry Gain Bar */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#1DB954]" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseInt(e.target.value, 10));
                      setIsMuted(false);
                    }}
                    className="flex-1 accent-[#1DB954] bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono text-neutral-400 min-w-[36px] text-right">
                    {isMuted ? '0%' : `${volume}%`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Intercom Audio Gain:
                  </span>
                  <span className={`font-bold ${
                    radarAlertActive ? 'text-amber-400' : speedAdaptiveVolume && simSpeed >= 100 ? 'text-[#1DB954]' : 'text-white'
                  }`}>
                    {effectiveGain}% Gain 
                    {speedAdaptiveVolume && simSpeed >= 100 && ' (Wind Boost +15%)'}
                    {radarAlertActive && ' (Auto-Ducked -12dB)'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-full text-xs font-mono text-neutral-400 hover:text-red-400 bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  Disconnect Spotify
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Motorcycle Riding Controls & Recently Played List */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Recently Played List */}
          {isConnected && recentlyPlayed.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span>RECENTLY PLAYED</span>
                <Clock className="w-3.5 h-3.5 text-[#1DB954]" />
              </div>

              <div className="space-y-2">
                {recentlyPlayed.map((track, idx) => (
                  <a
                    key={idx}
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/20 flex items-center gap-3 transition-all group no-underline"
                  >
                    <img
                      src={track.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'}
                      alt={track.name}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-[#1DB954] truncate transition-colors">
                        {track.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {track.artist}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 flex-shrink-0">
                      {formatRelativeTime(track.playedAt)}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Curated Rider Playlists Presets */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>RIDER PLAYLIST PRESETS</span>
              <span className="text-[#1DB954] font-bold">SPOTIFY LINKED</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {Object.entries(riderPlaylists).map(([key, pl]) => (
                <button
                  key={key}
                  onClick={() => setActivePlaylistKey(key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    activePlaylistKey === key
                      ? 'bg-[#1DB954]/15 border-[#1DB954]/50 text-white shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      <span>{pl.name}</span>
                    </div>
                  </div>
                  <a
                    href={pl.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-neutral-400 hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </button>
              ))}
            </div>
          </div>

          {/* Motorcycle Riding Audio Intelligence Switches */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>MOTORCYCLE AUDIO INTELLIGENCE</span>
            </div>

            {/* Speed Adaptive Volume Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10">
              <div>
                <div className="text-xs font-bold text-white">Speed-Adaptive Volume Boost</div>
                <div className="text-[11px] text-neutral-400">Auto-boosts gain (+15%) at 100+ km/h for wind noise</div>
              </div>
              <button
                onClick={() => setSpeedAdaptiveVolume(!speedAdaptiveVolume)}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                  speedAdaptiveVolume ? 'bg-[#1DB954]' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  speedAdaptiveVolume ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Auto Ducking Radar Alert */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10">
              <div>
                <div className="text-xs font-bold text-white">Radar Warning Auto-Ducking</div>
                <div className="text-[11px] text-neutral-400">Ducks Spotify -12dB during Speed Camera alerts</div>
              </div>
              <button
                onClick={() => setAutoDucking(!autoDucking)}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                  autoDucking ? 'bg-[#1DB954]' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  autoDucking ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Interactive Telemetry Test Triggers */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => setSimSpeed(simSpeed >= 120 ? 60 : 120)}
                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  simSpeed >= 100 ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                Speed: {simSpeed} km/h {simSpeed >= 100 ? '⚡' : ''}
              </button>

              <button
                onClick={() => setRadarAlertActive(!radarAlertActive)}
                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  radarAlertActive ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse' : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                Radar Alert: {radarAlertActive ? 'ACTIVE 🚨' : 'CLEAR'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
