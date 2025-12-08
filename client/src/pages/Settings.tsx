import { HardDrive, Bell, Shield, Moon, Globe, Info, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const handleClearStorage = () => {
    toast({
      title: 'ล้างไฟล์เก่าสำเร็จ',
      description: 'ลบไฟล์บันทึกที่เก่ากว่า 30 วันเรียบร้อยแล้ว',
    });
  };

  const handleRestart = () => {
    toast({
      title: 'กำลังรีสตาร์ท',
      description: 'ระบบกำลังรีสตาร์ท กรุณารอสักครู่...',
    });
  };

  const settingsGroups = [
    {
      title: 'การบันทึก',
      items: [
        {
          icon: HardDrive,
          label: 'ความละเอียดบันทึก',
          value: '1080p',
          type: 'link',
        },
        {
          icon: RefreshCw,
          label: 'เก็บไฟล์บันทึก',
          value: '30 วัน',
          type: 'link',
        },
      ],
    },
    {
      title: 'การแจ้งเตือน',
      items: [
        {
          icon: Bell,
          label: 'แจ้งเตือนการเคลื่อนไหว',
          value: true,
          type: 'switch',
        },
        {
          icon: Shield,
          label: 'แจ้งเตือนกล้องออฟไลน์',
          value: true,
          type: 'switch',
        },
      ],
    },
    {
      title: 'แอปพลิเคชัน',
      items: [
        {
          icon: Moon,
          label: 'โหมดมืด',
          value: true,
          type: 'switch',
        },
        {
          icon: Globe,
          label: 'ภาษา',
          value: 'ไทย',
          type: 'link',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <Header title="ตั้งค่า" />

      <main className="p-4 space-y-6">
        {/* Storage Info */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">พื้นที่จัดเก็บ</h3>
            <span className="text-sm text-muted-foreground">2.4 / 50 GB</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[5%] gradient-primary rounded-full" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            เหลือพื้นที่อีก 47.6 GB
          </p>
        </div>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {group.title}
            </h3>
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  {item.type === 'switch' ? (
                    <Switch defaultChecked={item.value as boolean} />
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm">{item.value}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            การจัดการ
          </h3>
          <div className="space-y-2">
            <button
              onClick={handleClearStorage}
              className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-lg bg-warning/20">
                <Trash2 className="w-4 h-4 text-warning" />
              </div>
              <span className="text-sm font-medium text-foreground">ล้างไฟล์บันทึกเก่า</span>
            </button>
            <button
              onClick={handleRestart}
              className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/20">
                <RefreshCw className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">รีสตาร์ทระบบ</span>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Info className="w-4 h-4" />
            <span className="text-sm">เกี่ยวกับแอป</span>
          </div>
          <p className="text-xs text-muted-foreground">CCTV System v1.0.0</p>
        </div>
      </main>
    </div>
  );
};

export default Settings;
