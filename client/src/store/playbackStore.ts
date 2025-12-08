import { create } from 'zustand';

export interface RecordingSegment {
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  hasRecording: boolean;
}

export interface RecordingFile {
  id: string;
  cameraId: string;
  cameraName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  thumbnailUrl: string;
  fileSize: string;
}

interface PlaybackState {
  selectedDate: Date;
  selectedCameraId: string;
  currentTime: number; // in seconds from midnight
  isPlaying: boolean;
  playbackSpeed: number;
  recordings: RecordingFile[];
  timelineSegments: RecordingSegment[];
  fetchRecordings?: (cameraId: string, date: Date) => Promise<void>;
  fetchTimeline?: (cameraId: string, date: Date) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setSelectedCameraId: (cameraId: string) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  seekTo: (time: number) => void;
  skipForward: (seconds: number) => void;
  skipBackward: (seconds: number) => void;
}

// Mock data for timeline
const generateMockTimeline = (): RecordingSegment[] => {
  const segments: RecordingSegment[] = [];
  for (let hour = 0; hour < 24; hour++) {
    // Random recording availability
    const hasRecording = Math.random() > 0.3;
    segments.push({
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${hour.toString().padStart(2, '0')}:59`,
      duration: 60,
      hasRecording,
    });
  }
  return segments;
};

// Mock recording files
const generateMockRecordings = (): RecordingFile[] => {
  const cameras = [
    { id: 'cam1', name: 'กล้องหน้าบ้าน' },
    { id: 'cam2', name: 'กล้องหลังบ้าน' },
    { id: 'cam3', name: 'กล้องโรงรถ' },
    { id: 'cam4', name: 'กล้องห้องนั่งเล่น' },
  ];

  const recordings: RecordingFile[] = [];
  const now = new Date();

  cameras.forEach((cam) => {
    for (let i = 0; i < 5; i++) {
      const startTime = new Date(now.getTime() - (i + 1) * 3600000);
      const duration = Math.floor(Math.random() * 3600) + 600; // 10 min to 1 hour
      recordings.push({
        id: `${cam.id}-${i}`,
        cameraId: cam.id,
        cameraName: cam.name,
        startTime,
        endTime: new Date(startTime.getTime() + duration * 1000),
        duration,
        thumbnailUrl: '/placeholder.svg',
        fileSize: `${Math.floor(Math.random() * 500) + 50} MB`,
      });
    }
  });

  return recordings.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

export const usePlaybackStore = create<PlaybackState>((set) => ({
  selectedDate: new Date(),
  selectedCameraId: 'cam1',
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  recordings: [],
  timelineSegments: [],
  fetchRecordings: async (cameraId: string, date: Date) => {
    try {
      const d = date.toISOString().slice(0, 10);
      const res = await fetch(`/api/recordings?cameraId=${encodeURIComponent(cameraId)}&date=${d}`);
      if (!res.ok) throw new Error('no recordings');
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      const recs: RecordingFile[] = raw.map((r) => ({
        id: String(r['id'] ?? ''),
        cameraId: String(r['cameraId'] ?? r['camera_id'] ?? ''),
        cameraName: String(r['cameraName'] ?? r['camera_name'] ?? ''),
        startTime: new Date(String(r['startTime'] ?? r['start_time'] ?? new Date().toISOString())),
        endTime: new Date(String(r['endTime'] ?? r['end_time'] ?? new Date().toISOString())),
        duration: Number(r['duration'] ?? 0),
        thumbnailUrl: String(r['thumbnailUrl'] ?? r['thumbnail_url'] ?? '/placeholder.svg'),
        fileSize: String(r['fileSize'] ?? r['file_size'] ?? ''),
      }));
      set({ recordings: recs });
    } catch (err) {
      // fallback to mock
      set({ recordings: generateMockRecordings() });
    }
  },
  fetchTimeline: async (cameraId: string, date: Date) => {
    try {
      const d = date.toISOString().slice(0, 10);
      const res = await fetch(`/api/timeline?cameraId=${encodeURIComponent(cameraId)}&date=${d}`);
      if (!res.ok) throw new Error('no timeline');
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      const segs: RecordingSegment[] = raw.map((s) => ({
        startTime: String(s['startTime'] ?? s['start_time'] ?? ''),
        endTime: String(s['endTime'] ?? s['end_time'] ?? ''),
        duration: Number(s['duration'] ?? 0),
        hasRecording: Boolean(s['hasRecording'] ?? s['has_recording'] ?? false),
      }));
      set({ timelineSegments: segs });
    } catch (err) {
      // fallback to generated mock timeline
      set({ timelineSegments: generateMockTimeline() });
    }
  },
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedCameraId: (cameraId) => set({ selectedCameraId: cameraId }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  seekTo: (time) => set({ currentTime: time, isPlaying: true }),
  skipForward: (seconds) =>
    set((state) => ({ currentTime: Math.min(state.currentTime + seconds, 86400) })),
  skipBackward: (seconds) =>
    set((state) => ({ currentTime: Math.max(state.currentTime - seconds, 0) })),
}));
