import { useGame, type Difficulty } from '@/contexts/GameContext';
import { Plus, Check, X, Image as ImageIcon, Eye, EyeOff, Trash2, Smile, Pencil } from 'lucide-react';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: '#34C759',
  Normal: '#007AFF',
  Hard: '#FF9500',
  Extreme: '#FF3B30',
  Impossible: '#AF52DE',
};

export default function QuestsScreen() {
  const { state, addQuest, updateQuest, completeQuest, uncompleteQuest, uncompleteAllQuests, deleteQuest, toggleQuestImages, linkQuestToClass, unlinkQuestFromClass } = useGame();
  const [modalVisible, setModalVisible] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const themeColor = state.sandboxSettings.themeColor || '#FFFFFF';
  const [questForm, setQuestForm] = useState({
    title: '',
    details: '',
    emoji: '📝',
    image: '',
    difficulty: 'Normal' as Difficulty,
  });
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const difficultyMultiplier = state.sandboxSettings.difficultyMultipliers[questForm.difficulty];
  const baseXp = state.sandboxSettings.expPerQuest;
  const baseGold = state.sandboxSettings.goldPerQuest;
  const calculatedXp = Math.round(baseXp * difficultyMultiplier.xp);
  const calculatedGold = Math.round(baseGold * difficultyMultiplier.gold);

  const pickImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setQuestForm(prev => ({ ...prev, image: event.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleEditQuest = (questId: string) => {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest) return;
    
    setQuestForm({
      title: quest.title,
      details: quest.details,
      emoji: quest.emoji,
      image: quest.image || '',
      difficulty: quest.difficulty,
    });
    
    // Get linked class IDs for this quest
    const linkedClassIds = [
      ...state.classes.filter(c => c.linkedQuestIds?.includes(questId)).map(c => c.id),
      ...state.subclasses.filter(c => c.linkedQuestIds?.includes(questId)).map(c => c.id),
    ];
    setSelectedClassIds(linkedClassIds);
    
    setEditingQuestId(questId);
    setModalVisible(true);
  };

  const handleCreateQuest = () => {
    if (!questForm.title.trim()) {
      alert('Please enter a quest title');
      return;
    }

    if (editingQuestId) {
      // Update existing quest
      updateQuest(editingQuestId, {
        title: questForm.title.trim(),
        details: questForm.details.trim(),
        emoji: questForm.emoji,
        image: questForm.image || undefined,
        difficulty: questForm.difficulty,
        xpReward: calculatedXp,
        goldReward: calculatedGold,
      });

      // Update class links
      const currentLinks = [
        ...state.classes.filter(c => c.linkedQuestIds?.includes(editingQuestId)).map(c => c.id),
        ...state.subclasses.filter(c => c.linkedQuestIds?.includes(editingQuestId)).map(c => c.id),
      ];
      
      // Remove old links
      currentLinks.forEach(classId => {
        if (!selectedClassIds.includes(classId)) {
          unlinkQuestFromClass(classId, editingQuestId);
        }
      });
      
      // Add new links
      selectedClassIds.forEach(classId => {
        if (!currentLinks.includes(classId)) {
          linkQuestToClass(classId, editingQuestId);
        }
      });
    } else {
      // Create new quest
      addQuest({
        title: questForm.title.trim(),
        details: questForm.details.trim(),
        emoji: questForm.emoji,
        image: questForm.image || undefined,
        difficulty: questForm.difficulty,
        xpReward: calculatedXp,
        goldReward: calculatedGold,
      });

      // Link quest to selected classes
      const newQuestId = Date.now().toString();
      selectedClassIds.forEach(classId => {
        linkQuestToClass(classId, newQuestId);
      });
    }

    setQuestForm({
      title: '',
      details: '',
      emoji: '📝',
      image: '',
      difficulty: 'Normal',
    });
    setSelectedClassIds([]);
    setEditingQuestId(null);
    setModalVisible(false);
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const getSubclassesForClass = (classId: string) => {
    return state.subclasses.filter(subclass => subclass.image === classId);
  };

  const handleDeleteQuest = (questId: string) => {
    if (confirm('Are you sure you want to delete this quest?')) {
      deleteQuest(questId);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setQuestForm(prev => ({ ...prev, emoji: emojiData.emoji }));
    setEmojiPickerOpen(false);
  };

  const activeQuests = state.quests.filter(q => !q.completed);
  const completedQuests = state.quests.filter(q => q.completed);

  return (
    <div className="relative flex flex-col h-full bg-black">
      <div className="flex-1 overflow-auto p-4 pb-24">
        <div className="mb-5">
          <h1 className="text-[32px] font-bold text-white text-center">Quests</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Active Quests ({activeQuests.length})</h2>
          {activeQuests.length === 0 ? (
            <div className="bg-[#1C1C1E] rounded-2xl p-10 text-center border border-[#2C2C2E]">
              <p className="text-lg text-white font-semibold mb-2">No active quests</p>
              <p className="text-sm text-[#8E8E93]">Tap + to create your first quest</p>
            </div>
          ) : (
            activeQuests.map(quest => (
              <div key={quest.id} className="bg-[#1C1C1E] rounded-2xl p-4 mb-3 border border-[#2C2C2E]">
                {state.showQuestImages && quest.image && (
                  <img src={quest.image} alt={quest.title} className="w-full h-[150px] object-cover rounded-xl mb-3" />
                )}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{quest.emoji}</span>
                  <h3 className="flex-1 text-lg font-semibold text-white">{quest.title}</h3>
                </div>
                {quest.details && (
                  <p className="text-sm text-[#8E8E93] mb-4 leading-relaxed">{quest.details}</p>
                )}
                <div className="flex justify-between items-center mb-4">
                  <div 
                    className="px-3 py-1.5 rounded-full"
                    style={{ 
                      backgroundColor: DIFFICULTY_COLORS[quest.difficulty] + '20',
                      color: DIFFICULTY_COLORS[quest.difficulty]
                    }}
                  >
                    <span className="text-xs font-semibold">{quest.difficulty}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-sm font-medium text-[#007AFF]">{quest.xpReward} XP</span>
                    <span className="text-sm font-medium text-[#FFD60A]">{quest.goldReward} 🟡</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => completeQuest(quest.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#34C759] hover:bg-[#30B350] active:bg-[#2BA548] py-3.5 rounded-xl transition-colors"
                  >
                    <Check size={18} color="#FFF" strokeWidth={2.5} />
                    <span className="text-white text-base font-semibold">Complete</span>
                  </button>
                  <button
                    onClick={() => handleEditQuest(quest.id)}
                    className="w-12 h-12 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] active:bg-[#48484A] flex items-center justify-center transition-colors border border-[#3A3A3C]"
                  >
                    <Pencil size={18} color="#007AFF" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleDeleteQuest(quest.id)}
                    className="w-12 h-12 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] active:bg-[#48484A] flex items-center justify-center transition-colors border border-[#3A3A3C]"
                  >
                    <Trash2 size={18} color="#FF3B30" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {completedQuests.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-white">Completed ({completedQuests.length})</h2>
              <button
                onClick={() => {
                  if (confirm(`Undo all ${completedQuests.length} completed quests?`)) {
                    uncompleteAllQuests();
                  }
                }}
                className="px-4 py-2 rounded-full bg-[#FF9500] hover:bg-[#E68600] active:bg-[#CC7700] flex items-center gap-2 transition-colors"
              >
                <X size={16} color="#FFF" strokeWidth={2.5} />
                <span className="text-white text-sm font-semibold">Undo All</span>
              </button>
            </div>
            {completedQuests.map(quest => (
              <div key={quest.id} className="bg-[#1C1C1E] rounded-2xl p-4 mb-3 border border-[#2C2C2E] opacity-60">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl opacity-50">{quest.emoji}</span>
                  <h3 className="flex-1 text-lg font-semibold text-[#8E8E93] line-through">{quest.title}</h3>
                  <Check size={20} color="#34C759" strokeWidth={2.5} />
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-[#34C759] font-medium">
                    {new Date(quest.completedAt!).toLocaleDateString()}
                  </span>
                  <div className="flex gap-4">
                    <span className="text-sm font-medium text-[#8E8E93]">{quest.xpReward} XP</span>
                    <span className="text-sm font-medium text-[#8E8E93]">{quest.goldReward} 🟡</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => uncompleteQuest(quest.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FF9500] hover:bg-[#E68600] active:bg-[#CC7700] py-3 rounded-xl transition-colors"
                  >
                    <X size={18} color="#FFF" strokeWidth={2.5} />
                    <span className="text-white text-sm font-semibold">Undo</span>
                  </button>
                  <button
                    onClick={() => handleDeleteQuest(quest.id)}
                    className="w-12 h-12 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] active:bg-[#48484A] flex items-center justify-center transition-colors border border-[#3A3A3C]"
                  >
                    <Trash2 size={18} color="#FF3B30" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setModalVisible(true)}
        className="absolute bottom-20 right-5 w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-lg z-10"
        style={{ backgroundColor: themeColor }}
      >
        <Plus size={28} color="#000" />
      </button>

      <Dialog open={modalVisible} onOpenChange={(open) => {
        if (!open) {
          setEditingQuestId(null);
          setQuestForm({
            title: '',
            details: '',
            emoji: '📝',
            image: '',
            difficulty: 'Normal',
          });
          setSelectedClassIds([]);
        }
        setModalVisible(open);
      }}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingQuestId ? 'Edit Quest' : 'Create Quest'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold text-white mb-2">Emoji</Label>
              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-center gap-3 hover:bg-[#1A1A1A] transition-colors"
                  >
                    <span className="text-4xl">{questForm.emoji}</span>
                    <Smile size={20} color="#999" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 border-[#2A2A2A] bg-[#1A1A1A]" 
                  align="center"
                  side="bottom"
                  sideOffset={5}
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.DARK}
                    searchPlaceHolder="Search emoji..."
                    width={350}
                    height={450}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-semibold text-white mb-2">Title *</Label>
              <Input
                value={questForm.title}
                onChange={(e) => setQuestForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter quest title"
                className="bg-[#0F0F0F] border-[#2A2A2A] text-white"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-white mb-2">Details</Label>
              <Textarea
                value={questForm.details}
                onChange={(e) => setQuestForm(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Quest description (optional)"
                className="bg-[#0F0F0F] border-[#2A2A2A] text-white min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-white mb-2">Difficulty</Label>
              <div className="flex flex-wrap gap-2">
                {(['Easy', 'Normal', 'Hard', 'Extreme', 'Impossible'] as Difficulty[]).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setQuestForm(prev => ({ ...prev, difficulty: diff }))}
                    className="px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: questForm.difficulty === diff ? DIFFICULTY_COLORS[diff] + '30' : '#2C2C2E',
                      borderWidth: questForm.difficulty === diff ? 2 : 0,
                      borderColor: questForm.difficulty === diff ? DIFFICULTY_COLORS[diff] : 'transparent',
                      color: questForm.difficulty === diff ? DIFFICULTY_COLORS[diff] : '#8E8E93',
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between bg-[#0F0F0F] p-4 rounded-xl">
              <span className="text-base font-semibold text-[#999]">Rewards:</span>
              <span className="text-base font-bold" style={{ color: themeColor }}>
                {calculatedXp} XP + {calculatedGold} 🟡
              </span>
            </div>

            {state.classes.length > 0 && (
              <div>
                <Label className="text-sm font-semibold text-white mb-2">Link to Classes (Optional)</Label>
                <div className="bg-[#0F0F0F] rounded-xl p-3 max-h-[300px] overflow-y-auto">
                  <div className="space-y-3">
                    {state.classes.map(classData => {
                      const isClassSelected = selectedClassIds.includes(classData.id);
                      const subclasses = getSubclassesForClass(classData.id);
                      return (
                        <div key={classData.id}>
                          <button
                            onClick={() => toggleClassSelection(classData.id)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors"
                            style={{ 
                              backgroundColor: isClassSelected ? themeColor + '20' : 'transparent',
                              borderWidth: 1,
                              borderColor: isClassSelected ? themeColor : '#2A2A2A',
                            }}
                          >
                            <span className="text-xl">{classData.emoji}</span>
                            <span className="flex-1 text-left text-sm font-semibold text-white">
                              {classData.name}
                            </span>
                            {isClassSelected && (
                              <Check size={16} style={{ color: themeColor }} />
                            )}
                          </button>
                          
                          {isClassSelected && subclasses.length > 0 && (
                            <div className="ml-6 mt-2 space-y-2">
                              <p className="text-xs text-[#999] mb-1">Subclasses:</p>
                              {subclasses.map(subclass => {
                                const isSubclassSelected = selectedClassIds.includes(subclass.id);
                                return (
                                  <button
                                    key={subclass.id}
                                    onClick={() => toggleClassSelection(subclass.id)}
                                    className="w-full flex items-center gap-2 p-2 rounded-lg transition-colors"
                                    style={{ 
                                      backgroundColor: isSubclassSelected ? themeColor + '15' : 'transparent',
                                      borderWidth: 1,
                                      borderColor: isSubclassSelected ? themeColor : '#2A2A2A',
                                    }}
                                  >
                                    <span className="text-base">{subclass.emoji}</span>
                                    <span className="flex-1 text-left text-xs font-semibold text-white">
                                      {subclass.name}
                                    </span>
                                    {isSubclassSelected && (
                                      <Check size={14} style={{ color: themeColor }} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={pickImage}
              className="w-full flex items-center justify-center gap-2 bg-[#0F0F0F] border border-[#2A2A2A] p-4 rounded-xl"
            >
              <ImageIcon size={20} style={{ color: themeColor }} />
              <span className="text-base font-semibold" style={{ color: themeColor }}>
                {questForm.image ? 'Change Image' : 'Add Image (Optional)'}
              </span>
            </button>

            {questForm.image && (
              <img src={questForm.image} alt="Preview" className="w-full h-[200px] object-cover rounded-xl" />
            )}

            <Button
              onClick={handleCreateQuest}
              className="w-full text-black font-bold py-4 rounded-xl hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              {editingQuestId ? 'Update Quest' : 'Create Quest'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
