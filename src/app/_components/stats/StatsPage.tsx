"use client";

import { MapPin, TrendingUp, Award, Target, Calendar, Users, ArrowUp } from 'lucide-react';

const weeklyProgress = [
  { day: 'Mon', date: '3/16', km: 12.3 },
  { day: 'Tue', date: '3/17', km: 8.7 },
  { day: 'Wed', date: '3/18', km: 15.2 },
  { day: 'Thu', date: '3/19', km: 18.9 },
  { day: 'Fri', date: '3/20', km: 11.4 },
  { day: 'Sat', date: '3/21', km: 22.1 },
  { day: 'Sun', date: '3/22', km: 16.8 },
];

const topPins = [
  { id: 1, title: 'Placeholder text', location: 'Placeholder text' },
  { id: 2, title: 'Placeholder text', location: 'Placeholder text' },
  { id: 3, title: 'Placeholder text', location: 'Placeholder text' },
];

const achievements = [
  { id: 1, title: 'First Steps', description: 'Explore your first tile', unlocked: true },
  { id: 2, title: 'Explorer', description: 'Reach 20% exploration', unlocked: true },
  { id: 3, title: 'Pathfinder', description: 'Place 25 pins', unlocked: true },
  { id: 4, title: 'Cartographer', description: 'Reach 50% exploration', unlocked: false },
];

