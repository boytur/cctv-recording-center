import { create } from 'zustand';

export interface Camera {
  id: string;
  name: string;
  location: string;
  streamUrl: string;
  isOnline: boolean;
  isRecording: boolean;
}

interface CameraState {
  cameras: Camera[];
  selectedCamera: Camera | null;
  setSelectedCamera: (camera: Camera | null) => void;
  toggleRecording: (cameraId: string) => void;
  updateCameraStatus: (cameraId: string, isOnline: boolean) => void;
  fetchCameras?: () => Promise<void>;
  createCamera?: (payload: { name: string; location?: string; rtsp_url: string }) => Promise<Camera | null>;
}

export const useCameraStore = create<CameraState>((set) => ({
  cameras: [],
  selectedCamera: null,
  // fetch cameras from backend API and populate the store
  fetchCameras: async () => {
    try {
      const res = await fetch('/api/cameras');
      if (!res.ok) throw new Error('failed to fetch cameras');
      const raw = (await res.json()) as Array<Record<string, unknown>>;
      // map server model to client Camera interface without using `any`
      const cams: Camera[] = raw.map((c) => ({
        id: String(c['id'] ?? ''),
        name: String(c['name'] ?? ''),
        location: String(c['location'] ?? ''),
        streamUrl: `/api/stream/${String(c['id'] ?? '')}`,
        isOnline: String(c['status'] ?? '').toLowerCase() === 'online',
        isRecording: false,
      }));
      set({ cameras: cams });
    } catch (err) {
      // leave cameras empty on error; consumer can handle empty state
      // optionally log to console for debugging
      // console.error('fetchCameras error', err);
    }
  },
  createCamera: async (payload: { name: string; location?: string; rtsp_url: string }) => {
    try {
      const res = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const raw = (await res.json()) as Record<string, unknown>;
      const cam: Camera = {
        id: String(raw['id'] ?? ''),
        name: String(raw['name'] ?? payload.name),
        location: String(raw['location'] ?? payload.location ?? ''),
        streamUrl: `/api/stream/${String(raw['id'] ?? '')}`,
        isOnline: String(raw['status'] ?? '').toLowerCase() === 'online',
        isRecording: false,
      };
      set((state) => ({ cameras: [...state.cameras, cam] }));
      return cam;
    } catch (err) {
      return null;
    }
  },
  setSelectedCamera: (camera) => set({ selectedCamera: camera }),
  toggleRecording: (cameraId) =>
    set((state) => ({
      cameras: state.cameras.map((cam) =>
        cam.id === cameraId ? { ...cam, isRecording: !cam.isRecording } : cam
      ),
    })),
  updateCameraStatus: (cameraId, isOnline) =>
    set((state) => ({
      cameras: state.cameras.map((cam) =>
        cam.id === cameraId ? { ...cam, isOnline } : cam
      ),
    })),
}));
