import { useGame, type Difficulty } from '@/contexts/GameContext';
import { ChevronRight, AlertCircle, Image as ImageIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsScreen() {
  const { state, resetAllStats, recoverDeletedData, updateSandboxSettings } = useGame();
  const [sandboxMode, setSandboxMode] = useState(false);
  const [sandboxValues, setSandboxValues] = useState(state.sandboxSettings);
  const themeColor = state.sandboxSettings.themeColor || '#FFFFFF';

  const handleResetStats = () => {
    if (confirm('Reset All Stats\n\nThis will delete all your progress, quests, and rewards. You have 30 days to recover your data. Are you sure?')) {
      resetAllStats();
      alert('Reset Complete: All stats have been reset. You have 30 days to recover your data from Settings.');
    }
  };

  const handleRecoverData = () => {
    if (!state.deletedData) {
      alert('No deleted data available to recover');
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const deletedDate = new Date(state.deletedData.deletedAt);

    if (deletedDate < thirtyDaysAgo) {
      alert('Recovery data has expired (30 days limit)');
      return;
    }

    if (confirm(`Recover data from ${deletedDate.toLocaleDateString()}?`)) {
      recoverDeletedData();
      alert('Recovery Complete: Your data has been restored');
    }
  };

  const handleSaveSandboxSettings = () => {
    updateSandboxSettings(sandboxValues);
    setSandboxMode(false);
    alert('Sandbox settings have been updated');
  };

  const updateDifficultyMultiplier = (difficulty: Difficulty, type: 'xp' | 'gold', value: string) => {
    const numValue = parseFloat(value) || 0;
    setSandboxValues(prev => ({
      ...prev,
      difficultyMultipliers: {
        ...prev.difficultyMultipliers,
        [difficulty]: {
          ...prev.difficultyMultipliers[difficulty],
          [type]: numValue,
        },
      },
    }));
  };

  const handleRankNameChange = (index: number, newName: string) => {
    setSandboxValues(prev => ({
      ...prev,
      customRanks: prev.customRanks.map((rank, i) =>
        i === index ? { ...rank, name: newName } : rank
      ),
    }));
  };

  const handleRankImagePick = async (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setSandboxValues(prev => ({
            ...prev,
            customRanks: prev.customRanks.map((rank, i) =>
              i === index ? { ...rank, image: event.target?.result as string } : rank
            ),
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 overflow-auto p-4 pb-8">
        <div className="mb-5">
          <h1 className="text-[32px] font-bold text-white text-center">Settings</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Appearance</h2>
          <div className="bg-[#1A1A1A] rounded-2xl p-4">
            <div className="mb-4 pb-4 border-b border-[#2A2A2A]">
              <label className="block text-sm font-semibold text-white mb-3">Theme Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={state.sandboxSettings.themeColor}
                  onChange={(e) => updateSandboxSettings({ 
                    ...state.sandboxSettings, 
                    themeColor: e.target.value 
                  })}
                  className="w-16 h-16 rounded-lg cursor-pointer bg-transparent border-2 border-[#2A2A2A]"
                />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-1">App Theme</p>
                  <p className="text-xs text-[#999]">Changes buttons, highlights, and accents</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Progress Bar Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={state.sandboxSettings.progressBarColor}
                  onChange={(e) => updateSandboxSettings({ 
                    ...state.sandboxSettings, 
                    progressBarColor: e.target.value 
                  })}
                  className="w-16 h-16 rounded-lg cursor-pointer bg-transparent border-2 border-[#2A2A2A]"
                />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-1">Charts & Bars</p>
                  <p className="text-xs text-[#999]">Used in progress graphs and bars</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Game Configuration</h2>
          <button
            onClick={() => setSandboxMode(true)}
            className="w-full bg-[#1A1A1A] rounded-2xl p-4 flex items-center justify-between"
            style={{ borderColor: themeColor }}
          >
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-white mb-1">Sandbox Mode</p>
              <p className="text-[13px] text-[#999] leading-[18px]">
                Customize XP, Gold, Ranks, and difficulty multipliers
              </p>
            </div>
            <ChevronRight size={20} color="#666" />
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Current Settings</h2>
          <div className="bg-[#1A1A1A] rounded-2xl p-4">
            {[
              { label: 'XP Per Level', value: state.sandboxSettings.expPerLevel },
              { label: 'Base Gold Per Quest', value: state.sandboxSettings.goldPerQuest },
              { label: 'Base XP Per Quest', value: state.sandboxSettings.expPerQuest },
              { label: 'Total Ranks', value: state.sandboxSettings.customRanks.length },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className={`flex justify-between items-center py-3 ${
                  i < arr.length - 1 ? 'border-b border-[#2A2A2A]' : ''
                }`}
              >
                <span className="text-sm text-[#999]">{item.label}</span>
                <span className="text-sm text-white font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Data Management</h2>
          
          {state.deletedData && (
            <button
              onClick={handleRecoverData}
              className="w-full bg-[#1A1A1A] rounded-2xl p-4 flex items-center justify-between mb-3 border border-[#4CAF50]"
            >
              <div className="flex-1 text-left">
                <p className="text-base font-semibold text-white mb-1">Recover Deleted Data</p>
                <p className="text-[13px] text-[#999] leading-[18px]">
                  Deleted on {new Date(state.deletedData.deletedAt).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight size={20} color="#4CAF50" />
            </button>
          )}

          <button
            onClick={handleResetStats}
            className="w-full bg-[#1A1A1A] rounded-2xl p-4 flex items-center justify-between border border-[#F44336]"
          >
            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-[#F44336] mb-1">Reset All Stats</p>
              <p className="text-[13px] text-[#999] leading-[18px]">
                Delete all progress (30-day recovery available)
              </p>
            </div>
            <ChevronRight size={20} color="#F44336" />
          </button>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} color="#FF9800" className="flex-shrink-0 mt-0.5" />
          <p className="flex-1 text-[13px] text-[#999] leading-[18px]">
            Changes to Sandbox Mode settings affect future quests. Existing quests retain their original rewards.
          </p>
        </div>
      </div>

      <Dialog open={sandboxMode} onOpenChange={setSandboxMode}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Sandbox Mode</DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Base Values</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-white mb-2">XP Required Per Level</Label>
                  <Input
                    type="number"
                    value={sandboxValues.expPerLevel}
                    onChange={(e) => setSandboxValues(prev => ({
                      ...prev,
                      expPerLevel: parseInt(e.target.value, 10) || 0,
                    }))}
                    className="bg-[#0F0F0F] border-[#2A2A2A] text-white"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-white mb-2">Base Gold Per Quest</Label>
                  <Input
                    type="number"
                    value={sandboxValues.goldPerQuest}
                    onChange={(e) => setSandboxValues(prev => ({
                      ...prev,
                      goldPerQuest: parseInt(e.target.value, 10) || 0,
                    }))}
                    className="bg-[#0F0F0F] border-[#2A2A2A] text-white"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-white mb-2">Base XP Per Quest</Label>
                  <Input
                    type="number"
                    value={sandboxValues.expPerQuest}
                    onChange={(e) => setSandboxValues(prev => ({
                      ...prev,
                      expPerQuest: parseInt(e.target.value, 10) || 0,
                    }))}
                    className="bg-[#0F0F0F] border-[#2A2A2A] text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2">Difficulty Multipliers</h3>
              <p className="text-sm text-[#999] mb-4 leading-5">
                These values multiply the base XP and Gold rewards
              </p>

              <div className="space-y-3">
                {(['Easy', 'Normal', 'Hard', 'Extreme', 'Impossible'] as Difficulty[]).map(difficulty => (
                  <div key={difficulty} className="bg-[#0F0F0F] rounded-xl p-4">
                    <p className="text-base font-bold text-white mb-3">{difficulty}</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-[#999] mb-2">XP x</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={sandboxValues.difficultyMultipliers[difficulty].xp}
                          onChange={(e) => updateDifficultyMultiplier(difficulty, 'xp', e.target.value)}
                          className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-[#999] mb-2">Gold x</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={sandboxValues.difficultyMultipliers[difficulty].gold}
                          onChange={(e) => updateDifficultyMultiplier(difficulty, 'gold', e.target.value)}
                          className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2">Customize Ranks</h3>
              <p className="text-sm text-[#999] mb-4 leading-5">
                Edit rank names and add custom images for each rank
              </p>

              <div className="space-y-4">
                {sandboxValues.customRanks.map((rank, index) => (
                  <div key={index} className="bg-[#0F0F0F] rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-base font-bold text-white">Level {rank.level}</p>
                      <div
                        className="w-8 h-8 rounded-full border-2 border-[#2A2A2A]"
                        style={{ backgroundColor: rank.color }}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <Label className="text-sm font-semibold text-white mb-2">Rank Name</Label>
                      <Input
                        value={rank.name}
                        onChange={(e) => handleRankNameChange(index, e.target.value)}
                        className="bg-[#1A1A1A] border-[#2A2A2A] text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-white mb-2">Rank Image</Label>
                      <button
                        onClick={() => handleRankImagePick(index)}
                        className="w-full aspect-square rounded-xl overflow-hidden bg-[#1A1A1A] border-2 border-dashed border-[#2A2A2A]"
                      >
                        {rank.image ? (
                          <img src={rank.image} alt={rank.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <ImageIcon size={24} color="#666" />
                            <span className="text-sm text-[#666] font-semibold">Add Image</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveSandboxSettings}
              className="w-full text-black font-bold py-4 rounded-xl hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
