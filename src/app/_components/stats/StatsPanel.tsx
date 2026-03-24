"use client";

import { useEffect, useState } from "react";
import { MapPin, TrendingUp, Award, Target, Calendar, Users, ArrowUp, X } from "lucide-react";

interface StatsPanelProps {
  onClose: () => void;
}

// Mock data — replace with real queries later
const stats = {
  joinDate: "March 16, 2026",
  weeklyProgress: [
    { day: "Mon", date: "3/16", km: 12.3 },
    { day: "Tue", date: "3/17", km: 8.7 },
    { day: "Wed", date: "3/18", km: 15.2 },
    { day: "Thu", date: "3/19", km: 18.9 },
    { day: "Fri", date: "3/20", km: 11.4 },
    { day: "Sat", date: "3/21", km: 22.1 },
    { day: "Sun", date: "3/22", km: 16.8 },
  ],
  topPins: [
    { id: 1, title: "Placeholder text", upvotes: 45, location: "Placeholder text" },
    { id: 2, title: "Placeholder text", upvotes: 38, location: "Placeholder text" },
    { id: 3, title: "Placeholder text", upvotes: 29, location: "Placeholder text" },
  ],
  achievements: [
    { id: 1, title: "First Steps", description: "Explore your first tile", unlocked: true },
    { id: 2, title: "Explorer", description: "Reach 20% exploration", unlocked: true },
    { id: 3, title: "Pathfinder", description: "Place 25 pins", unlocked: true },
    { id: 4, title: "Cartographer", description: "Reach 50% exploration", unlocked: false },
  ],
};

const maxWeeklyKm = Math.max(...stats.weeklyProgress.map((d) => d.km));

