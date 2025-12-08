import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  isLive?: boolean;
  showControls?: boolean;
  className?: string;
}

const VideoPlayer = ({ src, isLive = false, showControls = true, className = '' }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(isLive);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <div className={`relative bg-secondary rounded-lg overflow-hidden group ${className}`}>
      {/* Video placeholder with animated gradient */}
      <div className="relative aspect-video bg-gradient-to-br from-secondary via-accent to-secondary">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          autoPlay={isLive}
          loop
          playsInline
        >
          <source src={src} type="application/x-mpegURL" />
        </video>
        
        {/* Mock video display with animated effect */}
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/80">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
              {isLive ? (
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-6 bg-primary rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <Play className="w-6 h-6 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isLive ? 'ภาพสด' : 'คลิปบันทึก'}
            </p>
          </div>
        </div>

        {/* Live indicator */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-destructive/90 rounded text-xs font-medium text-destructive-foreground">
            <span className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Controls overlay */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-primary" />
                ) : (
                  <Play className="w-4 h-4 text-primary" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-primary" />
                ) : (
                  <Volume2 className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 text-primary" />
              ) : (
                <Maximize className="w-4 h-4 text-primary" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
