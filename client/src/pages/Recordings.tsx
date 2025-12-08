import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Play, Download, Clock, HardDrive, Video } from 'lucide-react';
import Header from '@/components/Header';
import { usePlaybackStore } from '@/store/playbackStore';
import { toast } from '@/hooks/use-toast';

const Recordings = () => {
  const { recordings } = usePlaybackStore();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (recordingId: string) => {
    toast({
      title: 'กำลังโหลด',
      description: 'กำลังเปิดไฟล์คลิป...',
    });
  };

  const handleDownload = (recordingId: string) => {
    toast({
      title: 'กำลังดาวน์โหลด',
      description: 'กำลังเตรียมไฟล์ กรุณารอสักครู่...',
    });
  };

  // Group recordings by date
  const groupedRecordings = recordings.reduce((groups, recording) => {
    const dateKey = format(recording.startTime, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(recording);
    return groups;
  }, {} as Record<string, typeof recordings>);

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <Header title="ไฟล์บันทึก" />

      <main className="p-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{recordings.length}</p>
                <p className="text-xs text-muted-foreground">คลิปทั้งหมด</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <HardDrive className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">2.4 GB</p>
                <p className="text-xs text-muted-foreground">พื้นที่ใช้งาน</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recordings List */}
        {Object.entries(groupedRecordings).map(([dateKey, dayRecordings]) => (
          <div key={dateKey} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: th })}
            </h3>
            <div className="space-y-2">
              {dayRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in"
                >
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                        <Video className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-background/80 rounded text-xs font-medium">
                        {formatDuration(recording.duration)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {recording.cameraName}
                      </h4>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(recording.startTime, 'HH:mm')} - {format(recording.endTime, 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {recording.fileSize}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handlePlay(recording.id)}
                        className="p-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Play className="w-4 h-4 text-primary-foreground" />
                      </button>
                      <button
                        onClick={() => handleDownload(recording.id)}
                        className="p-2 bg-secondary hover:bg-accent rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Recordings;
