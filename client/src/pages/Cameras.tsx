import { Wifi, WifiOff, Circle, Video, Settings2, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import { useCameraStore } from '@/store/cameraStore';
import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import AddCameraSheet from '@/components/AddCameraSheet';
import VideoPlayer from '@/components/VideoPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Cameras = () => {
  const { cameras, toggleRecording, fetchCameras, deleteCamera } = useCameraStore();

  useEffect(() => {
    // load camera list from API when page mounts
    if (fetchCameras) fetchCameras();
  }, [fetchCameras]);

  const handleToggleRecording = async (cameraId: string, cameraName: string) => {
    const camera = cameras.find(c => c.id === cameraId);
    const isCurrentlyRecording = camera?.isRecording;
    
    try {
      await toggleRecording(cameraId);
      toast({
        title: isCurrentlyRecording ? 'หยุดบันทึก' : 'เริ่มบันทึก',
        description: `${cameraName} ${isCurrentlyRecording ? 'หยุดบันทึกแล้ว' : 'เริ่มบันทึกแล้ว'}`,
      });
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถ${isCurrentlyRecording ? 'หยุด' : 'เริ่ม'}บันทึก ${cameraName}`,
        variant: 'destructive',
      });
    }
  };

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamOpen, setStreamOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<{ id: string; name: string } | null>(null);

  const openStream = async (cameraId: string, cameraName: string) => {
    try {
      // request HLS stream; server will start ffmpeg if needed and return HLS URL
      const res = await fetch(`/api/stream/${encodeURIComponent(cameraId)}/hls`);
      if (!res.ok && res.status !== 202) throw new Error('no stream');
      const data = await res.json();
      const url = String(data['url'] ?? '');
      const ready = Boolean(data['ready'] ?? (res.status === 200));
      if (!url) throw new Error('no url');

      // If not ready, poll the playlist URL until it exists (or timeout)
      const checkPlaylist = async (playlistUrl: string, timeoutMs = 10000) => {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          try {
            const r = await fetch(playlistUrl, { method: 'HEAD' });
            if (r.ok) return true;
          } catch (e) {
            // ignore
          }
          await new Promise((res) => setTimeout(res, 500));
        }
        return false;
      };

      if (ready) {
        setStreamUrl(url);
        setStreamOpen(true);
        return;
      }

      const ok = await checkPlaylist(url, 10000);
      if (ok) {
        setStreamUrl(url);
        setStreamOpen(true);
        return;
      }

      toast({ title: 'สตรีมยังไม่พร้อม', description: `กล้อง ${cameraName} ยังกำลังเตรียมสตรีม` });
    } catch (err) {
      toast({ title: 'ไม่สามารถเปิดสตรีม', description: `กล้อง ${cameraName} ไม่พร้อมใช้งาน` });
    }
  };

  const confirmDelete = (cameraId: string, cameraName: string) => {
    setCameraToDelete({ id: cameraId, name: cameraName });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!cameraToDelete || !deleteCamera) return;
    
    try {
      const success = await deleteCamera(cameraToDelete.id);
      if (success) {
        toast({
          title: 'ลบกล้องสำเร็จ',
          description: `ลบ ${cameraToDelete.name} แล้ว`,
        });
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถลบ ${cameraToDelete.name}`,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCameraToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <Header title="จัดการกล้อง" />

      <main className="p-4 space-y-4">
        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
          <Circle className="w-4 h-4 text-primary mt-0.5 fill-primary animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">บันทึกอัตโนมัติเปิดใช้งาน</p>
            <p className="text-xs text-primary/80 mt-0.5">
              กล้องที่ออนไลน์จะบันทึกอัตโนมัติ แยกรายวัน
            </p>
          </div>
        </div>

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
          {cameras.slice().sort((a, b) => Number(b.isOnline) - Number(a.isOnline)).map((camera) => (
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
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      camera.isOnline 
                        ? 'bg-success/20 text-success' 
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {camera.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => confirmDelete(camera.id, camera.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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

                {/* Recording Status */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    {camera.isRecording && (
                      <Circle className="w-3 h-3 fill-destructive text-destructive animate-pulse" />
                    )}
                    <div>
                      <span className="text-sm font-medium">
                        {camera.isRecording ? 'กำลังบันทึก (อัตโนมัติ)' : camera.isOnline ? 'พร้อมบันทึก' : 'ออฟไลน์'}
                      </span>
                      {camera.isOnline && (
                        <p className="text-xs text-muted-foreground">บันทึกอัตโนมัติเมื่อออนไลน์</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openStream(camera.id, camera.name)} disabled={!camera.isOnline}>
                      ดูภาพสด
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Camera */}
        <div className="space-y-3">
          <AddCameraSheet />
        </div>
      </main>

      <Dialog open={streamOpen} onOpenChange={setStreamOpen}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>สตรีมสด</DialogTitle>
          </DialogHeader>
          {streamUrl ? (
            <VideoPlayer src={streamUrl} isLive />
          ) : (
            <p className="text-sm text-muted-foreground">ไม่พบสตรีม</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบกล้อง</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบกล้อง <strong>{cameraToDelete?.name}</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              ลบกล้อง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cameras;
