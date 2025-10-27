import { useGame, ClassData } from '@/contexts/GameContext';
import React, { useState } from 'react';
import { Plus, X, ChevronRight, Smile, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export default function ClassesScreen() {
  const { state, addClass, addSubclass, linkQuestToClass, unlinkQuestFromClass } = useGame();
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const themeColor = state.sandboxSettings.themeColor || '#FFFFFF';
  const [showAddModal, setShowAddModal] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassEmoji, setNewClassEmoji] = useState('⚔️');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [newClassImage, setNewClassImage] = useState('');
  const [isAddingSubclass, setIsAddingSubclass] = useState(false);
  const [linkQuestsModal, setLinkQuestsModal] = useState(false);
  const [linkingClass, setLinkingClass] = useState<ClassData | null>(null);

  const classes = selectedClass ? state.subclasses.filter(s => s.image === selectedClass.id) : state.classes;

  const handleAddClass = () => {
    setIsAddingSubclass(false);
    setShowAddModal(true);
  };

  const handleAddSubclass = (parentClass: ClassData) => {
    setSelectedClass(parentClass);
    setIsAddingSubclass(true);
    setShowAddModal(true);
  };

  const handleSaveClass = async () => {
    if (!newClassName.trim()) {
      alert('Please enter a class name');
      return;
    }

    const classData = {
      name: newClassName,
      emoji: newClassEmoji,
      image: isAddingSubclass ? selectedClass?.id || '' : newClassImage,
      description: newClassDescription,
    };

    if (isAddingSubclass) {
      addSubclass(classData);
    } else {
      addClass(classData);
    }

    setShowAddModal(false);
    setNewClassName('');
    setNewClassEmoji('⚔️');
    setNewClassDescription('');
    setNewClassImage('');
  };

  const pickImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setNewClassImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleClassPress = (classData: ClassData) => {
    if (!selectedClass) {
      setSelectedClass(classData);
    }
  };

  const handleBack = () => {
    setSelectedClass(null);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewClassEmoji(emojiData.emoji);
    setEmojiPickerOpen(false);
  };

  const handleLinkQuests = (classData: ClassData) => {
    setLinkingClass(classData);
    setLinkQuestsModal(true);
  };

  const handleToggleQuestLink = (questId: string) => {
    if (!linkingClass) return;
    
    const isLinked = linkingClass.linkedQuestIds?.includes(questId);
    if (isLinked) {
      unlinkQuestFromClass(linkingClass.id, questId);
    } else {
      linkQuestToClass(linkingClass.id, questId);
    }
    
    // Update local state
    setLinkingClass(prev => {
      if (!prev) return prev;
      const linkedQuestIds = prev.linkedQuestIds || [];
      return {
        ...prev,
        linkedQuestIds: isLinked 
          ? linkedQuestIds.filter(id => id !== questId)
          : [...linkedQuestIds, questId]
      };
    });
  };

  return (
    <div className="relative flex flex-col h-full bg-black">
      <div className="flex-1 overflow-auto p-4 pb-24">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            {selectedClass && (
              <button onClick={handleBack} className="p-2">
                <span className="text-base font-semibold" style={{ color: themeColor }}>← Back</span>
              </button>
            )}
            <h1 className="text-[32px] font-bold text-white text-center flex-1">
              {selectedClass ? `${selectedClass.name} - Subclasses` : 'Classes'}
            </h1>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center">
            <p className="text-lg text-white font-semibold mb-2">
              No {selectedClass ? 'Subclasses' : 'Classes'} Yet
            </p>
            <p className="text-sm text-[#999]">
              Tap the + button to create {selectedClass ? 'a subclass' : 'a new class'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map(classData => (
              <div
                key={classData.id}
                className="bg-[#1A1A1A] rounded-2xl p-5 cursor-pointer"
                onClick={() => !selectedClass && handleClassPress(classData)}
              >
                <div className="text-5xl mb-3">{classData.emoji}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{classData.name}</h2>
                <p className="text-sm text-[#999] mb-4">{classData.description}</p>
                
                <div className="flex gap-4 mb-3">
                  <div className="flex-1 bg-[#0F0F0F] p-3 rounded-lg">
                    <p className="text-xs text-[#999] mb-1">Level</p>
                    <p className="text-base font-bold text-white">{classData.level}</p>
                  </div>
                  <div className="flex-1 bg-[#0F0F0F] p-3 rounded-lg">
                    <p className="text-xs text-[#999] mb-1">XP</p>
                    <p className="text-base font-bold text-white">{classData.xp}/{classData.xpToNextLevel}</p>
                  </div>
                </div>

                <div className="h-2 bg-[#0F0F0F] rounded overflow-hidden">
                  <div
                    className="h-full"
                    style={{ 
                      width: `${(classData.xp / classData.xpToNextLevel) * 100}%`,
                      backgroundColor: themeColor
                    }}
                  />
                </div>

                <div className="mt-3 space-y-2">
                  <button
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg"
                    style={{ backgroundColor: themeColor }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLinkQuests(classData);
                    }}
                  >
                    <LinkIcon size={16} color="#000" />
                    <span className="text-sm font-semibold text-black">Link Quests</span>
                  </button>
                  {!selectedClass && (
                    <>
                      <button
                        className="w-full flex items-center justify-center gap-1.5 bg-[#0F0F0F] py-2.5 px-4 rounded-lg border"
                        style={{ borderColor: themeColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSubclass(classData);
                        }}
                      >
                        <Plus size={16} style={{ color: themeColor }} />
                        <span className="text-sm font-semibold" style={{ color: themeColor }}>Add Subclass</span>
                      </button>
                      <button
                        className="w-full flex items-center justify-center gap-1.5 bg-[#0F0F0F] py-2.5 px-4 rounded-lg border"
                        style={{ borderColor: themeColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassPress(classData);
                        }}
                      >
                        <span className="text-sm font-semibold" style={{ color: themeColor }}>View Subclasses</span>
                        <ChevronRight size={16} style={{ color: themeColor }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="absolute bottom-20 right-5 w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-lg z-10"
        style={{ backgroundColor: themeColor }}
        onClick={handleAddClass}
      >
        <Plus size={28} color="#000" />
      </button>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-[#1A1A1A] border-[#333] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isAddingSubclass ? `Add Subclass to ${selectedClass?.name}` : 'Add New Class'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            <div>
              <Label className="text-sm font-semibold text-[#999] mb-2">Emoji</Label>
              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full bg-[#0F0F0F] border border-[#333] rounded-xl p-4 flex items-center justify-center gap-3 hover:bg-[#1A1A1A] transition-colors"
                  >
                    <span className="text-4xl">{newClassEmoji}</span>
                    <Smile size={20} color="#999" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 border-[#333] bg-[#1A1A1A]" 
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
              <Label className="text-sm font-semibold text-[#999] mb-2">Class Name</Label>
              <Input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Enter class name"
                className="bg-[#0F0F0F] border-[#333] text-white"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#999] mb-2">Description</Label>
              <Textarea
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
                placeholder="Enter description"
                className="bg-[#0F0F0F] border-[#333] text-white min-h-[80px]"
              />
            </div>

            {!isAddingSubclass && (
              <button
                onClick={pickImage}
                className="w-full bg-[#0F0F0F] border border-white rounded-xl p-4 text-center"
              >
                <span className="text-base font-semibold text-white">
                  {newClassImage ? '✓ Image Selected' : 'Pick an Image (Optional)'}
                </span>
              </button>
            )}
          </div>

          <Button
            onClick={handleSaveClass}
            className="w-full text-black font-bold py-4 rounded-xl mt-5 hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={linkQuestsModal} onOpenChange={setLinkQuestsModal}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Link Quests to {linkingClass?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {state.quests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#999] text-sm">No quests available</p>
              </div>
            ) : (
              state.quests.map(quest => {
                const isLinked = linkingClass?.linkedQuestIds?.includes(quest.id);
                return (
                  <div
                    key={quest.id}
                    className="bg-[#0F0F0F] rounded-xl p-4 flex items-center gap-3"
                  >
                    <button
                      onClick={() => handleToggleQuestLink(quest.id)}
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: isLinked ? '#F44336' : themeColor }}
                    >
                      {isLinked ? (
                        <X size={18} color="#FFF" />
                      ) : (
                        <Plus size={18} color="#000" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{quest.emoji}</span>
                        <h3 className="text-sm font-bold text-white">{quest.title}</h3>
                      </div>
                      <p className="text-xs text-[#999]">
                        {quest.xpReward} XP • {quest.goldReward} Gold • {quest.difficulty}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Button
            onClick={() => setLinkQuestsModal(false)}
            className="w-full text-black font-bold py-4 rounded-xl mt-5 hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
