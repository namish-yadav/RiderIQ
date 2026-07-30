# 🏍️ RiderIQ — Connected Motorcycle Telemetry & Cockpit Engine

> **Notice:** This repository contains the official **RiderIQ Pre-Launch Web Platform & Interactive Simulator**. The full native mobile applications (iOS & Android) and hardware sensor integrations are currently under active development.

---

## 🌟 Overview

**RiderIQ** is an advanced motorcycle telemetry, navigation intelligence, and audio cockpit engine engineered specifically for two wheels. Built around real motorcycle dynamics, RiderIQ combines 6-axis IMU sensor fusion, Google/Apple Maps speed camera radar warnings, post-ride ETA pace delta analytics, and an integrated Spotify Web API Intercom Cockpit.

Instead of just recording a ride — **RiderIQ helps you master it.**

---

## 🔥 Key Pre-Launch Web Features

### 1. 🎵 Spotify Web API Intercom Cockpit
- **Discord-Style OAuth 2.0 PKCE**: End users connect their Spotify accounts via Spotify's official login screen with zero developer setup required for website visitors.
- **Live Currently Playing Telemetry**: Displays live album artwork, song title, artist, album name, progress scrubber bar, and play/pause status.
- **Speed-Adaptive Volume Boost**: Auto-adjusts audio gain (+15%) at speeds $\ge 100\text{ km/h}$ to counteract helmet wind noise.
- **Radar Warning Auto-Ducking**: Automatically ducks playback volume by $-12\text{dB}$ when speed camera alerts trigger.
- **Curated Rider Playlists**: Quick one-tap launcher for motorcycle soundtracks (*Mountain Twisties Heavy Beat*, *Highway Cruise Synthwave*, *Night Ride Lo-Fi*, *Track Day High Octane*).
- **Recently Played List**: Shows recent tracks with relative played timestamps.

### 2. 🏁 Post-Ride Telemetry & ETA Pace Delta
- **Pace Comparison**: Compares actual ride duration against initial Google Maps / Apple Maps ETA estimates (e.g. *Beta to Delta: 10 min ETA vs 6 min actual = 4 min faster ⚡*).
- **Velocity Curve & Analytics**: Tracks distance, top speed, average speed, max lean angle, and ride smoothness score.

### 3. 📐 Mounting-Independent Gyroscope Calibration
- **6-Axis Sensor Fusion**: Auto-zeroes pitch offsets whether mounted on handlebars, flat in a tank bag, or inside your jacket pocket.
- **Cornering Lean Angle HUD Simulator**: Interactive real-time telemetry simulator computing lateral G-forces and traction safety thresholds.

### 4. 🚨 Speed Camera Radar Alerts
- **Speed Trap Warning Engine**: Real-time alerts for highway speed cameras, enforcement zones, and local speed limit thresholds.

### 5. 👥 Multiplayer & Friends Leaderboard
- **Crew Rankings**: Compare weekly distance, top speed, max lean angles, and smoothness scores with your riding group.

### 6. ⛽ Tour & Fuel Intelligence Calculator
- **Trip Cost Estimator**: Calculates total fuel consumption (km/L), estimated cost, and required fuel stops based on machine profiles (e.g., Royal Enfield Hunter 350, Bajaj Dominar 400, Honda CB350).

---

## 🚀 Upcoming Mobile App & Hardware Roadmap (Future Release)

The RiderIQ ecosystem is expanding into a full hardware & mobile suite:

- 📱 **Native iOS & Android Mobile Apps**: High-frequency background GPS & IMU logging.
- ⚡ **Bluetooth 5.3 IMU Hardware Node**: Dedicated low-latency 6-axis IMU sensor pod for ultra-precise lean angle capture.
- 🏍️ **ECU OBD-II Data Integration**: Real-time RPM, throttle position (WOT), gear selection, and engine temperature telemetry.
- 🎧 **Helmet Intercom Mesh Sync**: Voice HUD navigation alerts and group rider voice mesh integration.
- ☁️ **RiderIQ Cloud Vault**: Cloud route sharing, twisties discovery, and telemetry archiving.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System, Glassmorphism UI
- **Animations & Graphics**: GSAP (GreenSock), Three.js / OGL (WebGL Hyperspeed & TubesCursor interactive canvas)
- **Icons**: Lucide React
- **Audio & Telemetry API**: Spotify Web API OAuth 2.0 (PKCE Authorization Code Flow)
- **Backend Proxy Server (Optional)**: Node.js, Express, Cookie-Parser, CORS

---

## ⚙️ Local Development & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- `npm` or `yarn`

### Installation Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/rideiq.git
   cd rideiq
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```

   Add your **Spotify Application Client ID** registered in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/
   ```
   *(Make sure to register `http://localhost:5173/` under Redirect URIs in your Spotify Dashboard).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🤝 Contact & Creator

- **Creator:** Built by rider-technologists for riders.
- **Instagram:** [@nam7sh](https://instagram.com/nam7sh)
- **Email:** `contactphoenixfy@gmail.com`

---

<p center="text-center">
  <strong>One ride. One experience. RiderIQ. 🏍️⚡</strong>
</p>
