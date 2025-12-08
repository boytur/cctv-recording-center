import { useRef } from 'react';
import { usePlaybackStore } from '@/store/playbackStore';

interface TimelineProps {
  onTimeSelect?: (time: number) => void;
}

const Timeline = ({ onTimeSelect }: TimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { timelineSegments, currentTime, seekTo } = usePlaybackStore();

  const formatHour = (hour: number): string => {
    return hour.toString().padStart(2, '0') + ':00';
  };

  const handleSegmentClick = (hour: number) => {
    const timeInSeconds = hour * 3600;
    seekTo(timeInSeconds);
    onTimeSelect?.(timeInSeconds);
  };

  const currentHour = Math.floor(currentTime / 3600);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-foreground">ไทม์ไลน์</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-cctv-timeline-recorded" />
            <span className="text-muted-foreground">มีบันทึก</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-cctv-timeline-empty" />
            <span className="text-muted-foreground">ไม่มีบันทึก</span>
          </div>
        </div>
      </div>

      {/* Timeline scroll container */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin"
      >
        <div className="flex gap-1 min-w-max">
          {timelineSegments.map((segment, index) => (
            <button
              key={index}
              onClick={() => handleSegmentClick(index)}
              className={`flex flex-col items-center transition-all ${
                index === currentHour ? 'scale-110' : ''
              }`}
            >
              {/* Hour label */}
              <span className={`text-xs mb-1 ${
                index === currentHour ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {formatHour(index)}
              </span>
              
              {/* Segment bar */}
              <div
                className={`w-8 h-12 rounded transition-all ${
                  segment.hasRecording
                    ? 'timeline-recorded hover:opacity-80'
                    : 'timeline-empty hover:opacity-80'
                } ${
                  index === currentHour 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' 
                    : ''
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Current time indicator */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">เวลาปัจจุบัน:</span>
        <span className="text-lg font-medium text-primary">
          {formatHour(currentHour)}
        </span>
      </div>
    </div>
  );
};

export default Timeline;
