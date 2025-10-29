import { useGame } from '@/contexts/GameContext';
import { TrendingUp } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { formatGold } from '@/lib/utils';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
  isWithinInterval,
  parseISO
} from 'date-fns';

type ViewMode = 'weekly' | 'monthly' | 'yearly';

export default function ProgressScreen() {
  const { state, getRankForLevel } = useGame();
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const themeColor = state.sandboxSettings.themeColor || '#FFFFFF';
  const progressBarColor = state.sandboxSettings.progressBarColor || '#FFFFFF';

  // Aggregate data by timeframe
  const aggregatedData = useMemo(() => {
    const now = new Date();
    let intervals: Date[] = [];
    let startDate: Date;
    let endDate: Date = now;

    switch (viewMode) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7 * 8); // Last 8 weeks
        intervals = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 12); // Last 12 months
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        break;
      case 'yearly':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 5); // Last 5 years
        intervals = eachYearOfInterval({ start: startDate, end: endDate });
        break;
    }

    return intervals.map(intervalStart => {
      let intervalEnd: Date;
      let label: string;

      switch (viewMode) {
        case 'weekly':
          intervalEnd = endOfWeek(intervalStart, { weekStartsOn: 1 });
          label = format(intervalStart, 'MMM d');
          break;
        case 'monthly':
          intervalEnd = endOfMonth(intervalStart);
          label = format(intervalStart, 'MMM');
          break;
        case 'yearly':
          intervalEnd = endOfYear(intervalStart);
          label = format(intervalStart, 'yyyy');
          break;
        default:
          intervalEnd = intervalStart;
          label = '';
      }

      // Get all progress entries in this interval
      const entriesInInterval = state.progressHistory.filter(entry => {
        const entryDate = parseISO(entry.date);
        return isWithinInterval(entryDate, { start: intervalStart, end: intervalEnd });
      });

      // Get the last entry (latest progress) in this interval
      const lastEntry = entriesInInterval.length > 0 
        ? entriesInInterval.reduce((latest, current) => 
            new Date(current.date) > new Date(latest.date) ? current : latest
          )
        : null;

      return {
        label,
        level: lastEntry?.level || 0,
        gold: lastEntry?.gold || 0,
        xp: lastEntry?.xp || 0,
        questsCompleted: lastEntry?.questsCompleted || 0,
      };
    }).filter(data => data.level > 0); // Only show periods with data
  }, [state.progressHistory, viewMode]);

  // Filter history for the selected timeframe
  const filteredHistory = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();

    switch (viewMode) {
      case 'weekly':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return state.progressHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= cutoff;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.progressHistory, viewMode]);

  const stats = useMemo(() => {
    if (filteredHistory.length === 0) return null;

    const first = filteredHistory[filteredHistory.length - 1];
    const last = filteredHistory[0];

    return {
      levelGain: last.level - first.level,
      goldGained: last.gold - first.gold,
      xpGained: state.player.totalXpEarned - (state.player.totalXpEarned - (last.xp - first.xp)),
      questsCompleted: last.questsCompleted - first.questsCompleted,
    };
  }, [filteredHistory, state.player.totalXpEarned]);

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-5">
          <h1 className="text-[32px] font-bold text-white text-center">Growth</h1>
        </div>

        <div className="flex bg-[#1A1A1A] rounded-xl p-1 mb-5">
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'weekly' ? 'text-black' : 'text-[#999]'
            }`}
            style={{ backgroundColor: viewMode === 'weekly' ? themeColor : 'transparent' }}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'monthly' ? 'text-black' : 'text-[#999]'
            }`}
            style={{ backgroundColor: viewMode === 'monthly' ? themeColor : 'transparent' }}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'yearly' ? 'text-black' : 'text-[#999]'
            }`}
            style={{ backgroundColor: viewMode === 'yearly' ? themeColor : 'transparent' }}
          >
            Yearly
          </button>
        </div>

        {stats && (
          <div className="bg-[#1A1A1A] rounded-2xl p-5 mb-5">
            <h2 className="text-xl font-bold text-white mb-4">
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Summary
            </h2>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[45%] bg-[#0F0F0F] p-4 rounded-xl text-center">
                <p className="text-[28px] font-bold text-white mb-1">+{stats.levelGain}</p>
                <p className="text-xs text-[#999] font-semibold">Levels</p>
              </div>
              <div className="flex-1 min-w-[45%] bg-[#0F0F0F] p-4 rounded-xl text-center">
                <p className="text-[28px] font-bold mb-1" style={{ color: themeColor }}>+{formatGold(stats.goldGained)}</p>
                <p className="text-xs text-[#999] font-semibold">Gold</p>
              </div>
              <div className="flex-1 min-w-[45%] bg-[#0F0F0F] p-4 rounded-xl text-center">
                <p className="text-[28px] font-bold text-[#2196F3] mb-1">+{stats.xpGained}</p>
                <p className="text-xs text-[#999] font-semibold">XP</p>
              </div>
              <div className="flex-1 min-w-[45%] bg-[#0F0F0F] p-4 rounded-xl text-center">
                <p className="text-[28px] font-bold text-[#4CAF50] mb-1">{stats.questsCompleted}</p>
                <p className="text-xs text-[#999] font-semibold">Quests</p>
              </div>
            </div>
          </div>
        )}

        {aggregatedData.length > 0 && (
          <div className="bg-[#1A1A1A] rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} style={{ color: themeColor }} />
              <h2 className="text-xl font-bold text-white">Level Progress</h2>
            </div>
            <div className="flex items-end justify-between h-[150px] mb-3 gap-1">
              {aggregatedData.map((entry, index) => {
                const maxLevel = Math.max(...aggregatedData.map(e => e.level), 1);
                const height = (entry.level / maxLevel) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t min-h-[4px]"
                        style={{ 
                          height: `${height}%`,
                          backgroundColor: progressBarColor
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-[#999] mt-1">{entry.label}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#999] text-center">
              {viewMode === 'weekly' ? 'Weeks' : viewMode === 'monthly' ? 'Months' : 'Years'} over time
            </p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">History</h2>
          {filteredHistory.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center">
              <p className="text-lg text-white font-semibold mb-2">No progress history</p>
              <p className="text-sm text-[#999]">Complete quests to track your growth!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((entry, index) => {
                const rank = getRankForLevel(entry.level);
                return (
                  <div key={index} className="bg-[#1A1A1A] rounded-2xl p-4 flex gap-4">
                    <div className="min-w-[80px]">
                      <p className="text-xs text-white font-semibold">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-[#999] mt-0.5">
                        {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold mb-2" style={{ color: rank.color }}>
                        {rank.name}
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <span className="text-xs text-[#999]">Level {entry.level}</span>
                        <span className="text-xs text-[#999]">{formatGold(entry.gold)} 🟡</span>
                        <span className="text-xs text-[#999]">{entry.questsCompleted} quests</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
