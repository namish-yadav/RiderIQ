import React, { useState, useCallback, lazy, Suspense } from "react";
import "./App.css";
import TubesCursor from "./components/TubesCursor";

const HyperSpeed = lazy(() => import("./components/HyperSpeed"));
import StaggeredMenu from "./components/StaggeredMenu";
import SpecularButton from "./components/SpecularButton";
import Shuffle from "./components/ui/Shuffle";
import AnimatedContent from "./components/AnimatedContent";
import { CinematicFooter } from "./components/ui/motion-footer";
import LeanAngleHUD from "./components/ui/LeanAngleHUD";
import TripCalculator from "./components/ui/TripCalculator";
import NavigationAlertsHUD from "./components/ui/NavigationAlertsHUD";
import SensorCalibrationHUD from "./components/ui/SensorCalibrationHUD";
import MultiplayerLeaderboard from "./components/ui/MultiplayerLeaderboard";
import PostRideSummaryHUD from "./components/ui/PostRideSummaryHUD";
import {
  Navigation,
  MapPin,
  Activity,
  Compass,
  Music,
  BarChart3,
  Bookmark,
  Sparkles,
  CheckCircle2,
  Mail,
  Zap,
  Radio,
  Gauge,
  Bike,
  CloudSun,
  Layers3,
  Globe,
  Users,
  Sliders,
  Flag,
  Copy,
  Check,
  Send,
  MessageSquare
} from "lucide-react";

// Lazy-load SpotifyMusicHUD — it's a large (41KB) below-the-fold component.
// This splits it into its own async JS chunk, reducing initial JS payload.
const SpotifyMusicHUD = lazy(() => import("./components/ui/SpotifyMusicHUD"));

const menuItems = [
  { label: "Overview", ariaLabel: "Overview of RiderIQ", link: "#overview" },
  { label: "Post-Ride Summary & ETA", ariaLabel: "ETA Pace Delta & Velocity Graph", link: "#ride-summary" },
  { label: "Gyro & Sensor Calibration", ariaLabel: "6-Axis Sensor Fusion", link: "#sensor-calibration" },
  { label: "Speed Camera Radar", ariaLabel: "Google Maps Speed Alerts", link: "#radar-alerts" },
  { label: "Spotify Intercom Cockpit", ariaLabel: "Spotify API Intercom Cockpit", link: "#spotify-intercom" },
  { label: "Lean HUD Simulator", ariaLabel: "Lean Angle HUD", link: "#telemetry-hud" },
  { label: "Multiplayer & Friends", ariaLabel: "Rider Leaderboard", link: "#multiplayer" },
  { label: "Tour Calculator", ariaLabel: "Fuel & Tour Intelligence", link: "#tour-calculator" },
  { label: "Experience", ariaLabel: "The RiderIQ Experience", link: "#experience" },
  { label: "Creator", ariaLabel: "About the Creator", link: "#creator" },
  { label: "Contact", ariaLabel: "Contact RiderIQ", link: "#contact" },
  { label: "Early Access", ariaLabel: "Join Waitlist", link: "#waitlist" },
];

// ─── Module-level constants — defined once, never recreated on render ─────────

const bikeProfiles = [
  {
    id: "hunter",
    name: "Royal Enfield Hunter 350",
    tag: "Hunter 350",
    accentColor: "text-cyan-400",
    accentBg: "bg-cyan-500/20 border-cyan-500/40",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    stats: [
      { label: "Distance", value: "142.8", unit: "km", color: "text-white" },
      { label: "Duration", value: "2h 45m", unit: "", color: "text-white" },
      { label: "Fuel Economy", value: "36.2", unit: "km/L", color: "text-cyan-400" },
      { label: "Top Speed", value: "118", unit: "km/h", color: "text-cyan-400" },
      { label: "Max Lean", value: "31°", unit: "Left", color: "text-purple-400" },
    ],
    footer: { left: "26°C  Clear Sky", right: "Connected with Group" },
  },
  {
    id: "dominar",
    name: "Bajaj Dominar 400",
    tag: "Dominar 400",
    accentColor: "text-orange-400",
    accentBg: "bg-orange-500/20 border-orange-500/40",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    stats: [
      { label: "Distance", value: "218.4", unit: "km", color: "text-white" },
      { label: "Duration", value: "3h 12m", unit: "", color: "text-white" },
      { label: "Fuel Economy", value: "28.6", unit: "km/L", color: "text-orange-400" },
      { label: "Top Speed", value: "154", unit: "km/h", color: "text-orange-400" },
      { label: "Max Lean", value: "42°", unit: "Right", color: "text-purple-400" },
    ],
    footer: { left: "22°C  Partly Cloudy", right: "GPS 100% Lock" },
  },
  {
    id: "cb",
    name: "Honda CB Highness 350",
    tag: "CB 350",
    accentColor: "text-red-400",
    accentBg: "bg-red-500/20 border-red-500/40",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    stats: [
      { label: "Distance", value: "96.3", unit: "km", color: "text-white" },
      { label: "Duration", value: "1h 58m", unit: "", color: "text-white" },
      { label: "Fuel Economy", value: "38.4", unit: "km/L", color: "text-red-400" },
      { label: "Top Speed", value: "112", unit: "km/h", color: "text-red-400" },
      { label: "Max Lean", value: "22°", unit: "Left", color: "text-purple-400" },
    ],
    footer: { left: "29°C  Clear Sky", right: "GPS 100% Lock" },
  },
];

