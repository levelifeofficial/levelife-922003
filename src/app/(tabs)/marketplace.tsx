import { useGame } from '@/contexts/GameContext';
import { Plus, ShoppingCart, Check, X, Image as ImageIcon, Trash2, Smile, Pencil, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export default function MarketplaceScreen() {
  const { state, addReward, updateReward, purchaseReward, unpurchaseReward, deleteReward } = useGame();
  const [modalVisible, setModalVisible] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardForm, setRewardForm] = useState({
    title: '',
    description: '',
    emoji: '🎁',
    image: '',
    goldCost: '100',
  });

  const pickImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setRewardForm(prev => ({ ...prev, image: event.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleEditReward = (rewardId: string) => {
    const reward = state.rewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    setRewardForm({
      title: reward.title,
      description: reward.description,
      emoji: reward.emoji,
      image: reward.image || '',
      goldCost: reward.goldCost.toString(),
    });
    
    setEditingRewardId(rewardId);
    setModalVisible(true);
  };

  const handleCreateReward = () => {
    if (!rewardForm.title.trim()) {
      alert('Please enter a reward title');
      return;
    }

    const goldCost = parseInt(rewardForm.goldCost, 10);
    if (isNaN(goldCost) || goldCost < 0) {
      alert('Please enter a valid gold cost');
      return;
    }

    if (editingRewardId) {
      // Update existing reward
      updateReward(editingRewardId, {
        title: rewardForm.title.trim(),
        description: rewardForm.description.trim(),
        emoji: rewardForm.emoji,
        image: rewardForm.image || undefined,
        goldCost,
      });
    } else {
      // Create new reward
      addReward({
        title: rewardForm.title.trim(),
        description: rewardForm.description.trim(),
        emoji: rewardForm.emoji,
        image: rewardForm.image || undefined,
        goldCost,
      });
    }

    setRewardForm({
      title: '',
      description: '',
      emoji: '🎁',
      image: '',
      goldCost: '100',
    });
    setEditingRewardId(null);
    setModalVisible(false);
  };

  const handlePurchase = (rewardId: string, cost: number) => {
    if (state.player.gold < cost) {
      alert(`Insufficient Gold: You need ${cost} gold to purchase this reward. You have ${state.player.gold} gold.`);
      return;
    }

    if (confirm(`Purchase Reward: Spend ${cost} gold on this reward?`)) {
      purchaseReward(rewardId);
    }
  };

  const handleDeleteReward = (rewardId: string) => {
    if (confirm('Are you sure you want to delete this reward?')) {
      deleteReward(rewardId);
    }
  };

  const handleReturnReward = (rewardId: string, cost: number) => {
    if (confirm(`Return this reward and receive ${cost} gold back?`)) {
      unpurchaseReward(rewardId);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setRewardForm(prev => ({ ...prev, emoji: emojiData.emoji }));
    setEmojiPickerOpen(false);
  };

  const availableRewards = state.rewards.filter(r => !r.purchased);
  const purchasedRewards = state.rewards.filter(r => r.purchased);

  return (
    <div className="relative flex flex-col h-full bg-black">
      <div className="flex-1 overflow-auto p-4 pb-24">
        <div className="mb-5">
          <h1 className="text-[32px] font-bold text-white text-center">Marketplace</h1>
          <p className="text-lg font-bold text-white mt-1 text-center">
            {state.player.gold.toLocaleString()} 🟡
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Available Rewards</h2>
          {availableRewards.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center">
              <p className="text-lg text-white font-semibold mb-2">No rewards available</p>
              <p className="text-sm text-[#999]">Create custom rewards to earn!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableRewards.map(reward => (
                <div key={reward.id} className="bg-[#1A1A1A] rounded-2xl overflow-hidden">
                  {reward.image && (
                    <img src={reward.image} alt={reward.title} className="w-full h-[150px] object-cover" />
                  )}
                  <div className="p-4">
                    <div className="text-4xl mb-2">{reward.emoji}</div>
                    <h3 className="text-xl font-bold text-white mb-1">{reward.title}</h3>
                    {reward.description && (
                      <p className="text-sm text-[#999] mb-2 leading-5">{reward.description}</p>
                    )}
                    <p className="text-lg font-bold text-white">{reward.goldCost} 🟡</p>
                  </div>
                  <div className="flex gap-3 p-4">
                    <button
                      onClick={() => handlePurchase(reward.id, reward.goldCost)}
                      disabled={state.player.gold < reward.goldCost}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${
                        state.player.gold < reward.goldCost
                          ? 'bg-[#2A2A2A] opacity-50 cursor-not-allowed'
                          : 'bg-[#4CAF50]'
                      }`}
                    >
                      <ShoppingCart size={18} color="#FFF" />
                      <span className="text-white text-base font-bold">Purchase</span>
                    </button>
                    <button
                      onClick={() => handleEditReward(reward.id)}
                      className="w-11 h-11 rounded-xl bg-[#2A2A2A] flex items-center justify-center"
                    >
                      <Pencil size={16} color="#2196F3" />
                    </button>
                    <button
                      onClick={() => handleDeleteReward(reward.id)}
                      className="w-11 h-11 rounded-xl bg-[#2A2A2A] flex items-center justify-center"
                    >
                      <Trash2 size={16} color="#F44336" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {purchasedRewards.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-3">
              Purchased ({purchasedRewards.length})
            </h2>
            <div className="space-y-4">
              {purchasedRewards.map(reward => (
                <div key={reward.id} className="bg-[#1A1A1A] rounded-2xl overflow-hidden opacity-70">
                  {reward.image && (
                    <img src={reward.image} alt={reward.title} className="w-full h-[150px] object-cover" />
                  )}
                  <div className="p-4">
                    <div className="text-4xl mb-2">{reward.emoji}</div>
                    <h3 className="text-xl font-bold text-white mb-1">{reward.title}</h3>
                    <div className="flex items-center gap-1 mt-2">
                      <Check size={16} color="#4CAF50" />
                      <span className="text-sm font-semibold text-[#4CAF50]">Purchased</span>
                    </div>
                  </div>
                  <div className="flex gap-3 p-4">
                    <button
                      onClick={() => handleReturnReward(reward.id, reward.goldCost)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#FF9800] py-3 rounded-xl"
                    >
                      <RotateCcw size={18} color="#FFF" />
                      <span className="text-white text-base font-bold">Return ({reward.goldCost} 🟡)</span>
                    </button>
                    <button
                      onClick={() => handleDeleteReward(reward.id)}
                      className="w-11 h-11 rounded-xl bg-[#2A2A2A] flex items-center justify-center"
                    >
                      <Trash2 size={16} color="#F44336" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
        if (!open) {
          setEditingRewardId(null);
          setRewardForm({
            title: '',
            description: '',
            emoji: '🎁',
            image: '',
            goldCost: '100',
          });
        }
        setModalVisible(open);
      }}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingRewardId ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
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
                    <span className="text-4xl">{rewardForm.emoji}</span>
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
                value={rewardForm.title}
                onChange={(e) => setRewardForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter reward title"
                className="bg-[#0F0F0F] border-[#2A2A2A] text-white"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-white mb-2">Description</Label>
              <Textarea
                value={rewardForm.description}
                onChange={(e) => setRewardForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Reward description (optional)"
                className="bg-[#0F0F0F] border-[#2A2A2A] text-white min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-white mb-2">Gold Cost *</Label>
              <Input
                type="number"
                value={rewardForm.goldCost}
                onChange={(e) => setRewardForm(prev => ({ ...prev, goldCost: e.target.value }))}
                placeholder="100"
                className="bg-[#0F0F0F] border-[#2A2A2A] text-white"
              />
            </div>

            <button
              onClick={pickImage}
              className="w-full flex items-center justify-center gap-2 bg-[#0F0F0F] border border-[#2A2A2A] p-4 rounded-xl"
            >
              <ImageIcon size={20} color="#FFF" />
              <span className="text-white text-base font-semibold">
                {rewardForm.image ? 'Change Image' : 'Add Image (Optional)'}
              </span>
            </button>

            {rewardForm.image && (
              <img src={rewardForm.image} alt="Preview" className="w-full h-[200px] object-cover rounded-xl" />
            )}

            <Button
              onClick={handleCreateReward}
              className="w-full bg-white hover:bg-white/90 text-black font-bold py-4 rounded-xl"
            >
              {editingRewardId ? 'Update Reward' : 'Create Reward'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
