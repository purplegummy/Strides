"use client";

import { MapPin, TrendingUp, Award, Target, Calendar, Users, ArrowUp } from 'lucide-react';
import { api } from '~/trpc/react';
import { xpToLevel, xpProgress } from '~/lib/xp';

const ACHIEVEMENTS = [
  { id: 'first-steps', title: 'First Steps', description: 'Explore your first tile', unlocked: (tilesDiscovered: number) => tilesDiscovered > 0 },
  { id: 'explorer', title: 'Explorer', description: 'Reach 20% exploration', unlocked: (_: number, pct: number) => pct >= 20 },
  { id: 'pathfinder', title: 'Pathfinder', description: 'Place 25 pins', unlocked: (_: number, __: number, pinsPlaced: number) => pinsPlaced >= 25 },
  { id: 'cartographer', title: 'Cartographer', description: 'Reach 50% exploration', unlocked: (_: number, pct: number) => pct >= 50 },
];

export default function StatsPage({ darkMode = true }: { darkMode?: boolean }) {
  const statsQuery = api.map.getExplorationStats.useQuery({ cityId: 'atlanta' });
  const fullStatsQuery = api.map.getStats.useQuery();
  const xpQuery = api.quest.getXp.useQuery();

  const exploration = statsQuery.data;
  const full = fullStatsQuery.data;
  const xp = xpQuery.data?.xp ?? 0;
  const level = xpToLevel(xp);
  const { current: xpCurrent, next: xpNext } = xpProgress(xp);

  const weeklyProgress = full?.weeklyProgress ?? [];
  const maxWeeklyKm = weeklyProgress.length > 0 ? Math.max(...weeklyProgress.map(d => d.km), 0.1) : 1;
  const totalWeeklyKm = weeklyProgress.reduce((sum, d) => sum + d.km, 0);

  const joinDate = full?.joinDate
    ? new Date(full.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  const tilesDiscovered = exploration?.tilesDiscovered ?? 0;
  const totalTiles = exploration?.totalTiles ?? 0;
  const tilesRemaining = totalTiles - tilesDiscovered;
  const percentage = exploration?.percentage ?? 0;
  const pinsPlaced = full?.pinsPlaced ?? 0;

  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    isUnlocked: a.unlocked(tilesDiscovered, percentage, pinsPlaced),
  }));

  const t = darkMode
    ? {
        page: 'bg-[#0a1628] text-white',
        heading: 'text-white',
        subheading: 'text-[#6b7c95]',
        sectionLabel: 'text-[#6b7c95]',
        card: 'bg-[#0f1e35] border-[#1e3050]',
        text: 'text-white',
        muted: 'text-[#6b7c95]',
        dimmed: 'text-[#3d4f6b]',
        barBg: 'bg-[#1e3050]',
        iconBg: 'bg-[#1e3050]',
        divider: 'border-[#1e3050]',
        lockedBadge: 'bg-[#3d4f6b]',
      }
    : {
        page: 'bg-[#f8fafc] text-gray-900',
        heading: 'text-gray-900',
        subheading: 'text-gray-500',
        sectionLabel: 'text-gray-500',
        card: 'bg-white border-gray-200',
        text: 'text-gray-900',
        muted: 'text-gray-500',
        dimmed: 'text-gray-400',
        barBg: 'bg-gray-200',
        iconBg: 'bg-gray-100',
        divider: 'border-gray-200',
        lockedBadge: 'bg-gray-300',
      };

  return (
    <div className={`min-h-screen ${t.page} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-1 ${t.heading}`}>Your Stats</h1>
          <p className={`text-base ${t.subheading}`}>Track your exploration journey</p>
        </div>

        {/* EXPLORATION OVERVIEW */}
        <div className="mb-5">
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ml-1 ${t.sectionLabel}`}>Exploration Overview</h2>
          <div className={`border rounded-2xl p-6 ${t.card}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className={`text-sm mb-1 ${t.muted}`}>Tiles Explored</div>
                <div className={`text-3xl font-bold ${t.text}`}>
                  {statsQuery.isLoading ? '…' : tilesDiscovered.toLocaleString()}
                </div>
              </div>
              <div>
                <div className={`text-sm mb-1 ${t.muted}`}>Tiles Remaining</div>
                <div className={`text-3xl font-bold ${t.dimmed}`}>
                  {statsQuery.isLoading ? '…' : tilesRemaining.toLocaleString()}
                </div>
              </div>
              <div>
                <div className={`text-sm mb-1 ${t.muted}`}>Join Date</div>
                <div className={`text-lg font-medium ${t.text}`}>
                  {fullStatsQuery.isLoading ? '…' : joinDate}
                </div>
              </div>
              <div>
                <div className={`text-sm mb-1 ${t.muted}`}>Current Level</div>
                <div className={`text-3xl font-bold mb-2 ${t.text}`}>
                  {xpQuery.isLoading ? '…' : `LVL ${level}`}
                </div>
                <div className={`w-full rounded-full h-2 mb-2 overflow-hidden ${t.barBg}`}>
                  <div
                    className="h-full bg-[#00d9ff] rounded-full transition-all duration-500"
                    style={{ width: xpQuery.isLoading ? '0%' : `${(xpCurrent / xpNext) * 100}%` }}
                  />
                </div>
                <div className={`text-xs ${t.muted}`}>
                  {xpQuery.isLoading ? '…' : `${xpCurrent} / ${xpNext} XP`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WEEKLY PROGRESS */}
        <div className="mb-5">
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ml-1 ${t.sectionLabel}`}>Weekly Progress</h2>
          <div className={`border rounded-2xl p-6 ${t.card}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00d9ff]" />
                <h3 className={`text-lg font-semibold ${t.text}`}>This Week</h3>
              </div>
              {weeklyProgress.length > 0 && (
                <span className={`text-sm ${t.muted}`}>
                  {weeklyProgress[0]?.date} – {weeklyProgress[6]?.date}
                </span>
              )}
            </div>
            <div className="space-y-3 mb-5">
              {fullStatsQuery.isLoading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className={`w-full rounded-full h-2 ${t.barBg}`} />
                    </div>
                  ))
                : weeklyProgress.map((day) => (
                    <div key={day.date}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium w-8 ${t.text}`}>{day.day}</span>
                          <span className={`text-xs ${t.muted}`}>{day.date}</span>
                        </div>
                        <span className="text-sm font-semibold text-[#00d9ff]">{day.km} km</span>
                      </div>
                      <div className={`w-full rounded-full h-2 overflow-hidden ${t.barBg}`}>
                        <div
                          className="h-full bg-[#00d9ff] rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${(day.km / maxWeeklyKm) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
            </div>
            <div className={`text-center pt-5 border-t ${t.divider}`}>
              <p className={`text-2xl mb-1 ${t.text}`}>
                You walked{' '}
                <span className="font-bold text-[#00d9ff]">
                  {fullStatsQuery.isLoading ? '…' : `${totalWeeklyKm.toFixed(1)} km`}
                </span>{' '}
                this week!
              </p>
              {weeklyProgress.length > 0 && (
                <p className={`text-base ${t.muted}`}>
                  Average: {(totalWeeklyKm / weeklyProgress.length).toFixed(1)} km/day
                </p>
              )}
            </div>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="mb-5">
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ml-1 ${t.sectionLabel}`}>Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <TrendingUp className="w-4 h-4 text-[#00d9ff]" />,
                label: 'Total Distance',
                value: fullStatsQuery.isLoading ? '…' : `${full?.totalDistanceKm ?? 0} km`,
              },
              {
                icon: <MapPin className="w-4 h-4 text-[#00d9ff]" />,
                label: 'Pins Placed',
                value: fullStatsQuery.isLoading ? '…' : String(full?.pinsPlaced ?? 0),
              },
              {
                icon: <Users className="w-4 h-4 text-[#00d9ff]" />,
                label: 'Total Upvotes',
                value: fullStatsQuery.isLoading ? '…' : String(full?.totalUpvotes ?? 0),
              },
              {
                icon: <Calendar className="w-4 h-4 text-[#00d9ff]" />,
                label: 'Days Active',
                value: fullStatsQuery.isLoading ? '…' : String(full?.daysActive ?? 0),
              },
              {
                icon: <Target className="w-4 h-4 text-[#00d9ff]" />,
                label: 'Streak',
                value: statsQuery.isLoading ? '…' : `${exploration?.streakDays ?? 0} days`,
              },
            ].map((item) => (
              <div key={item.label} className={`border rounded-2xl p-5 ${t.card}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.iconBg}`}>
                    {item.icon}
                  </div>
                  <span className={`text-sm ${t.muted}`}>{item.label}</span>
                </div>
                <div className={`text-3xl font-bold ${t.text}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP PINS AND ACHIEVEMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ml-1 ${t.sectionLabel}`}>Top Pins</h2>
            <div className={`border rounded-2xl p-5 ${t.card}`}>
              {fullStatsQuery.isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`h-10 rounded-lg animate-pulse ${t.barBg}`} />
                  ))}
                </div>
              ) : full?.topPins.length === 0 ? (
                <p className={`text-sm ${t.muted}`}>No pins yet — go place some!</p>
              ) : (
                <div className="space-y-3">
                  {full?.topPins.map((pin, index) => (
                    <div key={pin.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#00d9ff] to-[#00a3cc] rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${t.text}`}>{pin.title}</div>
                        <div className={`text-xs truncate ${t.muted}`}>{pin.location}</div>
                      </div>
                      <div className="flex items-center gap-1 text-[#00d9ff] text-sm font-semibold shrink-0">
                        <ArrowUp className="w-3.5 h-3.5" />
                        {pin.upvotes}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ml-1 ${t.sectionLabel}`}>Achievements</h2>
            <div className={`border rounded-2xl p-5 ${t.card}`}>
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-3 ${achievement.isUnlocked ? '' : 'opacity-40'}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        achievement.isUnlocked
                          ? 'bg-gradient-to-br from-[#00d9ff] to-[#00a3cc]'
                          : t.lockedBadge
                      }`}
                    >
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${t.text}`}>{achievement.title}</div>
                      <div className={`text-xs ${t.muted}`}>{achievement.description}</div>
                    </div>
                    {achievement.isUnlocked && (
                      <div className="text-[#00d9ff] shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
    </div>
  );
}