const EXPERIENCE_NODES = [
  {
    id: "Map",
    title: "Map",
    icon: Navigation,
    color: "from-cyan-500 to-blue-500",
    textColor: "text-cyan-400",
    description: "Precision GPS tracking & real-time route visualization mapped dynamically to your speed."
  },
  {
    id: "Music",
    title: "Music",
    icon: Music,
    color: "from-[#1DB954] to-emerald-600",
    textColor: "text-[#1DB954]",
    description: "Live Spotify Web API Intercom Cockpit with speed-adaptive volume boost & speed-trap radar auto-ducking."
  },
  {
    id: "Data",
    title: "Data",
    icon: Activity,
    color: "from-emerald-500 to-teal-500",
    textColor: "text-emerald-400",
    description: "Telemetry, lean angle, fuel efficiency, and speed statistics computed live per ride."
  },
  {
    id: "Routes",
    title: "Routes",
    icon: Compass,
    color: "from-amber-500 to-orange-500",
    textColor: "text-amber-400",
    description: "Route intelligence that turns asphalt into memory and discovers twisties near you."
  },
  {
    id: "Destinations",
    title: "Destinations",
    icon: MapPin,
    color: "from-indigo-500 to-purple-500",
    textColor: "text-indigo-400",
    description: "Keep your favorite pit-stops, mountain passes, and coffee spots accessible in one tap."
  },
  {
    id: "History",
    title: "History",
    icon: BarChart3,
    color: "from-blue-500 to-indigo-500",
    textColor: "text-blue-400",
    description: "Every journey safely archived with full cost, fuel, and performance metrics over time."
  }
];

