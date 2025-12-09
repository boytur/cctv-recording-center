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
  url?: string; // Add url field
}

export interface PlaybackVideo {
  url: string;
  startTime: Date;
  filename: string;
}

interface PlaybackState {
  selectedDate: Date;
  selectedCameraId: string;
  currentTime: number; // in seconds from midnight
  isPlaying: boolean;
  playbackSpeed: number;
  recordings: RecordingFile[];
  playbackVideos: PlaybackVideo[];
  timelineSegments: RecordingSegment[];
  fetchRecordings?: (cameraId: string, date: Date) => Promise<void>;
  fetchPlaybackVideos?: (cameraId: string, date: Date) => Promise<void>;
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

export const usePlaybackStore = create<PlaybackState>((set) => ({
  selectedDate: new Date(),
  selectedCameraId: '',
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  recordings: [],
  playbackVideos: [],
  timelineSegments: [],
  fetchRecordings: async (cameraId: string, date: Date) => {
    try {
      const d = date.toISOString().slice(0, 10);
      const res = await fetch(`/api/recordings?cameraId=${encodeURIComponent(cameraId)}&date=${d}`);
      if (!res.ok) {
        console.error('Failed to fetch recordings:', res.status);
        set({ recordings: [] });
        return;
      }
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      console.log('Fetched recordings:', raw);
      
      const recs: RecordingFile[] = raw.map((r) => ({
        id: String(r['id'] ?? ''),
        cameraId: String(r['cameraId'] ?? r['camera_id'] ?? cameraId),
        cameraName: String(r['cameraName'] ?? r['camera_name'] ?? cameraId),
        startTime: new Date(String(r['startTime'] ?? r['start_time'] ?? new Date().toISOString())),
        endTime: new Date(String(r['endTime'] ?? r['end_time'] ?? new Date().toISOString())),
        duration: Number(r['duration'] ?? 0),
        thumbnailUrl: String(r['thumbnailUrl'] ?? r['thumbnail_url'] ?? '/placeholder.svg'),
        fileSize: String(r['fileSize'] ?? r['file_size'] ?? ''),
      }));
      
      // Add url property
      const recsWithUrl = recs.map(r => ({
        ...r,
        url: String((raw.find(x => String(x['id']) === r.id) || {})['url'] ?? ''),
      }));
      
      console.log('Processed recordings:', recsWithUrl);
      set({ recordings: recsWithUrl });
    } catch (err) {
      console.error('Error fetching recordings:', err);
      set({ recordings: [] });
    }
  },
  fetchPlaybackVideos: async (cameraId: string, date: Date) => {
    try {
      const d = date.toISOString().slice(0, 10);
      const res = await fetch(`/api/playback/video?cameraId=${encodeURIComponent(cameraId)}&date=${d}`);
      if (!res.ok) {
        console.error('Failed to fetch playback videos:', res.status);
        set({ playbackVideos: [] });
        return;
      }
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      const videos: PlaybackVideo[] = raw.map((v) => ({
        url: String(v['url'] ?? ''),
        startTime: new Date(String(v['startTime'] ?? new Date().toISOString())),
        filename: String(v['filename'] ?? ''),
      }));
      set({ playbackVideos: videos });
    } catch (err) {
      console.error('Error fetching playback videos:', err);
      set({ playbackVideos: [] });
    }
  },
  fetchTimeline: async (cameraId: string, date: Date) => {
    try {
      const d = date.toISOString().slice(0, 10);
      const res = await fetch(`/api/timeline?cameraId=${encodeURIComponent(cameraId)}&date=${d}`);
      if (!res.ok) {
        console.error('Failed to fetch timeline:', res.status);
        set({ timelineSegments: [] });
        return;
      }
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      const segs: RecordingSegment[] = raw.map((s) => ({
        startTime: String(s['startTime'] ?? s['start_time'] ?? ''),
        endTime: String(s['endTime'] ?? s['end_time'] ?? ''),
        duration: Number(s['duration'] ?? 0),
        hasRecording: Boolean(s['hasRecording'] ?? s['has_recording'] ?? false),
      }));
      set({ timelineSegments: segs });
    } catch (err) {
      console.error('Error fetching timeline:', err);
      set({ timelineSegments: [] });
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
