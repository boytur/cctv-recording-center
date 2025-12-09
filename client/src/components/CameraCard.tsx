import { Camera, Expand, History, Wifi, WifiOff, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import type { Camera as CameraType } from '@/store/cameraStore';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useState } from 'react';

interface CameraCardProps {
  camera: CameraType;
}

const CameraCard = ({ camera }: CameraCardProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSnapshot = () => {
    toast({
      title: 'ถ่ายภาพนิ่งสำเร็จ',
      description: `บันทึกภาพจาก ${camera.name} เรียบร้อยแล้ว`,
    });
  };

  const handleFullscreen = () => {
    // open dialog to show larger live view
    setOpen(true);
  };

  const goToPlayback = () => {
    navigate('/playback', { state: { cameraId: camera.id } });
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border animate-fade-in">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${camera.isOnline ? 'bg-success/20' : 'bg-destructive/20'}`}>
            {camera.isOnline ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-destructive" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{camera.name}</h3>
            <p className="text-xs text-muted-foreground">{camera.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {camera.isRecording && (
            <div className="flex items-center gap-1 px-2 py-1 bg-destructive/20 rounded-full">
              <Circle className="w-2 h-2 fill-destructive text-destructive animate-pulse" />
              <span className="text-xs text-destructive font-medium">REC</span>
            </div>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${
            camera.isOnline 
              ? 'bg-success/20 text-success' 
              : 'bg-destructive/20 text-destructive'
          }`}>
            {camera.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>
      </div>

      {/* Video */}
      <VideoPlayer 
        src={camera.streamUrl} 
        isLive={camera.isOnline}
        showControls={false}
      />

      {/* Actions */}
      <div className="p-3 flex gap-2">
        <button
          onClick={handleFullscreen}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-accent rounded-lg transition-colors"
        >
          <Expand className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">ขยาย</span>
        </button>
        <button
          onClick={handleSnapshot}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-accent rounded-lg transition-colors"
        >
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">ถ่ายภาพ</span>
        </button>
        <button
          onClick={goToPlayback}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
        >
          <History className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">ย้อนหลัง</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-4xl">
          <DialogHeader>
            <DialogTitle>{camera.name}</DialogTitle>
          </DialogHeader>
          <VideoPlayer src={camera.streamUrl} isLive={camera.isOnline} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CameraCard;
