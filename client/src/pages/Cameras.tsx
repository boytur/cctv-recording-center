import { Wifi, WifiOff, Circle, Video, Settings2 } from 'lucide-react';
import Header from '@/components/Header';
import { useCameraStore } from '@/store/cameraStore';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const Cameras = () => {
  const { cameras, toggleRecording } = useCameraStore();

  const handleToggleRecording = (cameraId: string, cameraName: string) => {
    toggleRecording(cameraId);
    const camera = cameras.find(c => c.id === cameraId);
    toast({
      title: camera?.isRecording ? 'หยุดบันทึก' : 'เริ่มบันทึก',
      description: `${cameraName} ${camera?.isRecording ? 'หยุดบันทึกแล้ว' : 'เริ่มบันทึกแล้ว'}`,
    });
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <Header title="จัดการกล้อง" />

      <main className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-bold text-foreground">{cameras.length}</p>
            <p className="text-xs text-muted-foreground">กล้องทั้งหมด</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-bold text-success">{cameras.filter(c => c.isOnline).length}</p>
            <p className="text-xs text-muted-foreground">ออนไลน์</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-bold text-destructive">{cameras.filter(c => c.isRecording).length}</p>
            <p className="text-xs text-muted-foreground">กำลังบันทึก</p>
          </div>
        </div>

        {/* Camera List */}
        <div className="space-y-3">
          {cameras.map((camera) => (
            <div
              key={camera.id}
              className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in"
            >
              <div className="p-4 space-y-4">
                {/* Camera Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${camera.isOnline ? 'bg-success/20' : 'bg-destructive/20'}`}>
                      {camera.isOnline ? (
                        <Wifi className="w-5 h-5 text-success" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{camera.name}</h3>
                      <p className="text-xs text-muted-foreground">{camera.location}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    camera.isOnline 
                      ? 'bg-success/20 text-success' 
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {camera.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                  </span>
                </div>

                {/* Camera URL */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">URL สตรีม</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                    <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      value={camera.streamUrl}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-foreground outline-none"
                    />
                  </div>
                </div>

                {/* Recording Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    {camera.isRecording && (
                      <Circle className="w-3 h-3 fill-destructive text-destructive animate-pulse" />
                    )}
                    <span className="text-sm font-medium">
                      {camera.isRecording ? 'กำลังบันทึก' : 'หยุดบันทึก'}
                    </span>
                  </div>
                  <Switch
                    checked={camera.isRecording}
                    onCheckedChange={() => handleToggleRecording(camera.id, camera.name)}
                    disabled={!camera.isOnline}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Camera Button */}
        <button className="w-full py-4 bg-primary/20 hover:bg-primary/30 border-2 border-dashed border-primary/50 rounded-xl transition-colors">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Settings2 className="w-5 h-5" />
            <span className="font-medium">เพิ่มกล้องใหม่</span>
          </div>
        </button>
      </main>
    </div>
  );
};

export default Cameras;
