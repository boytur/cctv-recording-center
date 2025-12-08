import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { CalendarIcon, Play, Pause, SkipBack, SkipForward, Download, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import Timeline from '@/components/Timeline';
import { usePlaybackStore } from '@/store/playbackStore';
import { useCameraStore } from '@/store/cameraStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const Playback = () => {
  const { cameras } = useCameraStore();
  const {
    selectedDate,
    selectedCameraId,
    currentTime,
    isPlaying,
    playbackSpeed,
    setSelectedDate,
    setSelectedCameraId,
    setIsPlaying,
    setPlaybackSpeed,
    skipForward,
    skipBackward,
    fetchRecordings,
    fetchTimeline,
  } = usePlaybackStore();

  const [showCameraSelect, setShowCameraSelect] = useState(false);

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId);

  useEffect(() => {
    if (fetchRecordings && fetchTimeline && selectedCameraId && selectedDate) {
      fetchRecordings(selectedCameraId, selectedDate);
      fetchTimeline(selectedCameraId, selectedDate);
    }
  }, [fetchRecordings, fetchTimeline, selectedCameraId, selectedDate]);

  const formatCurrentTime = () => {
    const hours = Math.floor(currentTime / 3600);
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = currentTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const speeds = [0.5, 1, 2];

  const handleDownload = () => {
    toast({
      title: 'กำลังดาวน์โหลด',
      description: 'กำลังเตรียมไฟล์คลิป กรุณารอสักครู่...',
    });
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <Header title="ย้อนหลัง" />

      <main className="p-4 space-y-4">
        {/* Camera & Date Selection */}
        <div className="flex gap-3">
          {/* Camera Dropdown */}
          <div className="flex-1 relative">
            <button
              onClick={() => setShowCameraSelect(!showCameraSelect)}
              className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedCamera?.name || 'เลือกกล้อง'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCameraSelect ? 'rotate-180' : ''}`} />
            </button>
            
            {showCameraSelect && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl overflow-hidden z-10 shadow-lg animate-fade-in">
                {cameras.map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => {
                      setSelectedCameraId(cam.id);
                      setShowCameraSelect(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors ${
                      cam.id === selectedCameraId ? 'bg-primary/20 text-primary' : ''
                    }`}
                  >
                    <span className="text-sm font-medium">{cam.name}</span>
                    <span className="text-xs text-muted-foreground block">{cam.location}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl hover:bg-accent transition-colors">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {format(selectedDate, 'd MMM', { locale: th })}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Video Player */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <VideoPlayer 
            src={selectedCamera?.streamUrl || ''} 
            isLive={false}
            showControls={false}
          />
          
          {/* Playback Controls */}
          <div className="p-4 space-y-4">
            {/* Time display */}
            <div className="text-center">
              <span className="text-2xl font-mono font-bold text-primary">{formatCurrentTime()}</span>
              <span className="text-sm text-muted-foreground block mt-1">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: th })}
              </span>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => skipBackward(30)}
                className="p-3 bg-secondary hover:bg-accent rounded-xl transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={() => skipBackward(10)}
                className="p-3 bg-secondary hover:bg-accent rounded-xl transition-colors"
              >
                <span className="text-xs font-medium">-10s</span>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-4 gradient-primary rounded-xl shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Play className="w-6 h-6 text-primary-foreground" />
                )}
              </button>
              <button
                onClick={() => skipForward(10)}
                className="p-3 bg-secondary hover:bg-accent rounded-xl transition-colors"
              >
                <span className="text-xs font-medium">+10s</span>
              </button>
              <button
                onClick={() => skipForward(30)}
                className="p-3 bg-secondary hover:bg-accent rounded-xl transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Speed & Download */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">ดาวน์โหลด</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <Timeline />
      </main>
    </div>
  );
};

export default Playback;
