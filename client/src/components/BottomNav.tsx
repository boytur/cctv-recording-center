import { Video, History, FolderOpen, Settings, Camera } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const navItems = [
  { path: '/', icon: Video, label: 'ไลฟ์' },
  { path: '/playback', icon: History, label: 'ย้อนหลัง' },
  { path: '/recordings', icon: FolderOpen, label: 'ไฟล์บันทึก' },
  { path: '/cameras', icon: Camera, label: 'กล้อง' },
  { path: '/settings', icon: Settings, label: 'ตั้งค่า' },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around pb-[env(safe-area-inset-bottom)] max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center py-3 px-4 text-muted-foreground transition-colors hover:text-foreground"
            activeClassName="text-primary"
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary/20' : ''}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
