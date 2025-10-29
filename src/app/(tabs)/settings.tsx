import { useGame, type Difficulty } from '@/contexts/GameContext';
import { ChevronRight, AlertCircle, Image as ImageIcon } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HexColorPicker } from 'react-colorful';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function SettingsScreen() {
  const { state, resetAllStats, recoverDeletedData, updateSandboxSettings } = useGame();
  const [sandboxMode, setSandboxMode] = useState(false);
  const [sandboxValues, setSandboxValues] = useState(state.sandboxSettings);
  const [showThemeColorPicker, setShowThemeColorPicker] = useState(false);
  const [showProgressColorPicker, setShowProgressColorPicker] = useState(false);
  const themeColor = state.sandboxSettings.themeColor || '#FFFFFF';
  
  // Crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [currentRankIndex, setCurrentRankIndex] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Helper to center and enforce 1:1 crop regardless of image aspect
  function centerAspectSquare(mediaWidth: number, mediaHeight: number) {
    return centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        1,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  // Update sandboxValues when dialog opens
  React.useEffect(() => {
    if (sandboxMode) {
      setSandboxValues(state.sandboxSettings);
    }
  }, [sandboxMode, state.sandboxSettings]);

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
          setImageToCrop(event.target?.result as string);
          setCurrentRankIndex(index);
          // Let crop be computed on image load to keep perfect 1:1
          setCrop(undefined);
          setShowCropModal(true);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<string> => {
    console.log('getCroppedImg called with crop:', crop);
    console.log('Image dimensions - natural:', image.naturalWidth, 'x', image.naturalHeight);
    console.log('Image dimensions - displayed:', image.width, 'x', image.height);
    
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    console.log('Scale factors - X:', scaleX, 'Y:', scaleY);

    // Convert crop to pixel coordinates on the displayed image, then scale to natural size
    let pixelCrop;
    if (crop.unit === '%') {
      pixelCrop = {
        x: (crop.x / 100) * image.width,
        y: (crop.y / 100) * image.height,
        width: (crop.width / 100) * image.width,
        height: (crop.height / 100) * image.height,
      };
    } else {
      pixelCrop = {
        x: crop.x,
        y: crop.y,
        width: crop.width,
        height: crop.height,
      };
    }

    console.log('Pixel crop on displayed image:', pixelCrop);

    // Scale to natural image size
    const naturalCrop = {
      x: pixelCrop.x * scaleX,
      y: pixelCrop.y * scaleY,
      width: pixelCrop.width * scaleX,
      height: pixelCrop.height * scaleY,
    };

    console.log('Natural crop coordinates:', naturalCrop);

    // Canvas should be square (1:1 aspect ratio)
    const size = Math.round(Math.min(naturalCrop.width, naturalCrop.height));
    canvas.width = size;
    canvas.height = size;

    console.log('Canvas size:', size, 'x', size);

    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.reject(new Error('No 2d context'));

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      Math.round(naturalCrop.x),
      Math.round(naturalCrop.y),
      Math.round(naturalCrop.width),
      Math.round(naturalCrop.height),
      0,
      0,
      size,
      size
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          console.log('Cropped image created successfully');
          resolve(reader.result as string);
        };
      }, 'image/png', 1);
    });
  };

  const handleCropComplete = async () => {
    console.log('handleCropComplete called');
    console.log('Current crop state:', crop);
    console.log('Current rank index:', currentRankIndex);
    
    if (imgRef.current && crop && crop.width && crop.height) {
      console.log('Starting crop process...');
      const croppedImage = await getCroppedImg(imgRef.current, crop);
      console.log('Cropped image length:', croppedImage.length);
      
      setSandboxValues(prev => ({
        ...prev,
        customRanks: prev.customRanks.map((rank, i) =>
          i === currentRankIndex ? { ...rank, image: croppedImage } : rank
        ),
      }));
      setShowCropModal(false);
      setImageToCrop('');
      console.log('Crop complete, modal closed');
    } else {
      console.error('Cannot crop - missing data:', {
        hasImgRef: !!imgRef.current,
        hasCrop: !!crop,
        cropWidth: crop?.width,
        cropHeight: crop?.height
      });
    }
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
                <div className="relative">
                  <button
                    onClick={() => setShowThemeColorPicker(!showThemeColorPicker)}
                    className="w-16 h-16 rounded-full cursor-pointer border-4 border-[#2A2A2A] transition-transform hover:scale-105"
                    style={{ backgroundColor: state.sandboxSettings.themeColor }}
                  />
                  {showThemeColorPicker && (
                    <div className="absolute top-20 left-0 z-50 p-4 bg-[#1A1A1A] rounded-2xl border-2 border-[#2A2A2A] shadow-2xl">
                      <HexColorPicker 
                        color={state.sandboxSettings.themeColor}
                        onChange={(color) => updateSandboxSettings({ 
                          ...state.sandboxSettings, 
                          themeColor: color 
                        })}
                      />
                      <button
                        onClick={() => setShowThemeColorPicker(false)}
                        className="mt-3 w-full py-2 bg-[#2A2A2A] text-white rounded-lg text-sm font-semibold hover:bg-[#3A3A3A]"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-1">App Theme</p>
                  <p className="text-xs text-[#999]">Changes buttons, highlights, and accents</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Progress Bar Color</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowProgressColorPicker(!showProgressColorPicker)}
                    className="w-16 h-16 rounded-full cursor-pointer border-4 border-[#2A2A2A] transition-transform hover:scale-105"
                    style={{ backgroundColor: state.sandboxSettings.progressBarColor }}
                  />
                  {showProgressColorPicker && (
                    <div className="absolute top-20 left-0 z-50 p-4 bg-[#1A1A1A] rounded-2xl border-2 border-[#2A2A2A] shadow-2xl">
                      <HexColorPicker 
                        color={state.sandboxSettings.progressBarColor}
                        onChange={(color) => updateSandboxSettings({ 
                          ...state.sandboxSettings, 
                          progressBarColor: color 
                        })}
                      />
                      <button
                        onClick={() => setShowProgressColorPicker(false)}
                        className="mt-3 w-full py-2 bg-[#2A2A2A] text-white rounded-lg text-sm font-semibold hover:bg-[#3A3A3A]"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
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
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Sandbox Mode</DialogTitle>
          </DialogHeader>

          <div className="space-y-8 overflow-y-auto flex-1 pr-2">
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

              <div className="bg-[#0F0F0F] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-white">Show Rank Photos</Label>
                    <p className="text-xs text-[#999] mt-1">Display uploaded rank icons in status window</p>
                  </div>
                  <Switch
                    checked={sandboxValues.showRankPhotos}
                    onCheckedChange={(checked) => setSandboxValues(prev => ({
                      ...prev,
                      showRankPhotos: checked,
                    }))}
                  />
                </div>
              </div>

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

          </div>

          {/* Floating Save Button */}
          <div className="bg-[#1A1A1A] pt-4 pb-2 border-t border-[#2A2A2A] mt-4">
            <Button
              onClick={handleSaveSandboxSettings}
              className="w-full text-black font-bold py-4 rounded-xl hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Crop Image (1:1 Ratio)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center bg-[#0F0F0F] rounded-xl p-4">
              {imageToCrop && (
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCrop(c)}
                  aspect={1}
                  locked={false}
                  keepSelection={true}
                  minWidth={50}
                  minHeight={50}
                >
                  <img
                    ref={imgRef}
                    src={imageToCrop}
                    alt="Crop preview"
                    style={{ maxHeight: '60vh', maxWidth: '100%' }}
                    onLoad={(e) => setCrop(centerAspectSquare(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight))}
                  />
                </ReactCrop>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCropModal(false)}
                className="flex-1 bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCropComplete}
                className="flex-1 text-black font-bold"
                style={{ backgroundColor: themeColor }}
              >
                Save Cropped Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
