import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';

export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Extreme' | 'Impossible';

export interface Quest {
  id: string;
  title: string;
  details: string;
  emoji: string;
  image?: string;
  difficulty: Difficulty;
  xpReward: number;
  goldReward: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface ClassData {
  id: string;
  name: string;
  emoji: string;
  image: string;
  description: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  linkedQuestIds?: string[];
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  emoji: string;
  image?: string;
  goldCost: number;
  purchased: boolean;
  purchasedAt?: string;
  createdAt: string;
}

export interface ProTip {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'video' | 'article';
  url?: string;
  emoji?: string;
  createdAt: string;
}

export interface ProgressEntry {
  date: string;
  level: number;
  rank: string;
  xp: number;
  gold: number;
  questsCompleted: number;
}

export interface RankConfig {
  level: number;
  name: string;
  color: string;
  image?: string;
}

export interface SandboxSettings {
  expPerLevel: number;
  goldPerQuest: number;
  expPerQuest: number;
  customLevelSystem: boolean;
  customRankLevels: { [rank: string]: number };
  customRanks: RankConfig[];
  themeColor: string;
  progressBarColor: string;
  showRankPhotos: boolean;
  difficultyMultipliers: {
    Easy: { xp: number; gold: number };
    Normal: { xp: number; gold: number };
    Hard: { xp: number; gold: number };
    Extreme: { xp: number; gold: number };
    Impossible: { xp: number; gold: number };
  };
}

export interface PlayerStats {
  name: string;
  avatar?: string;
  banner?: string;
  level: number;
  xp: number;
  gold: number;
  totalXpEarned: number;
  questsCompleted: number;
  createdAt: string;
  dailyStreak: number;
  lastLoginDate?: string;
}

interface GameState {
  player: PlayerStats;
  quests: Quest[];
  classes: ClassData[];
  subclasses: ClassData[];
  rewards: Reward[];
  proTips: ProTip[];
  progressHistory: ProgressEntry[];
  sandboxSettings: SandboxSettings;
  deletedData?: {
    data: string;
    deletedAt: string;
  };
  showQuestImages: boolean;
}

const RANKS: RankConfig[] = [
  { level: 1, name: 'BRONZE 1 🟤', color: '#8B4513' },
  { level: 2, name: 'BRONZE 2 🟤🟤', color: '#8B4513' },
  { level: 3, name: 'BRONZE 3 🟤🟤🟤', color: '#8B4513' },
  { level: 4, name: 'SILVER 1 🪙', color: '#C0C0C0' },
  { level: 5, name: 'SILVER 2 🪙🪙', color: '#C0C0C0' },
  { level: 6, name: 'SILVER 3 🪙🪙🪙', color: '#C0C0C0' },
  { level: 7, name: 'GOLD 1 🟡', color: '#FFD700' },
  { level: 8, name: 'GOLD 2 🟡🟡', color: '#FFD700' },
  { level: 9, name: 'GOLD 3 🟡🟡🟡', color: '#FFD700' },
  { level: 10, name: 'GOLD 4 🟡🟡🟡🟡', color: '#FFD700' },
  { level: 11, name: 'PLATINUM 1 💠', color: '#4A90E2' },
  { level: 12, name: 'PLATINUM 2 💠💠', color: '#4A90E2' },
  { level: 13, name: 'PLATINUM 3 💠💠💠', color: '#4A90E2' },
  { level: 14, name: 'PLATINUM 4 💠💠💠💠', color: '#4A90E2' },
  { level: 15, name: 'DIAMOND 1 💎', color: '#B57EDC' },
  { level: 16, name: 'DIAMOND 2 💎💎', color: '#B57EDC' },
  { level: 17, name: 'DIAMOND 3 💎💎💎', color: '#B57EDC' },
  { level: 18, name: 'DIAMOND 4 💎💎💎💎', color: '#B57EDC' },
  { level: 19, name: 'HEROIC 1 🔻', color: '#E74C3C' },
  { level: 20, name: 'HEROIC 2 🔻🔻', color: '#E74C3C' },
  { level: 21, name: 'HEROIC 3 🔻🔻🔻', color: '#E74C3C' },
  { level: 22, name: 'HEROIC 4 🔻🔻🔻🔻', color: '#E74C3C' },
  { level: 23, name: 'HEROIC 5 🔻🔻🔻🔻🔻', color: '#E74C3C' },
  { level: 24, name: 'MASTER 1 🎖️', color: '#FF8C00' },
  { level: 25, name: 'MASTER 2 🎖️🎖️', color: '#FF8C00' },
  { level: 26, name: 'MASTER 3 🎖️🎖️🎖️', color: '#FF8C00' },
  { level: 27, name: 'MASTER 4 🎖️🎖️🎖️🎖️', color: '#FF8C00' },
  { level: 28, name: 'MASTER 5 🎖️🎖️🎖️🎖️🎖️', color: '#FF8C00' },
  { level: 29, name: 'GRANDMASTER ⭐', color: '#FFD700' },
];

const DEFAULT_SANDBOX_SETTINGS: SandboxSettings = {
  expPerLevel: 1000,
  goldPerQuest: 250,
  expPerQuest: 250,
  customLevelSystem: false,
  customRankLevels: {},
  customRanks: RANKS,
  themeColor: '#FFFFFF',
  progressBarColor: '#FFFFFF',
  showRankPhotos: false,
  difficultyMultipliers: {
    Easy: { xp: 1, gold: 1 },
    Normal: { xp: 2, gold: 2 },
    Hard: { xp: 4, gold: 4 },
    Extreme: { xp: 10, gold: 10 },
    Impossible: { xp: 20, gold: 20 },
  },
};

const INITIAL_STATE: GameState = {
  player: {
    name: 'Your Name Here',
    level: 1,
    xp: 0,
    gold: 0,
    totalXpEarned: 0,
    questsCompleted: 0,
    createdAt: new Date().toISOString(),
    dailyStreak: 0,
    lastLoginDate: undefined,
  },
  quests: [],
  classes: [],
  subclasses: [],
  rewards: [],
  proTips: [],
  progressHistory: [],
  sandboxSettings: {
    ...DEFAULT_SANDBOX_SETTINGS,
  },
  showQuestImages: true,
};

const STORAGE_KEY = 'levelife_game_state';

interface GameContextType {
  state: GameState;
  getRankForLevel: (level: number) => RankConfig;
  getXpToNextLevel: () => number;
  calculateMaxLevel: () => number;
  updatePlayer: (updates: Partial<PlayerStats>) => void;
  addQuest: (quest: Omit<Quest, 'id' | 'completed' | 'createdAt'>) => void;
  completeQuest: (questId: string) => void;
  uncompleteQuest: (questId: string) => void;
  uncompleteAllQuests: () => void;
  deleteQuest: (questId: string) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  addReward: (reward: Omit<Reward, 'id' | 'purchased' | 'createdAt'>) => void;
  purchaseReward: (rewardId: string) => void;
  unpurchaseReward: (rewardId: string) => void;
  updateReward: (rewardId: string, updates: Partial<Reward>) => void;
  deleteReward: (rewardId: string) => void;
  addClass: (classData: Omit<ClassData, 'id' | 'level' | 'xp' | 'xpToNextLevel'>) => void;
  addSubclass: (classData: Omit<ClassData, 'id' | 'level' | 'xp' | 'xpToNextLevel'>) => void;
  addProTip: (tip: Omit<ProTip, 'id' | 'createdAt'>) => void;
  updateProTip: (tipId: string, updates: Partial<Omit<ProTip, 'id' | 'createdAt'>>) => void;
  deleteProTip: (tipId: string) => void;
  updateSandboxSettings: (updates: Partial<SandboxSettings>) => void;
  updateRank: (rankIndex: number, updates: Partial<RankConfig>) => void;
  resetAllStats: () => void;
  recoverDeletedData: () => void;
  toggleQuestImages: () => void;
  linkQuestToClass: (classId: string, questId: string) => void;
  unlinkQuestFromClass: (classId: string, questId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadState = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState({
          ...INITIAL_STATE,
          ...parsed,
          sandboxSettings: (() => {
            const merged = {
              ...DEFAULT_SANDBOX_SETTINGS,
              ...parsed.sandboxSettings,
              customRanks: parsed.sandboxSettings?.customRanks || DEFAULT_SANDBOX_SETTINGS.customRanks,
              showRankPhotos: parsed.sandboxSettings?.showRankPhotos ?? DEFAULT_SANDBOX_SETTINGS.showRankPhotos,
              difficultyMultipliers: {
                ...DEFAULT_SANDBOX_SETTINGS.difficultyMultipliers,
                ...parsed.sandboxSettings?.difficultyMultipliers,
              },
            } as SandboxSettings;
            // Migrate old default yellow to new white default
            if (merged.themeColor === '#FFD700') merged.themeColor = '#FFFFFF';
            if (merged.progressBarColor === '#FFD700') merged.progressBarColor = '#FFFFFF';
            return merged;
          })(),
        });
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Check and update daily streak
  useEffect(() => {
    if (!isLoaded) return;

    const today = new Date().toDateString();
    const lastLogin = state.player.lastLoginDate;

    if (!lastLogin || lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();

      let newStreak = state.player.dailyStreak;

      if (lastLogin === yesterdayString) {
        // Logged in yesterday, increment streak
        newStreak += 1;
      } else if (!lastLogin) {
        // First time login
        newStreak = 1;
      } else {
        // Missed a day, reset streak
        newStreak = 1;
      }

      setState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          dailyStreak: newStreak,
          lastLoginDate: today,
        },
      }));
    }
  }, [isLoaded, state.player.lastLoginDate, state.player.dailyStreak]);

  const saveState = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [state]);

  useEffect(() => {
    if (isLoaded) {
      saveState();
    }
  }, [state, isLoaded, saveState]);

  const getRankForLevel = useCallback((level: number): RankConfig => {
    const ranks = state.sandboxSettings.customRanks || RANKS;
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (level >= ranks[i].level) {
        return ranks[i];
      }
    }
    return ranks[0];
  }, [state.sandboxSettings.customRanks]);

  const getXpToNextLevel = useCallback(() => {
    return state.sandboxSettings.expPerLevel;
  }, [state.sandboxSettings.expPerLevel]);

  const calculateMaxLevel = useCallback(() => {
    const totalAvailableXp = state.quests.reduce((sum, quest) => sum + quest.xpReward, 0);
    return Math.floor(totalAvailableXp / state.sandboxSettings.expPerLevel);
  }, [state.quests, state.sandboxSettings.expPerLevel]);

  const updatePlayer = useCallback((updates: Partial<PlayerStats>) => {
    setState(prev => ({
      ...prev,
      player: { ...prev.player, ...updates },
    }));
  }, []);

  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'completed' | 'createdAt'>) => {
    const newQuest: Quest = {
      ...quest,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      quests: [...prev.quests, newQuest],
    }));
  }, []);

  const completeQuest = useCallback((questId: string) => {
    setState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || quest.completed) return prev;

      const newXp = prev.player.xp + quest.xpReward;
      const newGold = prev.player.gold + quest.goldReward;
      const xpToNextLevel = prev.sandboxSettings.expPerLevel;
      
      let newLevel = prev.player.level;
      let remainingXp = newXp;

      while (remainingXp >= xpToNextLevel) {
        remainingXp -= xpToNextLevel;
        newLevel += 1;
      }

      const ranks = prev.sandboxSettings.customRanks || RANKS;
      const rank = ranks.find((r, i) => {
        if (i === ranks.length - 1) return newLevel >= r.level;
        return newLevel >= r.level && newLevel < ranks[i + 1].level;
      }) || ranks[0];

      // Update classes and subclasses linked to this quest
      const updatedClasses = prev.classes.map(c => {
        if (c.linkedQuestIds?.includes(questId)) {
          const newClassXp = c.xp + quest.xpReward;
          let newClassLevel = c.level;
          let remainingClassXp = newClassXp;

          while (remainingClassXp >= c.xpToNextLevel) {
            remainingClassXp -= c.xpToNextLevel;
            newClassLevel += 1;
          }

          return {
            ...c,
            xp: remainingClassXp,
            level: newClassLevel,
          };
        }
        return c;
      });

      const updatedSubclasses = prev.subclasses.map(c => {
        if (c.linkedQuestIds?.includes(questId)) {
          const newClassXp = c.xp + quest.xpReward;
          let newClassLevel = c.level;
          let remainingClassXp = newClassXp;

          while (remainingClassXp >= c.xpToNextLevel) {
            remainingClassXp -= c.xpToNextLevel;
            newClassLevel += 1;
          }

          return {
            ...c,
            xp: remainingClassXp,
            level: newClassLevel,
          };
        }
        return c;
      });

      return {
        ...prev,
        player: {
          ...prev.player,
          xp: remainingXp,
          gold: newGold,
          level: newLevel,
          totalXpEarned: prev.player.totalXpEarned + quest.xpReward,
          questsCompleted: prev.player.questsCompleted + 1,
        },
        classes: updatedClasses,
        subclasses: updatedSubclasses,
        quests: prev.quests.map(q =>
          q.id === questId
            ? { ...q, completed: true, completedAt: new Date().toISOString() }
            : q
        ),
        progressHistory: [
          ...prev.progressHistory,
          {
            date: new Date().toISOString(),
            level: newLevel,
            rank: rank.name,
            xp: remainingXp,
            gold: newGold,
            questsCompleted: prev.player.questsCompleted + 1,
          },
        ],
      };
    });
  }, []);

  const uncompleteQuest = useCallback((questId: string) => {
    setState(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest || !quest.completed) return prev;

      // Calculate reverse XP and gold
      const newXp = prev.player.xp - quest.xpReward;
      const newGold = Math.max(0, prev.player.gold - quest.goldReward);
      const xpToNextLevel = prev.sandboxSettings.expPerLevel;
      
      let newLevel = prev.player.level;
      let remainingXp = newXp;

      // Handle level down if XP goes negative
      while (remainingXp < 0 && newLevel > 1) {
        remainingXp += xpToNextLevel;
        newLevel -= 1;
      }

      // Ensure XP doesn't go below 0
      remainingXp = Math.max(0, remainingXp);

      // Update classes and subclasses linked to this quest (reverse XP)
      const updatedClasses = prev.classes.map(c => {
        if (c.linkedQuestIds?.includes(questId)) {
          const newClassXp = c.xp - quest.xpReward;
          let newClassLevel = c.level;
          let remainingClassXp = newClassXp;

          while (remainingClassXp < 0 && newClassLevel > 0) {
            remainingClassXp += c.xpToNextLevel;
            newClassLevel -= 1;
          }

          return {
            ...c,
            xp: Math.max(0, remainingClassXp),
            level: Math.max(0, newClassLevel),
          };
        }
        return c;
      });

      const updatedSubclasses = prev.subclasses.map(c => {
        if (c.linkedQuestIds?.includes(questId)) {
          const newClassXp = c.xp - quest.xpReward;
          let newClassLevel = c.level;
          let remainingClassXp = newClassXp;

          while (remainingClassXp < 0 && newClassLevel > 0) {
            remainingClassXp += c.xpToNextLevel;
            newClassLevel -= 1;
          }

          return {
            ...c,
            xp: Math.max(0, remainingClassXp),
            level: Math.max(0, newClassLevel),
          };
        }
        return c;
      });

      return {
        ...prev,
        player: {
          ...prev.player,
          xp: remainingXp,
          gold: newGold,
          level: newLevel,
          totalXpEarned: Math.max(0, prev.player.totalXpEarned - quest.xpReward),
          questsCompleted: Math.max(0, prev.player.questsCompleted - 1),
        },
        classes: updatedClasses,
        subclasses: updatedSubclasses,
        quests: prev.quests.map(q =>
          q.id === questId
            ? { ...q, completed: false, completedAt: undefined }
            : q
        ),
      };
    });
  }, []);

  const deleteQuest = useCallback((questId: string) => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.filter(q => q.id !== questId),
    }));
  }, []);

  const updateQuest = useCallback((questId: string, updates: Partial<Quest>) => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q => (q.id === questId ? { ...q, ...updates } : q)),
    }));
  }, []);

  const addReward = useCallback((reward: Omit<Reward, 'id' | 'purchased' | 'createdAt'>) => {
    const newReward: Reward = {
      ...reward,
      id: Date.now().toString(),
      purchased: false,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      rewards: [...prev.rewards, newReward],
    }));
  }, []);

  const purchaseReward = useCallback((rewardId: string) => {
    setState(prev => {
      const reward = prev.rewards.find(r => r.id === rewardId);
      if (!reward || reward.purchased || prev.player.gold < reward.goldCost) return prev;

      return {
        ...prev,
        player: {
          ...prev.player,
          gold: prev.player.gold - reward.goldCost,
        },
        rewards: prev.rewards.map(r =>
          r.id === rewardId
            ? { ...r, purchased: true, purchasedAt: new Date().toISOString() }
            : r
        ),
      };
    });
  }, []);

  const unpurchaseReward = useCallback((rewardId: string) => {
    setState(prev => {
      const reward = prev.rewards.find(r => r.id === rewardId);
      if (!reward || !reward.purchased) return prev;

      return {
        ...prev,
        player: {
          ...prev.player,
          gold: prev.player.gold + reward.goldCost,
        },
        rewards: prev.rewards.map(r =>
          r.id === rewardId
            ? { ...r, purchased: false, purchasedAt: undefined }
            : r
        ),
      };
    });
  }, []);

  const updateReward = useCallback((rewardId: string, updates: Partial<Reward>) => {
    setState(prev => ({
      ...prev,
      rewards: prev.rewards.map(r => (r.id === rewardId ? { ...r, ...updates } : r)),
    }));
  }, []);

  const deleteReward = useCallback((rewardId: string) => {
    setState(prev => ({
      ...prev,
      rewards: prev.rewards.filter(r => r.id !== rewardId),
    }));
  }, []);

  const addClass = useCallback((classData: Omit<ClassData, 'id' | 'level' | 'xp' | 'xpToNextLevel'>) => {
    const newClass: ClassData = {
      ...classData,
      id: Date.now().toString(),
      level: 0,
      xp: 0,
      xpToNextLevel: 1000,
    };
    setState(prev => ({
      ...prev,
      classes: [...prev.classes, newClass],
    }));
  }, []);

  const addSubclass = useCallback((subclassData: Omit<ClassData, 'id' | 'level' | 'xp' | 'xpToNextLevel'>) => {
    const newSubclass: ClassData = {
      ...subclassData,
      id: Date.now().toString(),
      level: 0,
      xp: 0,
      xpToNextLevel: 1000,
    };
    setState(prev => ({
      ...prev,
      subclasses: [...prev.subclasses, newSubclass],
    }));
  }, []);

  const addProTip = useCallback((tip: Omit<ProTip, 'id' | 'createdAt'>) => {
    const newTip: ProTip = {
      ...tip,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      proTips: [...prev.proTips, newTip],
    }));
  }, []);

  const updateProTip = useCallback((tipId: string, updates: Partial<Omit<ProTip, 'id' | 'createdAt'>>) => {
    setState(prev => ({
      ...prev,
      proTips: prev.proTips.map(t => (t.id === tipId ? { ...t, ...updates } : t)),
    }));
  }, []);

  const deleteProTip = useCallback((tipId: string) => {
    setState(prev => ({
      ...prev,
      proTips: prev.proTips.filter(t => t.id !== tipId),
    }));
  }, []);

  const updateSandboxSettings = useCallback((updates: Partial<SandboxSettings>) => {
    setState(prev => ({
      ...prev,
      sandboxSettings: { ...prev.sandboxSettings, ...updates },
    }));
  }, []);

  const resetAllStats = useCallback(() => {
    const dataToBackup = JSON.stringify(state);
    setState({
      ...INITIAL_STATE,
      deletedData: {
        data: dataToBackup,
        deletedAt: new Date().toISOString(),
      },
    });
  }, [state]);

  const recoverDeletedData = useCallback(() => {
    if (!state.deletedData) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const deletedDate = new Date(state.deletedData.deletedAt);

    if (deletedDate >= thirtyDaysAgo) {
      const recoveredState = JSON.parse(state.deletedData.data);
      setState(recoveredState);
    }
  }, [state.deletedData]);

  const toggleQuestImages = useCallback(() => {
    setState(prev => ({
      ...prev,
      showQuestImages: !prev.showQuestImages,
    }));
  }, []);

  const uncompleteAllQuests = useCallback(() => {
    setState(prev => {
      const completedQuests = prev.quests.filter(q => q.completed);
      
      let totalXpToRemove = 0;
      let totalGoldToRemove = 0;
      
      completedQuests.forEach(quest => {
        totalXpToRemove += quest.xpReward;
        totalGoldToRemove += quest.goldReward;
      });

      const xpToNextLevel = prev.sandboxSettings.expPerLevel;
      let newLevel = prev.player.level;
      let remainingXp = prev.player.xp - totalXpToRemove;

      while (remainingXp < 0 && newLevel > 1) {
        remainingXp += xpToNextLevel;
        newLevel -= 1;
      }

      remainingXp = Math.max(0, remainingXp);

      return {
        ...prev,
        player: {
          ...prev.player,
          xp: remainingXp,
          gold: Math.max(0, prev.player.gold - totalGoldToRemove),
          level: newLevel,
          totalXpEarned: Math.max(0, prev.player.totalXpEarned - totalXpToRemove),
          questsCompleted: Math.max(0, prev.player.questsCompleted - completedQuests.length),
        },
        quests: prev.quests.map(q => 
          q.completed ? { ...q, completed: false, completedAt: undefined } : q
        ),
      };
    });
  }, []);

  const updateRank = useCallback((rankIndex: number, updates: Partial<RankConfig>) => {
    setState(prev => ({
      ...prev,
      sandboxSettings: {
        ...prev.sandboxSettings,
        customRanks: prev.sandboxSettings.customRanks.map((rank, i) =>
          i === rankIndex ? { ...rank, ...updates } : rank
        ),
      },
    }));
  }, []);

  const linkQuestToClass = useCallback((classId: string, questId: string) => {
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c =>
        c.id === classId
          ? { ...c, linkedQuestIds: [...(c.linkedQuestIds || []), questId] }
          : c
      ),
      subclasses: prev.subclasses.map(c =>
        c.id === classId
          ? { ...c, linkedQuestIds: [...(c.linkedQuestIds || []), questId] }
          : c
      ),
    }));
  }, []);

  const unlinkQuestFromClass = useCallback((classId: string, questId: string) => {
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c =>
        c.id === classId
          ? { ...c, linkedQuestIds: (c.linkedQuestIds || []).filter(id => id !== questId) }
          : c
      ),
      subclasses: prev.subclasses.map(c =>
        c.id === classId
          ? { ...c, linkedQuestIds: (c.linkedQuestIds || []).filter(id => id !== questId) }
          : c
      ),
    }));
  }, []);

  const value = useMemo(() => ({
    state,
    getRankForLevel,
    getXpToNextLevel,
    calculateMaxLevel,
    updatePlayer,
    addQuest,
    completeQuest,
    uncompleteQuest,
    uncompleteAllQuests,
    deleteQuest,
    updateQuest,
    addReward,
    purchaseReward,
    unpurchaseReward,
    updateReward,
    deleteReward,
    addClass,
    addSubclass,
    addProTip,
    updateProTip,
    deleteProTip,
    updateSandboxSettings,
    updateRank,
    resetAllStats,
    recoverDeletedData,
    toggleQuestImages,
    linkQuestToClass,
    unlinkQuestFromClass,
  }), [
    state,
    getRankForLevel,
    getXpToNextLevel,
    calculateMaxLevel,
    updatePlayer,
    addQuest,
    completeQuest,
    uncompleteQuest,
    uncompleteAllQuests,
    deleteQuest,
    updateQuest,
    addReward,
    purchaseReward,
    unpurchaseReward,
    updateReward,
    deleteReward,
    addClass,
    addSubclass,
    addProTip,
    updateProTip,
    deleteProTip,
    updateSandboxSettings,
    updateRank,
    resetAllStats,
    recoverDeletedData,
    toggleQuestImages,
    linkQuestToClass,
    unlinkQuestFromClass,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
