import React, { useState, useMemo } from 'react';
import { Trophy, Users, Award, Flame, ChevronRight } from 'lucide-react';

type LeaderboardCategory = 'topSpeed' | 'distance' | 'lean' | 'smoothness';

export default function MultiplayerLeaderboard() {
  const [category, setCategory] = useState<LeaderboardCategory>('topSpeed');

  const rawRiders = [
    {
      id: 'arav',
      name: "Arav Dahiya",
      handle: "@aravdah1ya",
      bike: "BMW S1000RR",
      avatarBg: "bg-blue-500",
      distance: "2,450 km",
      lean: "48.5°",
      topSpeed: "298 km/h",
      smoothness: "99 pts",
      isUser: false,
      badge: "SUPERBIKE KING"
    },
    {
      id: 'abhinav',
      name: "Abhinav Verma",
      handle: "@abhinav_verma",
      bike: "Bajaj Dominar 400",
      avatarBg: "bg-orange-500",
      distance: "1,840 km",
      lean: "42.0°",
      topSpeed: "162 km/h",
      smoothness: "95 pts",
      isUser: false,
      badge: "DOMINAR SPEEDSTER"
    },
    {
      id: 'namish',
      name: "Namish Yadav",
      handle: "@nam7sh",
      bike: "Royal Enfield Hunter 350",
      avatarBg: "bg-cyan-500",
      distance: "1,428 km",
      lean: "36.5°",
      topSpeed: "132 km/h",
      smoothness: "98 pts",
      isUser: true,
      badge: "LEGEND RIDER"
    },
    {
      id: 'aryan',
      name: "Aryan Nagar",
      handle: "@diabolic",
      bike: "Honda CB Highness 350",
      avatarBg: "bg-purple-500",
      distance: "963 km",
      lean: "22.0°",
      topSpeed: "108 km/h",
      smoothness: "92 pts",
      isUser: false,
      badge: "CB CRUISER"
    }
  ];

  // Dynamic sorting & re-ranking logic based on selected category metric
  const sortedRiders = useMemo(() => {
    const parseValue = (valStr: string) => {
      const num = parseFloat(valStr.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    return [...rawRiders]
      .sort((a, b) => parseValue(b[category]) - parseValue(a[category]))
      .map((rider, idx) => ({ ...rider, rank: idx + 1 }));
  }, [category]);

  return (
    <div className="rounded-2xl glass-panel border border-white/15 p-6 md:p-8 relative overflow-hidden shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            MULTIPLAYER & COMMUNITY LEADERBOARD
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Compete & Rank Among Friends
          </h3>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1 rounded-full border border-white/10">
          {[
            { id: 'topSpeed', label: 'Top Speed' },
            { id: 'distance', label: 'Distance' },
            { id: 'lean', label: 'Max Lean' },
            { id: 'smoothness', label: 'Smoothness' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as LeaderboardCategory)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                category === cat.id
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table / Cards (Dynamically Sorted) */}
      <div className="space-y-3">
        {sortedRiders.map((friend) => {
          let metricValue = friend.topSpeed;
          if (category === 'distance') metricValue = friend.distance;
          if (category === 'lean') metricValue = friend.lean;
          if (category === 'smoothness') metricValue = friend.smoothness;

          return (
            <div
              key={friend.id}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                friend.isUser
                  ? 'bg-cyan-950/40 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm font-mono">
                  {friend.rank === 1 ? (
                    <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  ) : friend.rank === 2 ? (
                    <Award className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />
                  ) : friend.rank === 3 ? (
                    <Award className="w-5 h-5 text-amber-600" />
                  ) : (
                    <span className="text-neutral-500">#{friend.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${friend.avatarBg} text-black font-black text-sm flex items-center justify-center shadow-md`}>
                  {friend.name.charAt(0)}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm sm:text-base">{friend.name}</span>
                    {friend.isUser && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                        YOU
                      </span>
                    )}
                    <span className="hidden md:inline-block text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {friend.badge}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                    <span>{friend.handle}</span>
                    <span>•</span>
                    <span className="text-cyan-300 font-semibold">{friend.bike}</span>
                  </div>
                </div>
              </div>

              {/* Metric Score & Badge */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                    {category === 'topSpeed' ? 'TOP SPEED' : category === 'distance' ? 'DISTANCE' : category === 'lean' ? 'MAX LEAN' : 'SMOOTHNESS'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-400">{metricValue}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 hidden sm:block" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-400">
        <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-400" /> Weekly Rider League resets in 2d 14h</span>
        <span>Friends Sync Connected</span>
      </div>
    </div>
  );
}
