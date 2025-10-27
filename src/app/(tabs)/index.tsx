import { useGame } from '@/contexts/GameContext';
import { Camera, Edit2 } from 'lucide-react';
import React, { useState } from 'react';

export default function StatusScreen() {
  const { state, getRankForLevel, getXpToNextLevel, updatePlayer } = useGame();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(state.player.name);
  const themeColor = state.sandboxSettings.themeColor || '#FFFFFF';

  const rank = getRankForLevel(state.player.level);
  const xpToNext = getXpToNextLevel();
  const xpProgress = (state.player.xp / xpToNext) * 100;

  const pickBannerImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          updatePlayer({ banner: event.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const pickAvatarImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          updatePlayer({ avatar: event.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const takeAvatarPicture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        updatePlayer({ avatar: dataUrl });
        stream.getTracks().forEach(track => track.stop());
      }, 100);
    } catch (error) {
      alert('Camera permission is required to take photos');
    }
  };

  const handleBannerClick = () => {
    pickBannerImage();
  };

  const handleAvatarClick = () => {
    const options = confirm('Take Photo with camera? (Cancel to choose from gallery)');
    if (options) {
      takeAvatarPicture();
    } else {
      pickAvatarImage();
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      updatePlayer({ name: tempName.trim() });
      setEditingName(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-5">
          <h1 className="text-[32px] font-bold text-white text-center">Player Status</h1>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden mb-4">
          {/* Banner Section */}
          <div className="relative">
            <button
              onClick={handleBannerClick}
              className="relative w-full h-32 overflow-hidden cursor-pointer group"
            >
              {state.player.banner ? (
                <img 
                  src={state.player.banner} 
                  alt="Profile banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] flex flex-col justify-center items-center gap-2">
                  <Camera size={32} color="#666" />
                  <span className="text-[#666] text-xs font-semibold">Add Banner</span>
                </div>
              )}
              <div 
                className="absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: themeColor }}
              >
                <Edit2 size={14} color="#000" />
              </div>
            </button>

            {/* Profile Picture - Overlapping Banner */}
            <div className="absolute -bottom-12 left-5">
              <button
                onClick={handleAvatarClick}
                className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-4 border-[#1A1A1A]"
              >
                {state.player.avatar ? (
                  <img 
                    src={state.player.avatar} 
                    alt="Profile picture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A] flex flex-col justify-center items-center">
                    <Camera size={24} color="#666" />
                  </div>
                )}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 size={16} color="#FFF" />
                </div>
              </button>
            </div>
          </div>

          {/* Content Section with top padding for overlapping avatar */}
          <div className="p-5 pt-16">

            <div className="mb-4">
              {editingName ? (
                <div className="w-full">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                    className="text-2xl font-bold text-white bg-[#2A2A2A] py-2 px-4 rounded-lg border-2 border-white w-full"
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempName(state.player.name);
                    setEditingName(true);
                  }}
                  className="flex items-center gap-2 py-2 px-4 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] transition-colors"
                >
                  <span className="text-2xl font-bold text-white">{state.player.name}</span>
                  <Edit2 size={16} color="#999" />
                </button>
              )}
            </div>

            <div className="flex flex-col items-center mb-6 py-3 bg-[#0F0F0F] rounded-xl gap-3">
              {rank.image && state.sandboxSettings.showRankPhotos && (
                <img 
                  src={rank.image} 
                  alt="Rank badge"
                  className="w-20 h-20 rounded-full"
                  style={{ border: `3px solid ${themeColor}` }}
                />
              )}
              <span className="text-[28px] font-bold tracking-wide" style={{ color: rank.color }}>
                {rank.name}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex-1 min-w-[45%] bg-[#0F0F0F] p-4 rounded-xl text-center">
                <p className="text-xs text-[#999] mb-1 font-semibold">Level</p>
                <p className="text-2xl font-bold text-white">{state.player.level}</p>
              </div>
              <div className="flex-1 min-w-[45%] bg-[#0F0F0F] p-4 rounded-xl text-center">
                <p className="text-xs text-[#999] mb-1 font-semibold">Gold</p>
                <p className="text-xl font-bold text-white">
                  {state.player.gold.toLocaleString()} 🟡
                </p>
              </div>
              <div className="flex-1 min-w-[45%] bg-[#0F0F0F] p-4 rounded-xl text-center">
                <p className="text-xs text-[#999] mb-1 font-semibold">Daily Streak</p>
                <p className="text-2xl font-bold text-white">
                  🔥 {state.player.dailyStreak}
                </p>
              </div>
              <div className="flex-1 min-w-[45%] bg-[#0F0F0F] p-4 rounded-xl text-center">
                <p className="text-xs text-[#999] mb-1 font-semibold">Total XP</p>
                <p className="text-2xl font-bold text-white">
                  {state.player.totalXpEarned.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#999] font-semibold">Experience Points</span>
                <span className="text-sm text-white font-bold">
                  {state.player.xp} / {xpToNext} XP
                </span>
              </div>
              <div className="h-6 bg-[#0F0F0F] rounded-xl overflow-hidden">
                <div 
                  className="h-full rounded-xl transition-all duration-300"
                  style={{ 
                    width: `${xpProgress}%`,
                    backgroundColor: themeColor
                  }}
                />
              </div>
              <p className="text-xs text-[#999] text-center">
                {Math.round(xpProgress)}% to Level {state.player.level + 1}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl p-5">
          <h2 className="text-xl font-bold text-white mb-4">Journey Stats</h2>
          <div className="border-b border-[#2A2A2A] py-3 flex justify-between">
            <span className="text-sm text-[#999]">Member Since</span>
            <span className="text-sm text-white font-semibold">
              {new Date(state.player.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="border-b border-[#2A2A2A] py-3 flex justify-between">
            <span className="text-sm text-[#999]">Active Quests</span>
            <span className="text-sm text-white font-semibold">
              {state.quests.filter(q => !q.completed).length}
            </span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-sm text-[#999]">Completed Quests</span>
            <span className="text-sm text-white font-semibold">
              {state.quests.filter(q => q.completed).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
