import { useGame, type ProTip } from '@/contexts/GameContext';
import { Plus, X, Link as LinkIcon, Trash2, Youtube, FileText, Edit, Smile } from 'lucide-react';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export default function ProTipsScreen() {
  const { state, addProTip, updateProTip, deleteProTip } = useGame();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTipId, setEditingTipId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [tipForm, setTipForm] = useState({
    title: '',
    content: '',
    type: 'note' as ProTip['type'],
    url: '',
    emoji: '📝',
  });

  const handleCreateTip = () => {
    if (!tipForm.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (tipForm.type !== 'note' && !tipForm.url.trim()) {
      alert('Please enter a URL');
      return;
    }

    if (editingTipId) {
      updateProTip(editingTipId, {
        title: tipForm.title.trim(),
        content: tipForm.content.trim(),
        type: tipForm.type,
        url: tipForm.url.trim() || undefined,
        emoji: tipForm.emoji,
      });
    } else {
      addProTip({
        title: tipForm.title.trim(),
        content: tipForm.content.trim(),
        type: tipForm.type,
        url: tipForm.url.trim() || undefined,
        emoji: tipForm.emoji,
      });
    }

    setTipForm({
      title: '',
      content: '',
      type: 'note',
      url: '',
      emoji: '📝',
    });
    setEditingTipId(null);
    setModalVisible(false);
  };

  const handleEditTip = (tip: ProTip) => {
    setTipForm({
      title: tip.title,
      content: tip.content,
      type: tip.type,
      url: tip.url || '',
      emoji: tip.emoji || '📝',
    });
    setEditingTipId(tip.id);
    setModalVisible(true);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setTipForm(prev => ({ ...prev, emoji: emojiData.emoji }));
    setEmojiPickerOpen(false);
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteTip = (tipId: string) => {
    if (confirm('Are you sure you want to delete this tip?')) {
      deleteProTip(tipId);
    }
  };

  const getTypeIcon = (tip: ProTip) => {
    if (tip.emoji) {
      return <span className="text-2xl">{tip.emoji}</span>;
    }
    
    switch (tip.type) {
      case 'video':
        return <Youtube size={20} color="#FF0000" />;
      case 'article':
        return <FileText size={20} color="#2196F3" />;
      default:
        return <FileText size={20} color="#FFFFFF" />;
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-black">
      <div className="flex-1 overflow-auto p-4 pb-24">
        <div className="mb-5">
          <h1 className="text-[32px] font-bold text-white text-center">Tips</h1>
        </div>

        {state.proTips.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center">
            <p className="text-lg text-white font-semibold mb-2">No Tips Yet</p>
            <p className="text-sm text-[#999] text-center">
              Store notes, articles, or video links for productivity tips!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.proTips.map(tip => (
              <div key={tip.id} className="bg-[#1A1A1A] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getTypeIcon(tip)}
                  <h3 className="flex-1 text-lg font-bold text-white">{tip.title}</h3>
                </div>
                {tip.content && (
                  <p className="text-sm text-[#CCC] leading-5 mb-3">{tip.content}</p>
                )}
                {tip.url && (
                  <button
                    onClick={() => handleOpenUrl(tip.url!)}
                    className="flex items-center gap-2 bg-[#0F0F0F] p-3 rounded-lg mb-3 w-full"
                  >
                    <LinkIcon size={16} color="#2196F3" />
                    <span className="flex-1 text-xs text-[#2196F3] truncate text-left">
                      {tip.url}
                    </span>
                  </button>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#666]">
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTip(tip)}
                      className="p-2"
                    >
                      <Edit size={16} color="#2196F3" />
                    </button>
                    <button
                      onClick={() => handleDeleteTip(tip.id)}
                      className="p-2"
                    >
                      <Trash2 size={16} color="#F44336" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setModalVisible(true)}
        className="absolute bottom-20 right-5 w-[60px] h-[60px] rounded-full bg-white flex items-center justify-center shadow-lg z-10"
      >
        <Plus size={28} color="#000" />
      </button>

      <Dialog open={modalVisible} onOpenChange={(open) => {
        setModalVisible(open);
        if (!open) {
          setEditingTipId(null);
          setEmojiPickerOpen(false);
          setTipForm({
            title: '',
            content: '',
            type: 'note',
            url: '',
            emoji: '📝',
          });
        }
      }}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white max-w-md max-h-[75vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingTipId ? 'Edit Tip' : 'Add Pro Tip'}
            </DialogTitle>
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
                    <span className="text-4xl">{tipForm.emoji}</span>
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
              <Label className="text-sm font-semibold text-white mb-2">Type</Label>
              <div className="flex gap-2">
                {(['note', 'video', 'article'] as ProTip['type'][]).map(type => (
                  <button
                    key={type}
                    onClick={() => setTipForm(prev => ({ ...prev, type }))}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border ${
                      tipForm.type === type
                        ? 'bg-white border-white text-black'
                        : 'bg-[#0F0F0F] border-[#2A2A2A] text-[#999]'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-white mb-2">Title *</Label>
              <Input
                value={tipForm.title}
                onChange={(e) => setTipForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
                className="bg-[#0F0F0F] border-[#2A2A2A] text-white"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-white mb-2">Content</Label>
              <Textarea
                value={tipForm.content}
                onChange={(e) => setTipForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Add notes or description"
                className="bg-[#0F0F0F] border-[#2A2A2A] text-white min-h-[120px]"
              />
            </div>

            {tipForm.type !== 'note' && (
              <div>
                <Label className="text-sm font-semibold text-white mb-2">URL *</Label>
                <Input
                  type="url"
                  value={tipForm.url}
                  onChange={(e) => setTipForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-[#0F0F0F] border-[#2A2A2A] text-white"
                />
              </div>
            )}

            <Button
              onClick={handleCreateTip}
              className="w-full bg-white hover:bg-white/90 text-black font-bold py-4 rounded-xl"
            >
              {editingTipId ? 'Update Tip' : 'Add Tip'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
