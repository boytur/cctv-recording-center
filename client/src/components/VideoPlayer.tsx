import { useState, useRef, useEffect } from 'react';
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
  const hlsRef = useRef<any>(null);
  const [hlsUrl, setHlsUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Fetch HLS URL from the API endpoint if src is an API endpoint
  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }
    
    // If src is already an m3u8 file, use it directly
    if (src.endsWith('.m3u8') || src.includes('.m3u8')) {
      setHlsUrl(src);
      setLoading(false);
      return;
    }

    // If src is an API endpoint, fetch the HLS URL
    if (src.startsWith('/api/stream/')) {
      const fetchHlsUrl = async () => {
        try {
          setLoading(true);
          const res = await fetch(src);
          if (!res.ok) throw new Error('Failed to fetch HLS URL');
          const data = await res.json();
          if (data.url) {
            setHlsUrl(data.url);
          }
        } catch (err) {
          console.error('Error fetching HLS URL:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchHlsUrl();
      return;
    }

    // Otherwise use src as-is
    setHlsUrl(src);
    setLoading(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl || loading) return;

    const isM3U8 = hlsUrl.endsWith('.m3u8') || hlsUrl.includes('.m3u8');

    // If it's a regular video file (MP4, etc.), just set src directly
    if (!isM3U8) {
      video.src = hlsUrl;
      
      // Add event listeners for video
      const handleCanPlay = () => {
        setVideoLoaded(true);
        console.log('Video can play:', hlsUrl);
      };
      
      const handleError = (e: Event) => {
        console.error('Video error:', e, hlsUrl);
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      
      if (isLive) {
        video.play().catch(() => {});
      }
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    }

    const setupHls = async () => {
      // Prefer hls.js when available (Chrome/Firefox). Try dynamic import first
      // and fall back to loading from CDN if not installed locally.
      const loadScript = (url: string) =>
        new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = url;
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('failed to load script ' + url));
          document.head.appendChild(s);
        });

      let Hls: any = null;
      try {
        Hls = (await import('hls.js')).default;
      } catch (err) {
        // try CDN fallback (UMD adds window.Hls)
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.4.0/dist/hls.min.js');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Hls = (window as any).Hls;
        } catch (err2) {
          Hls = null;
        }
      }

      if (Hls && Hls.isSupported && Hls.isSupported()) {
        // cleanup previous
        if (hlsRef.current) {
          try { hlsRef.current.destroy(); } catch (_) {}
          hlsRef.current = null;
        }
        const hls = new Hls();
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(hlsUrl);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setVideoLoaded(true);
            if (isLive) video.play().catch(() => {});
          });
        });
        return;
      }

      // Native HLS (Safari)
      try {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = hlsUrl;
          setVideoLoaded(true);
          if (isLive) video.play().catch(() => {});
        }
      } catch (err) {
        // ignore
      }
    };

    setupHls();

    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (_) {}
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, isLive, loading]);

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
          playsInline
          onLoadedData={() => {
            console.log('Video loaded data');
            setVideoLoaded(true);
          }}
          onError={(e) => console.error('Video element error:', e)}
        />
        
        {/* Mock video display with animated effect - hide when video is loaded */}
        {!videoLoaded && (
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
                {loading ? 'กำลังโหลด...' : isLive ? 'ภาพสด' : 'คลิปบันทึก'}
              </p>
            </div>
          </div>
        )}

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
