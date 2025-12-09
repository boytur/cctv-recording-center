import Header from '@/components/Header';
import CameraCard from '@/components/CameraCard';
import { useCameraStore } from '@/store/cameraStore';
import { useEffect } from 'react';

const Live = () => {
  const { cameras, fetchCameras } = useCameraStore();

  useEffect(() => {
    if (fetchCameras) fetchCameras();
    const t = setInterval(() => {
      if (fetchCameras) fetchCameras();
    }, 5000);
    return () => clearInterval(t);
  }, [fetchCameras]);
  const onlineCameras = cameras.filter(cam => cam.isOnline);
  const offlineCameras = cameras.filter(cam => !cam.isOnline);

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <Header title="ดูภาพสด" />
      
      <main className="p-4 space-y-4">
        {/* Status summary */}
        <div className="flex gap-3">
          <div className="flex-1 bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <span className="text-2xl font-bold text-success">{onlineCameras.length}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">ออนไลน์</p>
                <p className="text-xs text-muted-foreground">กล้องที่ใช้งานได้</p>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <span className="text-2xl font-bold text-destructive">{offlineCameras.length}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">ออฟไลน์</p>
                <p className="text-xs text-muted-foreground">ไม่มีสัญญาณ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Camera list */}
        <div className="space-y-4">
          {cameras.slice().sort((a, b) => Number(b.isOnline) - Number(a.isOnline)).map((camera) => (
            <CameraCard key={camera.id} camera={camera} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Live;