const maxWeeklyKm = Math.max(...weeklyProgress.map(d => d.km));
const totalWeeklyKm = weeklyProgress.reduce((sum, d) => sum + d.km, 0);

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-[#0b1020] text-[#E6EDF7] p-6 relative overflow-hidden">
      {/* Subtle minimalist map background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mapPattern" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
            <line x1="100" y1="0" x2="100" y2="400" stroke="#1CE9FD" strokeWidth="2" />
            <line x1="300" y1="0" x2="300" y2="400" stroke="#1CE9FD" strokeWidth="3" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="#1CE9FD" strokeWidth="2" />
            <line x1="0" y1="280" x2="400" y2="280" stroke="#1CE9FD" strokeWidth="3" />
            <line x1="0" y1="0" x2="150" y2="150" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 6" />
            <line x1="250" y1="100" x2="400" y2="250" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 6" />
            <rect x="20" y="20" width="60" height="80" fill="none" stroke="#1CE9FD" strokeWidth="1" opacity="0.3" />
            <rect x="140" y="40" width="50" height="60" fill="none" stroke="#1CE9FD" strokeWidth="1" opacity="0.3" />
            <rect x="320" y="30" width="45" height="70" fill="none" stroke="#1CE9FD" strokeWidth="1" opacity="0.3" />
            <rect x="30" y="160" width="55" height="50" fill="none" stroke="#1CE9FD" strokeWidth="1" opacity="0.3" />
            <rect x="210" y="180" width="70" height="60" fill="none" stroke="#1CE9FD" strokeWidth="1" opacity="0.3" />
            <rect x="330" y="190" width="50" height="55" fill="none" stroke="#1CE9FD" strokeWidth="1" opacity="0.3" />
            <rect x="50" y="310" width="60" height="70" fill="none" stroke="#1CE9FD" strokeWidth="1" opacity="0.3" />
            <rect x="180" y="320" width="45" height="50" fill="none" stroke="#1CE9FD" strokeWidth="1" opacity="0.3" />
            <circle cx="75" cy="60" r="4" fill="#38bdf8" opacity="0.4" />
            <circle cx="250" cy="200" r="4" fill="#38bdf8" opacity="0.4" />
            <circle cx="350" cy="340" r="4" fill="#38bdf8" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapPattern)" />
      </svg>

      {/* Radial glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1CE9FD] opacity-[0.04] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#38bdf8] opacity-[0.04] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 pt-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-[#38bdf8] via-[#1CE9FD] to-[#38bdf8] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(28,233,253,0.2)]">
            Your Stats
          </h1>
          <p className="text-[#BFC8D9] text-xl">Track your exploration journey</p>
        </div>

        {/* Exploration Breakdown */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1a2540] rounded-xl p-8 border-4 border-[#1CE9FD] mb-8 relative overflow-hidden shadow-[0_0_20px_rgba(28,233,253,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(28,233,253,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#1CE9FD]/10 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-[#1CE9FD]/10 to-transparent rounded-tr-full" />
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <circle cx="90%" cy="20%" r="80" fill="none" stroke="#1CE9FD" strokeWidth="1.5" />
            <circle cx="90%" cy="20%" r="100" fill="none" stroke="#1CE9FD" strokeWidth="1" />
            <path d="M 10% 80% L 15% 75% L 20% 82% L 25% 77% L 30% 83%" stroke="#38bdf8" strokeWidth="2" fill="none" />
          </svg>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2 relative z-10">
            <span className="text-[#1CE9FD] drop-shadow-[0_0_8px_rgba(28,233,253,0.3)]">◆</span>
            Exploration Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            <div className="text-center">
              <div className="text-6xl font-bold text-[#38bdf8] mb-3 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">----</div>
              <div className="text-[#BFC8D9] text-base font-medium">Tiles Explored</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-[#656A73] mb-3">----</div>
              <div className="text-[#BFC8D9] text-base font-medium">Tiles Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#38bdf8] mb-3">-- ---, ----</div>
              <div className="text-[#BFC8D9] text-base font-medium">Join Date</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-[#38bdf8] to-[#1CE9FD] bg-clip-text text-transparent mb-3 drop-shadow-[0_0_15px_rgba(28,233,253,0.3)]">
                LVL ----
              </div>
              <div className="text-[#BFC8D9] mb-4 text-base font-medium">Current Level</div>
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-[#0b1020] rounded-full h-5 mb-2 overflow-hidden border-2 border-[#1a2540] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                  <div className="h-full w-0 bg-gradient-to-r from-[#38bdf8] via-[#1CE9FD] to-[#38bdf8] rounded-full shadow-[0_0_8px_rgba(28,233,253,0.3)]" />
                </div>
                <div className="text-base text-[#BFC8D9]">
                  <span className="text-[#38bdf8] font-semibold">----</span> / <span className="text-[#38bdf8] font-semibold">----</span> XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1a2540] rounded-xl p-8 border-4 border-[#1CE9FD] mb-8 relative overflow-hidden shadow-[0_0_20px_rgba(28,233,253,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(28,233,253,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300">
          <div className="absolute top-0 right-0 w-full h-full opacity-[0.07]">
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-[#1CE9FD] via-[#1CE9FD] to-transparent rotate-45 origin-top-right" />
            <div className="absolute top-0 right-20 w-1 h-full bg-gradient-to-b from-[#1CE9FD] to-transparent rotate-45 origin-top-right" />
          </div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <path d="M 15% 30% Q 25% 25%, 35% 30% T 55% 30% T 75% 30%" stroke="#38bdf8" strokeWidth="2" fill="none" strokeDasharray="5 5" />
            <circle cx="10%" cy="15%" r="25" fill="none" stroke="#1CE9FD" strokeWidth="1" />
          </svg>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-[#1CE9FD] drop-shadow-[0_0_8px_rgba(28,233,253,0.4)]" />
              Weekly Progress
            </h2>
            <span className="text-base text-[#BFC8D9] bg-[#1a2540] px-4 py-2 rounded-full border-2 border-[#656A73]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">3/16 - 3/22</span>
          </div>
          <div className="space-y-4 mb-8 relative z-10">
            {weeklyProgress.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-16 text-right">
                  <div className="text-sm font-semibold text-[#E6EDF7]">{day.day}</div>
                  <div className="text-xs text-[#BFC8D9]">{day.date}</div>
                </div>
                <div className="flex-1 relative">
                  <div className="w-full bg-[#0b1020] rounded-full h-8 border-2 border-[#1a2540] shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1d6fb0] via-[#38bdf8] to-[#1CE9FD] rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                      style={{ width: `${(day.km / maxWeeklyKm) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </div>
                </div>
                <div className="w-24 text-left">
                  <span className="text-lg font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
                    {day.km} km
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center py-8 relative z-10 border-t-2 border-[#1a2540]">
            <p className="text-4xl text-[#E6EDF7] mb-4">
              You walked <span className="text-[#38bdf8] font-bold drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">{totalWeeklyKm.toFixed(1)} km</span> this week!
            </p>
            <p className="text-2xl text-[#BFC8D9]">
              Average: <span className="text-[#38bdf8] font-semibold">{(totalWeeklyKm / weeklyProgress.length).toFixed(1)} km/day</span>
            </p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1a2540] rounded-xl p-6 border-4 border-[#656A73] shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[#38bdf8] hover:shadow-[0_8px_24px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <path d="M 70% 20% L 90% 30% L 85% 50%" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
              <circle cx="15%" cy="70%" r="15" fill="none" stroke="#38bdf8" strokeWidth="1" />
            </svg>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1a2540] to-[#0b1020] rounded-lg flex items-center justify-center border-2 border-[#656A73]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] group-hover:border-[#38bdf8]/60 transition-all">
                <TrendingUp className="w-6 h-6 text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
              </div>
              <span className="text-[#BFC8D9] text-base font-medium">Total Distance</span>
            </div>
            <div className="text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">---- km</div>
          </div>

          <div className="bg-gradient-to-br from-[#0F172A] to-[#1a2540] rounded-xl p-6 border-4 border-[#1CE9FD] relative overflow-hidden shadow-[0_0_30px_rgba(28,233,253,0.2),0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(28,233,253,0.3),0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1CE9FD]/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1a2540] to-[#0b1020] rounded-lg flex items-center justify-center border-2 border-[#1CE9FD]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(28,233,253,0.15)] group-hover:border-[#1CE9FD]/70 transition-all">
                <MapPin className="w-6 h-6 text-[#1CE9FD] drop-shadow-[0_0_6px_rgba(28,233,253,0.4)]" />
              </div>
              <span className="text-[#BFC8D9] text-base font-medium">Pins Placed</span>
            </div>
            <div className="text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] relative z-10">----</div>
          </div>

          <div className="bg-gradient-to-br from-[#0F172A] to-[#1a2540] rounded-xl p-6 border-4 border-[#656A73] shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[#38bdf8] hover:shadow-[0_8px_24px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:scale-[1.02] group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1a2540] to-[#0b1020] rounded-lg flex items-center justify-center border-2 border-[#656A73]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] group-hover:border-[#38bdf8]/60 transition-all">
                <MapPin className="w-6 h-6 text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.3)]" />
              </div>
              <span className="text-[#BFC8D9] text-base font-medium">Pins Visited</span>
            </div>
            <div className="text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">----</div>
          </div>

          <div className="bg-gradient-to-br from-[#0F172A] to-[#1a2540] rounded-xl p-6 border-4 border-[#1CE9FD] relative overflow-hidden shadow-[0_0_30px_rgba(28,233,253,0.2),0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(28,233,253,0.3),0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#1CE9FD]/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1a2540] to-[#0b1020] rounded-lg flex items-center justify-center border-2 border-[#1CE9FD]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(28,233,253,0.15)] group-hover:border-[#1CE9FD]/70 transition-all">
                <Users className="w-6 h-6 text-[#1CE9FD] drop-shadow-[0_0_6px_rgba(28,233,253,0.4)]" />
              </div>
              <span className="text-[#BFC8D9] text-base font-medium">Total Upvotes</span>
            </div>
            <div className="text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] relative z-10">----</div>
          </div>

          <div className="bg-gradient-to-br from-[#0F172A] to-[#1a2540] rounded-xl p-6 border-4 border-[#1CE9FD] relative overflow-hidden shadow-[0_0_30px_rgba(28,233,253,0.2),0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(28,233,253,0.3),0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1CE9FD]/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1a2540] to-[#0b1020] rounded-lg flex items-center justify-center border-2 border-[#1CE9FD]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(28,233,253,0.15)] group-hover:border-[#1CE9FD]/70 transition-all">
                <Calendar className="w-6 h-6 text-[#1CE9FD] drop-shadow-[0_0_6px_rgba(28,233,253,0.4)]" />
              </div>
              <span className="text-[#BFC8D9] text-base font-medium">Days Active</span>
            </div>
            <div className="text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] relative z-10">----</div>
          </div>
        </div>

        {/* Top Pins and Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1a2540] rounded-xl p-6 border-4 border-[#656A73] shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[#38bdf8] hover:shadow-[0_8px_24px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#38bdf8]/5 rounded-full blur-3xl" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <circle cx="85%" cy="25%" r="35" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            </svg>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2 relative z-10">
              <MapPin className="w-7 h-7 text-[#38bdf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
              Top Pins
            </h2>
            <div className="space-y-4 relative z-10">
              {topPins.map((pin, index) => {
                const medal = [
                  {
                    bg: "bg-gradient-to-br from-[#FFE566] to-[#F59E0B]",
                    shadow: "shadow-[0_0_18px_rgba(255,210,0,0.7)]",
                    hoverShadow: "group-hover:shadow-[0_0_28px_rgba(255,210,0,0.9)]",
                    text: "text-[#7A4800]",
                  },
                  {
                    bg: "bg-gradient-to-br from-[#E2E8F0] to-[#94A3B8]",
                    shadow: "shadow-[0_0_14px_rgba(148,163,184,0.5)]",
                    hoverShadow: "group-hover:shadow-[0_0_22px_rgba(148,163,184,0.7)]",
                    text: "text-[#334155]",
                  },
                  {
                    bg: "bg-gradient-to-br from-[#D97B3A] to-[#92400E]",
                    shadow: "shadow-[0_0_14px_rgba(205,127,50,0.5)]",
                    hoverShadow: "group-hover:shadow-[0_0_22px_rgba(205,127,50,0.7)]",
                    text: "text-[#FDE8C8]",
                  },
                ][index]!;
                return (
                <div
                  key={pin.id}
                  className="flex items-center gap-4 p-4 bg-[#1a2540] rounded-lg border-2 border-[#656A73] shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.02)] hover:border-[#38bdf8] hover:shadow-[0_4px_16px_rgba(56,189,248,0.1),inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300 hover:scale-[1.01] group"
                >
                  <div className={`w-12 h-12 ${medal.bg} rounded-full flex items-center justify-center font-bold text-xl ${medal.shadow} ${medal.hoverShadow} ${medal.text} transition-shadow`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-[#E6EDF7]">{pin.title}</div>
                    <div className="text-base text-[#BFC8D9]">{pin.location}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[#38bdf8] bg-[#0b1020] px-3 py-1.5 rounded-full border-2 border-[#656A73]/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] group-hover:border-[#38bdf8]/60 transition-all">
                    <ArrowUp className="w-5 h-5" />
                    <span className="font-bold text-lg">----</span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0F172A] to-[#1a2540] rounded-xl p-6 border-4 border-[#1CE9FD] relative overflow-hidden shadow-[0_0_30px_rgba(28,233,253,0.2),0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(28,233,253,0.3),0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#1CE9FD]/5 rounded-full blur-3xl" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
              <circle cx="85%" cy="15%" r="30" fill="none" stroke="#1CE9FD" strokeWidth="1.5" />
              <path d="M 75% 55% L 80% 60% L 75% 65% L 70% 60% Z" fill="none" stroke="#1CE9FD" strokeWidth="1.5" />
            </svg>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2 relative z-10">
              <Award className="w-7 h-7 text-[#1CE9FD] drop-shadow-[0_0_10px_rgba(28,233,253,0.6)]" />
              Achievements
            </h2>
            <div className="space-y-4 relative z-10">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-300 ${
                    achievement.unlocked
                      ? 'bg-[#1a2540] border-[#38bdf8] shadow-[0_2px_12px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#1CE9FD] hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(28,233,253,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]'
                      : 'bg-[#0F172A] border-[#656A73] opacity-50 shadow-[0_2px_6px_rgba(0,0,0,0.2)]'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-[#38bdf8] to-[#1d6fb0] shadow-[0_0_20px_rgba(56,189,248,0.4)]'
                        : 'bg-[#656A73] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <Award className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-[#E6EDF7]">{achievement.title}</div>
                    <div className="text-base text-[#BFC8D9]">{achievement.description}</div>
                  </div>
                  {achievement.unlocked && (
                    <div className="text-[#1CE9FD] drop-shadow-[0_0_10px_rgba(28,233,253,0.6)]">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