export function StatsPanel({ onClose }: StatsPanelProps) {
  const [visible, setVisible] = useState(false);

  // Trigger enter animation after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={[
        "fixed inset-0 z-20 bg-[#0b1020] text-[#E6EDF7]",
        "transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "-translate-y-full",
      ].join(" ")}
    >
      {/* X button — fixed to top-right, doesn't scroll */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-4 top-4 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label="Close stats"
      >
        <X size={16} />
      </button>

      {/* Scrollable content wrapper */}
      <div className="stats-scrollbar h-full overflow-y-auto">
      {/* Subtle map background */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.02]"
        xmlns="http://www.w3.org/2000/svg"
      >
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
            <circle cx="75" cy="60" r="4" fill="#38bdf8" opacity="0.4" />
            <circle cx="250" cy="200" r="4" fill="#38bdf8" opacity="0.4" />
            <circle cx="350" cy="340" r="4" fill="#38bdf8" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapPattern)" />
      </svg>

      {/* Radial glows */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#1CE9FD] opacity-[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#38bdf8] opacity-[0.04] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl p-6 pb-32">
        {/* Header row */}
        <div className="mb-8 pr-12">
          <h1 className="mb-2 bg-gradient-to-r from-[#38bdf8] via-[#1CE9FD] to-[#38bdf8] bg-clip-text text-5xl font-bold text-transparent drop-shadow-[0_0_15px_rgba(28,233,253,0.2)]">
            Your Stats
          </h1>
          <p className="text-xl text-[#BFC8D9]">Track your exploration journey</p>
        </div>

        {/* Exploration Breakdown */}
        <div className="relative mb-8 overflow-hidden rounded-xl border-4 border-[#1CE9FD] bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1a2540] p-8 shadow-[0_0_20px_rgba(28,233,253,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(28,233,253,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-gradient-to-br from-[#1CE9FD]/10 to-transparent" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-tr-full bg-gradient-to-tr from-[#1CE9FD]/10 to-transparent" />

          <h2 className="relative z-10 mb-8 flex items-center gap-2 text-3xl font-bold">
            <span className="text-[#1CE9FD] drop-shadow-[0_0_8px_rgba(28,233,253,0.3)]">◆</span>
            Exploration Breakdown
          </h2>

          <div className="relative z-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-3 text-5xl font-bold text-[#38bdf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                ----
              </div>
              <div className="text-base font-medium text-[#BFC8D9]">Tiles Explored</div>
            </div>
            <div className="text-center">
              <div className="mb-3 text-5xl font-bold text-[#656A73]">----</div>
              <div className="text-base font-medium text-[#BFC8D9]">Tiles Remaining</div>
            </div>
            <div className="text-center">
              <div className="mb-3 text-xl font-bold text-[#38bdf8]">{stats.joinDate}</div>
              <div className="text-base font-medium text-[#BFC8D9]">Join Date</div>
            </div>
            <div className="text-center">
              <div className="mb-3 bg-gradient-to-r from-[#38bdf8] to-[#1CE9FD] bg-clip-text text-5xl font-bold text-transparent drop-shadow-[0_0_15px_rgba(28,233,253,0.3)]">
                LVL ----
              </div>
              <div className="mb-4 text-base font-medium text-[#BFC8D9]">Current Level</div>
              <div className="mx-auto max-w-xs">
                <div className="mb-2 h-5 w-full overflow-hidden rounded-full border-2 border-[#1a2540] bg-[#0b1020] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                  <div
                    className="h-full w-[69%] rounded-full bg-gradient-to-r from-[#38bdf8] via-[#1CE9FD] to-[#38bdf8] shadow-[0_0_8px_rgba(28,233,253,0.3)] transition-all duration-500"
                  />
                </div>
                <div className="text-base text-[#BFC8D9]">
                  <span className="font-semibold text-[#38bdf8]">----</span> /{" "}
                  <span className="font-semibold text-[#38bdf8]">----</span> XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="relative mb-8 overflow-hidden rounded-xl border-4 border-[#1CE9FD] bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1a2540] p-8 shadow-[0_0_20px_rgba(28,233,253,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(28,233,253,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="relative z-10 mb-8 flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-3xl font-bold">
              <Target className="h-8 w-8 text-[#1CE9FD] drop-shadow-[0_0_8px_rgba(28,233,253,0.4)]" />
              Weekly Progress
            </h2>
            <span className="rounded-full border-2 border-[#656A73]/40 bg-[#1a2540] px-4 py-2 text-base text-[#BFC8D9] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              3/16 – 3/22
            </span>
          </div>

          <div className="relative z-10 mb-8 space-y-4">
            {stats.weeklyProgress.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-16 text-right">
                  <div className="text-sm font-semibold text-[#E6EDF7]">{day.day}</div>
                  <div className="text-xs text-[#BFC8D9]">{day.date}</div>
                </div>
                <div className="flex-1">
                  <div className="h-8 w-full overflow-hidden rounded-full border-2 border-[#1a2540] bg-[#0b1020] shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
                    <div
                      className="group relative h-full overflow-hidden rounded-full bg-gradient-to-r from-[#1d6fb0] via-[#38bdf8] to-[#1CE9FD] shadow-[0_0_8px_rgba(56,189,248,0.3)] transition-all duration-700 ease-out"
                      style={{ width: `${(day.km / maxWeeklyKm) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </div>
                </div>
                <div className="w-24 text-left">
                  <span className="text-lg font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
                    ---- km
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 border-t-2 border-[#1a2540] py-8 text-center">
            <p className="mb-4 text-3xl text-[#E6EDF7]">
              You walked{" "}
              <span className="font-bold text-[#38bdf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                ---- km
              </span>{" "}
              this week!
            </p>
            <p className="text-xl text-[#BFC8D9]">
              Average:{" "}
              <span className="font-semibold text-[#38bdf8]">
                ---- km/day
              </span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Distance */}
          <div className="group relative overflow-hidden rounded-xl border-4 border-[#656A73] bg-gradient-to-br from-[#0F172A] to-[#1a2540] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 hover:scale-[1.02] hover:border-[#38bdf8] hover:shadow-[0_8px_24px_rgba(56,189,248,0.15)]">
            <div className="relative z-10 mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#656A73]/40 bg-gradient-to-br from-[#1a2540] to-[#0b1020] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all group-hover:border-[#38bdf8]/60">
                <TrendingUp className="h-6 w-6 text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
              </div>
              <span className="text-base font-medium text-[#BFC8D9]">Total Distance</span>
            </div>
            <div className="text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">----</div>
          </div>

          {/* Pins Placed */}
          <div className="group relative overflow-hidden rounded-xl border-4 border-[#1CE9FD] bg-gradient-to-br from-[#0F172A] to-[#1a2540] p-6 shadow-[0_0_30px_rgba(28,233,253,0.2),0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(28,233,253,0.3)]">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#1CE9FD]/5 blur-2xl" />
            <div className="relative z-10 mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#1CE9FD]/40 bg-gradient-to-br from-[#1a2540] to-[#0b1020] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(28,233,253,0.15)] transition-all group-hover:border-[#1CE9FD]/70">
                <MapPin className="h-6 w-6 text-[#1CE9FD] drop-shadow-[0_0_6px_rgba(28,233,253,0.4)]" />
              </div>
              <span className="text-base font-medium text-[#BFC8D9]">Pins Placed</span>
            </div>
            <div className="relative z-10 text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">----</div>
          </div>

          {/* Pins Visited */}
          <div className="group relative overflow-hidden rounded-xl border-4 border-[#656A73] bg-gradient-to-br from-[#0F172A] to-[#1a2540] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:border-[#38bdf8] hover:shadow-[0_8px_24px_rgba(56,189,248,0.15)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#656A73]/40 bg-gradient-to-br from-[#1a2540] to-[#0b1020] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all group-hover:border-[#38bdf8]/60">
                <MapPin className="h-6 w-6 text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.3)]" />
              </div>
              <span className="text-base font-medium text-[#BFC8D9]">Pins Visited</span>
            </div>
            <div className="text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">----</div>
          </div>

          {/* Total Upvotes */}
          <div className="group relative overflow-hidden rounded-xl border-4 border-[#1CE9FD] bg-gradient-to-br from-[#0F172A] to-[#1a2540] p-6 shadow-[0_0_30px_rgba(28,233,253,0.2),0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(28,233,253,0.3)]">
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#1CE9FD]/5 blur-2xl" />
            <div className="relative z-10 mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#1CE9FD]/40 bg-gradient-to-br from-[#1a2540] to-[#0b1020] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(28,233,253,0.15)] transition-all group-hover:border-[#1CE9FD]/70">
                <Users className="h-6 w-6 text-[#1CE9FD] drop-shadow-[0_0_6px_rgba(28,233,253,0.4)]" />
              </div>
              <span className="text-base font-medium text-[#BFC8D9]">Total Upvotes</span>
            </div>
            <div className="relative z-10 text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">----</div>
          </div>

          {/* Days Active */}
          <div className="group relative overflow-hidden rounded-xl border-4 border-[#1CE9FD] bg-gradient-to-br from-[#0F172A] to-[#1a2540] p-6 shadow-[0_0_30px_rgba(28,233,253,0.2),0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(28,233,253,0.3)]">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#1CE9FD]/5 blur-2xl" />
            <div className="relative z-10 mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#1CE9FD]/40 bg-gradient-to-br from-[#1a2540] to-[#0b1020] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(28,233,253,0.15)] transition-all group-hover:border-[#1CE9FD]/70">
                <Calendar className="h-6 w-6 text-[#1CE9FD] drop-shadow-[0_0_6px_rgba(28,233,253,0.4)]" />
              </div>
              <span className="text-base font-medium text-[#BFC8D9]">Days Active</span>
            </div>
            <div className="relative z-10 text-4xl font-bold text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">----</div>
          </div>
        </div>

        {/* Top Pins + Achievements */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Top Pins */}
          <div className="relative overflow-hidden rounded-xl border-4 border-[#656A73] bg-gradient-to-br from-[#0F172A] to-[#1a2540] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-[#38bdf8] hover:shadow-[0_8px_24px_rgba(56,189,248,0.15)]">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#38bdf8]/5 blur-3xl" />
            <h2 className="relative z-10 mb-6 flex items-center gap-2 text-3xl font-bold">
              <MapPin className="h-7 w-7 text-[#38bdf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
              Top Pins
            </h2>
            <div className="relative z-10 space-y-4">
              {stats.topPins.map((pin, index) => (
                <div
                  key={pin.id}
                  className="group flex items-center gap-4 rounded-lg border-2 border-[#656A73] bg-[#1a2540] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-[1.01] hover:border-[#38bdf8] hover:shadow-[0_4px_16px_rgba(56,189,248,0.1)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#1d6fb0] text-xl font-bold shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-shadow group-hover:shadow-[0_0_20px_rgba(56,189,248,0.6)]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-[#E6EDF7]">{pin.title}</div>
                    <div className="text-base text-[#BFC8D9]">{pin.location}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border-2 border-[#656A73]/40 bg-[#0b1020] px-3 py-1.5 text-[#38bdf8] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all group-hover:border-[#38bdf8]/60">
                    <ArrowUp className="h-5 w-5" />
                    <span className="text-lg font-bold">----</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="relative overflow-hidden rounded-xl border-4 border-[#1CE9FD] bg-gradient-to-br from-[#0F172A] to-[#1a2540] p-6 shadow-[0_0_30px_rgba(28,233,253,0.2),0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(28,233,253,0.3)]">
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#1CE9FD]/5 blur-3xl" />
            <h2 className="relative z-10 mb-6 flex items-center gap-2 text-3xl font-bold">
              <Award className="h-7 w-7 text-[#1CE9FD] drop-shadow-[0_0_10px_rgba(28,233,253,0.6)]" />
              Achievements
            </h2>
            <div className="relative z-10 space-y-4">
              {stats.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={[
                    "flex items-center gap-4 rounded-lg border-2 p-4 transition-all duration-300",
                    achievement.unlocked
                      ? "border-[#38bdf8] bg-[#1a2540] shadow-[0_2px_12px_rgba(56,189,248,0.15)] hover:scale-[1.01] hover:border-[#1CE9FD] hover:shadow-[0_4px_20px_rgba(28,233,253,0.2)]"
                      : "border-[#656A73] bg-[#0F172A] opacity-50 shadow-[0_2px_6px_rgba(0,0,0,0.2)]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300",
                      achievement.unlocked
                        ? "bg-gradient-to-br from-[#38bdf8] to-[#1d6fb0] shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                        : "bg-[#656A73] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
                    ].join(" ")}
                  >
                    <Award className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-[#E6EDF7]">{achievement.title}</div>
                    <div className="text-base text-[#BFC8D9]">{achievement.description}</div>
                  </div>
                  {achievement.unlocked && (
                    <svg className="h-8 w-8 text-[#1CE9FD] drop-shadow-[0_0_10px_rgba(28,233,253,0.6)]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>{/* end scrollable wrapper */}
    </div>
  );
}
