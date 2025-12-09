import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCameraStore } from '@/store/cameraStore';
import { toast } from '@/hooks/use-toast';

const AddCameraSheet: React.FC = () => {
  const createCamera = useCameraStore((s) => s.createCamera);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rtsp, setRtsp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !rtsp.trim()) {
      toast({ title: 'กรอกข้อมูลไม่ครบ', description: 'ต้องระบุชื่อ และ RTSP URL' });
      return;
    }
    if (!createCamera) return;
    setLoading(true);
    const cam = await createCamera({ 
      name: name.trim(), 
      location: location.trim(), 
      rtsp_url: rtsp.trim(),
      username: username.trim(),
      password: password.trim()
    });
    setLoading(false);
    if (!cam) {
      toast({ title: 'ผิดพลาด', description: 'ไม่สามารถเพิ่มกล้องได้' });
      return;
    }
    toast({ title: 'เพิ่มกล้องแล้ว', description: `${cam.name}` });
    setOpen(false);
    setName('');
    setLocation('');
    setRtsp('');
    setUsername('');
    setPassword('');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full py-4 bg-primary/20 hover:bg-primary/30 border-2 border-dashed border-primary/50 rounded-xl transition-colors">
          <span className="font-medium">เพิ่มกล้องใหม่</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>เพิ่มกล้องใหม่</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>ชื่อ</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>ตำแหน่ง</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <Label>RTSP URL</Label>
            <Input value={rtsp} onChange={(e) => setRtsp(e.target.value)} placeholder="rtsp://192.168.1.110/Streaming/Channels/102" />
          </div>
          <div>
            <Label>Username (ถ้ามี)</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </div>
          <div>
            <Label>Password (ถ้ามี)</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
          </div>
        </div>

        <SheetFooter>
          <div className="flex gap-2">
            <SheetClose asChild>
              <Button variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button>
            </SheetClose>
            <Button onClick={submit} disabled={loading}>{loading ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AddCameraSheet;
