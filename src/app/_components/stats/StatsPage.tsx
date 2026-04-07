"use client";

import { MapPin, TrendingUp, Target, Calendar, Users, ArrowUp } from 'lucide-react';
import { api } from '~/trpc/react';
import { xpToLevel, xpProgress } from '~/lib/xp';
import { QUEST_DEFINITIONS } from '../quests/questData';

export default function StatsPage({ darkMode = true, units = 'metric' }: { darkMode?: boolean; units?: 'metric' | 'imperial' }) {
  const statsQuery = api.map.getExplorationStats.useQuery({ cityId: 'emory' });
  const fullStatsQuery = api.map.getStats.useQuery();
  const xpQuery = api.quest.getXp.useQuery();
  const completedQuery = api.quest.getCompletedQuests.useQuery();

  const exploration = statsQuery.data;
  const full = fullStatsQuery.data;
  const xp = xpQuery.data?.xp ?? 0;
  const level = xpToLevel(xp);
  const { current: xpCurrent, next: xpNext } = xpProgress(xp);

  const KM_TO_MI = 0.621371;
  const toUnit = (km: number) => units === 'imperial' ? Math.round(km * KM_TO_MI * 10) / 10 : Math.round(km * 10) / 10;
  const unitLabel = units === 'imperial' ? 'mi' : 'km';

  const now = new Date();
  const todayDate = `${now.getMonth() + 1}/${now.getDate()}`;

  const weeklyProgress = full?.weeklyProgress ?? [];
  const maxWeeklyKm = weeklyProgress.length > 0 ? Math.max(...weeklyProgress.map(d => d.km), 0.1) : 1;
  const totalWeeklyKm = weeklyProgress.reduce((sum, d) => sum + d.km, 0);

  const joinDate = full?.joinDate
    ? new Date(full.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  const tilesDiscovered = exploration?.tilesDiscovered ?? 0;
  const totalTiles = exploration?.totalTiles ?? 0;
  const tilesRemaining = totalTiles - tilesDiscovered;

  const collectedIds = new Set(completedQuery.data?.map(c => c.questId) ?? []);
  const completedQuests = QUEST_DEFINITIONS.filter(q => collectedIds.has(q.id));

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
                : weeklyProgress.map((day) => {
                    const isToday = day.date === todayDate;
                    return (
                    <div key={day.date}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm w-8 ${isToday ? 'font-semibold text-[#00d9ff]' : `font-medium ${t.text}`}`}>{day.day}</span>
                          {isToday
                            ? <span className="rounded-full bg-[#00d9ff]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#00d9ff]">Today</span>
                            : <span className={`text-xs ${t.muted}`}>{day.date}</span>
                          }
                        </div>
                        <span className={`text-sm font-semibold ${isToday ? 'text-[#00d9ff]' : t.muted}`}>{toUnit(day.km)} {unitLabel}</span>
                      </div>
                      <div className={`w-full rounded-full h-2 overflow-hidden ${t.barBg}`}>
                        <div
                          className="h-full bg-[#00d9ff] rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${(day.km / maxWeeklyKm) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                  })}
            </div>
            <div className={`text-center pt-5 border-t ${t.divider}`}>
              <p className={`text-2xl mb-1 ${t.text}`}>
                You walked{' '}
                <span className="font-bold text-[#00d9ff]">
                  {fullStatsQuery.isLoading ? '…' : `${toUnit(totalWeeklyKm)} ${unitLabel}`}
                </span>{' '}
                this week!
              </p>
              {weeklyProgress.length > 0 && (
                <p className={`text-base ${t.muted}`}>
                  Average: {toUnit(totalWeeklyKm / weeklyProgress.length)} {unitLabel}/day
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
                value: fullStatsQuery.isLoading ? '…' : `${toUnit(full?.totalDistanceKm ?? 0)} ${unitLabel}`,
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
                  {full?.topPins.map((pin, index) => {
                    const medal = [
                      { gradient: 'from-[#FFD700] to-[#e6a817]', glow: '0 0 14px rgba(255,215,0,0.55)' },
                      { gradient: 'from-[#D4D4D4] to-[#a8a8a8]', glow: undefined },
                      { gradient: 'from-[#CD7F32] to-[#a0522d]', glow: undefined },
                    ][index]!;
                    return (
                    <div key={pin.id} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 bg-gradient-to-br ${medal.gradient} rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0`}
                        style={medal.glow ? { boxShadow: medal.glow } : undefined}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${t.text}`}>{pin.title}</div>
                        <div className={`text-xs truncate ${t.muted}`}>{pin.caption}</div>
                      </div>
                      <div className="flex items-center gap-1 text-[#00d9ff] text-sm font-semibold shrink-0">
                        <ArrowUp className="w-3.5 h-3.5" />
                        {pin.upvotes}
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ml-1 ${t.sectionLabel}`}>Completed Quests</h2>
            <div className={`border rounded-2xl p-5 ${t.card}`}>
              {completedQuery.isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`h-10 rounded-lg animate-pulse ${t.barBg}`} />
                  ))}
                </div>
              ) : completedQuests.length === 0 ? (
                <p className={`text-sm ${t.muted}`}>No quests completed yet — go explore!</p>
              ) : (
                <div className="space-y-3">
                  {completedQuests.map(quest => (
                    <div key={quest.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#00a3cc] flex items-center justify-center text-lg shrink-0">
                        {quest.icon ?? '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${t.text}`}>{quest.title}</div>
                        <div className={`text-xs ${t.muted}`}>{quest.description}</div>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${t.muted}`}>{quest.reward.xp} XP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