function App() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeBike, setActiveBike] = useState("hunter");
  const [activeNode, setActiveNode] = useState<string>("Map");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = useCallback(() => {
    navigator.clipboard.writeText("contactphoenixfy@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  }, []);

  const handleWaitlistSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
      }, 3000);
    }
  }, [email]);

  const experienceNodes = EXPERIENCE_NODES;

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background WebGL Animations: HyperSpeed + Interactive TubesCursor */}
      <div className="fixed inset-0 z-0 opacity-35 pointer-events-none">
        <Suspense fallback={null}>
          <HyperSpeed />
        </Suspense>
      </div>
      <TubesCursor className="z-0 opacity-40" interactiveColors={true} />

      {/* Brand Navigation Header */}
      <div className="fixed top-6 left-6 z-50 pointer-events-auto">
        <a href="#" className="no-underline block">
          <Shuffle
            text="RiderIQ"
            shuffleDirection="right"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover={true}
            respectReducedMotion={true}
            tag="span"
            className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-lg cursor-pointer"
          />
        </a>
      </div>

      <StaggeredMenu
        position="right"
        items={menuItems}
        logoUrl=""
        displaySocials={false}
        displayItemNumbering={true}
        menuButtonColor="#ffffff"
        openMenuButtonColor="#06b6d4"
        accentColor="#06b6d4"
        isFixed={true}
      />

      <main className="relative z-10 w-full pt-16 overflow-x-hidden">

        {/* Hero Section */}
        <AnimatedContent distance={80} direction="vertical" duration={0.9} ease="power3.out">
          <section id="overview" className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 py-20 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/15 bg-black/60 backdrop-blur-md text-xs font-mono tracking-widest text-neutral-300 mb-8 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse"></span>
              IN ACTIVE DEVELOPMENT • EARLY ACCESS
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white uppercase leading-[0.9] mb-8">
              Ride smarter.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
                Ride further.
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-xl text-neutral-300 leading-relaxed mb-12">
              RiderIQ turns every motorcycle ride into post-ride telemetry reports, ETA pace calculations, 6-axis lean graphs, and friend leaderboards.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
              <a href="#waitlist" className="w-full sm:w-auto">
                <SpecularButton size="lg" radius={999} lineColor="#06b6d4" baseColor="#0e7490" textColor="#ffffff" className="w-full">
                  Join Waitlist ↗
                </SpecularButton>
              </a>

              <a
                href="#ride-summary"
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-semibold border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all text-center min-h-[44px] flex items-center justify-center"
              >
                View Post-Ride Demo
              </a>
            </div>
          </section>
        </AnimatedContent>


        {/* Post-Ride Summary & ETA Pace Delta Section */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="ride-summary" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              POST-RIDE TELEMETRY & ETA DELTA
            </div>

            <div className="max-w-3xl mb-12 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Automatic Post-Ride Telemetry Card & ETA Comparison
              </h2>
              <p className="text-neutral-300 text-base sm:text-lg">
                After every ride, RiderIQ compiles your distance, top speed, average speed, max lean angle, velocity curve, and compares your actual duration against Google Maps estimated ETA (e.g. <strong>Greater Noida to Mathura: 75 min ETA vs 52 min actual = 23 min faster ⚡</strong>).
              </p>
            </div>

            <PostRideSummaryHUD />
          </section>
        </AnimatedContent>


        {/* Telemetry Engine Overview */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              TELEMETRY ENGINE
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  Intelligent telemetry designed for two wheels.
                </h2>

                <p className="text-lg sm:text-xl text-cyan-300 font-medium leading-relaxed">
                  A smart riding companion engineered around real motorcycle dynamics.
                </p>

                <p className="text-neutral-400 leading-relaxed text-base">
                  Track your journeys, monitor cornering lean angles, analyze fuel efficiency curves, and keep your machine's health metrics connected in one intuitive interface.
                </p>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-neutral-900/60 to-black border border-cyan-500/20 backdrop-blur-md">
                  <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    "Instead of just recording a ride, RiderIQ helps you master it."
                  </p>
                </div>
              </div>

              {/* Multi-Bike Telemetry Widget */}
              <div className="lg:col-span-5 relative">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-20 blur-xl"></div>

                <div className="relative rounded-2xl glass-panel border border-white/15 shadow-2xl overflow-hidden">
                  <div className="flex border-b border-white/10">
                    {bikeProfiles.map((bike) => (
                      <button
                        key={bike.id}
                        onClick={() => setActiveBike(bike.id)}
                        className={`flex-1 px-3 py-3 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                          activeBike === bike.id
                            ? `${bike.accentColor} border-b-2 border-current bg-white/5 font-bold`
                            : "text-neutral-500 hover:text-neutral-300 border-b-2 border-transparent"
                        }`}
                      >
                        {bike.tag}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const bike = bikeProfiles.find(b => b.id === activeBike) || bikeProfiles[0];
                    return (
                      <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bike.accentBg}`}>
                              <Bike className={`w-5 h-5 ${bike.accentColor}`} />
                            </div>
                            <div>
                              <div className="text-xs font-mono text-neutral-400 uppercase">Active Machine</div>
                              <div className="text-sm font-bold text-white">{bike.name}</div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border ${bike.badgeColor}`}>
                            LIVE TELEMETRY
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {bike.stats.map((stat, i) => (
                            <div
                              key={i}
                              className={`p-3.5 rounded-xl bg-white/5 border border-white/10 ${
                                i === bike.stats.length - 1 && bike.stats.length % 2 !== 0
                                  ? "col-span-2"
                                  : ""
                              }`}
                            >
                              <div className="text-[11px] font-mono text-neutral-400 mb-1">{stat.label}</div>
                              <div className={`text-2xl font-black ${stat.color}`}>
                                {stat.value}{" "}
                                {stat.unit && (
                                  <span className="text-xs font-normal text-neutral-400">{stat.unit}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-neutral-300">
                          <span className="flex items-center gap-2">
                            <CloudSun className={`w-4 h-4 ${bike.accentColor}`} />
                            {bike.footer.left}
                          </span>
                          <span className="text-neutral-400">{bike.footer.right}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>
        </AnimatedContent>


        {/* 6-Axis Gyroscope & Mounting Calibration */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="sensor-calibration" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              IMU HARDWARE INTELLIGENCE
            </div>

            <div className="max-w-3xl mb-12 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Mounting Independent Gyroscope Calibration
              </h2>
              <p className="text-neutral-300 text-base sm:text-lg">
                Whether mounted on handlebars, flat in a tank bag, or inside your jacket — RiderIQ's 6-axis IMU algorithm auto-zeroes pitch offsets for true lean accuracy.
              </p>
            </div>

            <SensorCalibrationHUD />
          </section>
        </AnimatedContent>


        {/* Speed Trap & Google / Apple Maps Radar Alerts */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="radar-alerts" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              MAP INTEGRATION & SAFETY
            </div>

            <div className="max-w-3xl mb-12 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Google Maps & Apple Maps Speed Trap Radar Alerts
              </h2>
              <p className="text-neutral-300 text-base sm:text-lg">
                Real-time speed camera warnings, highway speed limit enforcement, and intercom audio alerts synced with Google Maps & Apple Maps SDKs.
              </p>
            </div>

            <NavigationAlertsHUD />
          </section>
        </AnimatedContent>


        {/* Spotify Web API Motorcycle Intercom Cockpit */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="spotify-intercom" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-[#1DB954] font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-[#1DB954]"></span>
              SPOTIFY WEB API INTEGRATION
            </div>

            <div className="max-w-3xl mb-12 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Spotify Intercom Music Cockpit
              </h2>
              <p className="text-neutral-300 text-base sm:text-lg">
                Connect your Spotify Premium account directly to RiderIQ for speed-adaptive wind noise volume boosting, radar alert auto-ducking (-12dB), and one-tap curated riding playlists.
              </p>
            </div>

            <Suspense fallback={
              <div className="rounded-3xl glass-panel border border-white/15 p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-xs font-mono text-neutral-400 animate-pulse">Loading Spotify Cockpit...</div>
              </div>
            }>
              <SpotifyMusicHUD />
            </Suspense>
          </section>
        </AnimatedContent>


        {/* Interactive Lean Angle HUD Simulator */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="telemetry-hud" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              INTERACTIVE SIMULATOR
            </div>

            <div className="max-w-3xl mb-12 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Test the Lean Angle Telemetry HUD
              </h2>
              <p className="text-neutral-300 text-base sm:text-lg">
                Drag the interactive slider below to simulate real-time cornering angles, lateral G-force calculations, and traction safety alerts.
              </p>
            </div>

            <LeanAngleHUD />
          </section>
        </AnimatedContent>


        {/* Multiplayer & Friends Leaderboard */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="multiplayer" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              COMMUNITY & FRIENDS
            </div>

            <div className="max-w-3xl mb-12 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Multiplayer Rankings & Friends Leaderboard
              </h2>
              <p className="text-neutral-300 text-base sm:text-lg">
                Compare weekly distance covered, max lean angles, top speeds, and smoothness ratings with your riding crew.
              </p>
            </div>

            <MultiplayerLeaderboard />
          </section>
        </AnimatedContent>


        {/* Core Capabilities & Trip Calculator */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="tour-calculator" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              CORE CAPABILITIES
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-16">
              Everything your ride demands.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {[
                {
                  title: "Post-Ride Telemetry",
                  desc: "Distance, top speed, avg speed, max lean & velocity graph.",
                  icon: Flag,
                  color: "text-cyan-400"
                },
                {
                  title: "ETA Pace Delta",
                  desc: "Shows exact minutes saved vs Google/Apple Maps initial ETA.",
                  icon: Zap,
                  color: "text-emerald-400"
                },
                {
                  title: "Speed Trap Radar",
                  desc: "Google Maps & Apple Maps speed camera alerts.",
                  icon: Radio,
                  color: "text-red-400"
                },
                {
                  title: "6-Axis IMU Calibration",
                  desc: "Auto-zeroes lean angles regardless of phone mounting location.",
                  icon: Sliders,
                  color: "text-purple-400"
                },
                {
                  title: "Multiplayer Leagues",
                  desc: "Rank distance, top speed, and lean angle against friends.",
                  icon: Users,
                  color: "text-amber-400"
                },
                {
                  title: "Intercom Audio Sync",
                  desc: "Control your intercom playlist without leaving telemetry views.",
                  icon: Music,
                  color: "text-pink-400"
                },
                {
                  title: "Saved Places",
                  desc: "Store favorite mountain stops, coffee spots, and fuel stops.",
                  icon: Bookmark,
                  color: "text-indigo-400"
                },
                {
                  title: "Continuous Expansion",
                  desc: "Built to evolve alongside riders and modern motorcycle sensors.",
                  icon: Globe,
                  color: "text-teal-400"
                }
              ].map((feat, idx) => (
                <div key={idx} className="p-6 rounded-2xl glass-panel glass-panel-hover border border-white/10 flex flex-col justify-between group">
                  <div>
                    <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 ${feat.color} group-hover:scale-110 transition-transform`}>
                      <feat.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <TripCalculator />
          </section>
        </AnimatedContent>


        {/* Interactive Experience Engine Hub */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="experience" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              LIVE INTERFACE
            </div>

            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl sm:text-6xl font-black tracking-tight text-white">
                One connected cockpit.
              </h2>
              <p className="text-neutral-400 text-base sm:text-lg">
                Telemetry, route mapping, audio, and performance analytics synchronized in one view.
              </p>
            </div>

            <div className="relative p-8 md:p-12 rounded-3xl glass-panel border border-white/15 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-black to-purple-950/20 pointer-events-none"></div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10 relative z-10">
                {experienceNodes.map((node) => {
                  const Icon = node.icon;
                  const isSelected = activeNode === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setActiveNode(node.id)}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white/10 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-neutral-400"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? node.textColor : ""}`} />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">{node.title}</span>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const active = experienceNodes.find((n) => n.id === activeNode) || experienceNodes[0];
                const ActiveIcon = active.icon;
                return (
                  <div className="relative z-10 p-8 rounded-2xl bg-black/80 border border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/10">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${active.color} flex items-center justify-center mb-4 shadow-xl`}>
                        <ActiveIcon className="w-8 h-8 text-black font-bold" />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{active.title} Module</h3>
                      <p className="text-xs font-mono text-cyan-400 uppercase">SYNCHRONIZED TELEMETRY</p>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                      <div className="text-xs font-mono text-neutral-400 uppercase">RIDERIQ HARDWARE & APP HUB</div>
                      <p className="text-lg sm:text-xl text-neutral-200 leading-relaxed">
                        {active.description}
                      </p>
                      <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs font-mono text-neutral-300">
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Real-time sync</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Zero fragmentation</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Built for riders</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-12 text-center relative z-10 pt-8 border-t border-white/10">
                <p className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  One ride. One experience. <span className="text-cyan-400">RiderIQ.</span>
                </p>
              </div>
            </div>
          </section>
        </AnimatedContent>


        {/* Creator & Project Identity */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="creator" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-cyan-400"></span>
              CRAFTED BY
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-6 space-y-6">
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  Built with purpose by riders.
                </h2>

                <p className="text-lg text-neutral-300 leading-relaxed">
                  RiderIQ is an independent technology project focused on creating a superior digital experience on two wheels.
                </p>

                <p className="text-neutral-400 leading-relaxed text-base">
                  Designed and developed around the principle that technology should enhance the ride — never distract from it.
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <a
                    href="https://instagram.com/nam7sh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/15 hover:border-cyan-400 text-sm font-medium text-neutral-300 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Instagram</span>
                    <span className="text-xs font-mono text-neutral-400">@nam7sh</span>
                  </a>

                  <a
                    href="https://github.com/namish-yadav"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/15 hover:border-cyan-400 text-sm font-medium text-neutral-300 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>GitHub</span>
                    <span className="text-xs font-mono text-neutral-400">namish-yadav</span>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/namish-yadav-639769408/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/15 hover:border-cyan-400 text-sm font-medium text-neutral-300 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span>LinkedIn</span>
                    <span className="text-xs font-mono text-neutral-400">Namish Yadav</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Cockpit UI", desc: "User-centric UI built for high visibility on two wheels." },
                  { title: "Telemetry Stack", desc: "React, TypeScript, Vite & WebGL telemetry engine." },
                  { title: "Route Mapping", desc: "Polyline tracking & mountain pass memory." },
                  { title: "Analytics", desc: "Fuel economy, lean angle & ride statistics." },
                  { title: "Audio Sync", desc: "Distraction-free soundtrack control while riding." }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-xl glass-panel border border-white/10 hover:border-cyan-500/30 transition-all">
                    <div className="text-xs font-mono text-cyan-400 mb-1">0{idx + 1}</div>
                    <div className="text-lg font-bold text-white mb-1">{item.title}</div>
                    <div className="text-xs text-neutral-400">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedContent>


        {/* Direct Contact */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="contact" className="py-28 px-6 max-w-6xl mx-auto border-t border-white/10">
            <div className="relative p-8 sm:p-12 md:p-14 rounded-3xl glass-panel border border-cyan-500/30 shadow-2xl overflow-hidden bg-gradient-to-br from-cyan-950/30 via-neutral-900/70 to-black">
              {/* Background ambient glow */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]"></span>
                    GET IN TOUCH
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Response &lt; 24 hrs</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
                    Have an idea or feedback?
                  </h2>

                  <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-3xl">
                    Whether you're a rider, developer, brand, or collaborator — let's build the future of riding together.
                  </p>
                </div>

                {/* Pre-filled Email Topic Pills */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-neutral-400 uppercase">Select Topic to Mail</div>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { label: "💡 Feature Idea", subject: "RiderIQ Feature Idea" },
                      { label: "🛠️ Developer API", subject: "RiderIQ Developer API Inquiry" },
                      { label: "🤝 Partnership", subject: "RiderIQ Partnership Proposal" },
                      { label: "🏍️ Rider Feedback", subject: "RiderIQ Rider Feedback" }
                    ].map((topic, i) => (
                      <a
                        key={i}
                        href={`mailto:contactphoenixfy@gmail.com?subject=${encodeURIComponent(topic.subject)}`}
                        className="px-4 py-2 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/50 text-xs font-medium text-neutral-300 hover:text-white transition-all cursor-pointer"
                      >
                        {topic.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-full overflow-hidden">
                  <a href="mailto:contactphoenixfy@gmail.com" className="no-underline shrink-0">
                    <SpecularButton size="lg" radius={999} lineColor="#06b6d4" baseColor="#0891b2" textColor="#ffffff" className="w-full sm:w-auto min-h-[44px]">
                      Contact RiderIQ ↗
                    </SpecularButton>
                  </a>

                  <a
                    href="mailto:contactphoenixfy@gmail.com"
                    className="px-4 sm:px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400 text-xs sm:text-base md:text-lg font-mono text-cyan-400 hover:text-cyan-300 transition-all flex items-center justify-center gap-2 max-w-full overflow-hidden min-h-[44px]"
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
                    <span className="truncate">contactphoenixfy@gmail.com</span>
                  </a>

                  <button
                    onClick={handleCopyEmail}
                    className="px-4 sm:px-5 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-xs font-mono font-bold text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px]"
                    title="Copy Email to Clipboard"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </AnimatedContent>


        {/* Waitlist Early Access Section */}
        <AnimatedContent distance={100} direction="vertical" duration={0.9} ease="power3.out" threshold={0.15}>
          <section id="waitlist" className="py-28 px-6 max-w-5xl mx-auto border-t border-white/10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6">
              EARLY ACCESS
            </div>

            <h2 className="text-4xl sm:text-7xl font-black tracking-tighter text-white mb-6">
              Be there for the first ride.
            </h2>

            <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto mb-4">
              RiderIQ is in active development. Join the waitlist for early telemetry access.
            </p>

            <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-4 rounded-full bg-white/5 border border-white/15 text-white placeholder-neutral-400 focus:outline-none focus:border-cyan-400 text-sm font-medium transition-all"
                />
                <button
                  type="submit"
                  className="px-8 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/25 cursor-pointer whitespace-nowrap"
                >
                  Notify Me
                </button>
              </div>

              {submitted && (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  You're on the list! We'll reach out when RiderIQ hits the road.
                </div>
              )}
            </form>
          </section>
        </AnimatedContent>

      </main>

      <CinematicFooter />
    </div>
  );
}

export default App;