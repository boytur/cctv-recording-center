import { create } from 'zustand';

export interface Camera {
  id: string;
  name: string;
  location: string;
  streamUrl: string;
  isOnline: boolean;
  isRecording: boolean;
  username?: string;
  password?: string;
}

interface CameraState {
  cameras: Camera[];
  selectedCamera: Camera | null;
  setSelectedCamera: (camera: Camera | null) => void;
  toggleRecording: (cameraId: string) => Promise<void>;
  updateCameraStatus: (cameraId: string, isOnline: boolean) => void;
  fetchCameras?: () => Promise<void>;
  createCamera?: (payload: { name: string; location?: string; rtsp_url: string, username?: string, password?: string }) => Promise<Camera | null>;
  deleteCamera?: (cameraId: string) => Promise<boolean>;
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

      // Fetch active recordings to update isRecording status
      const activeRes = await fetch('/api/recordings/active');
      const activeRecordings = activeRes.ok ? (await activeRes.json()) as Array<Record<string, unknown>> : [];
      const recordingCameraIds = new Set(activeRecordings.map((r) => String(r['camera_id'] ?? '')));

      // map server model to client Camera interface without using `any`
      const cams: Camera[] = raw.map((c) => ({
        id: String(c['id'] ?? ''),
        name: String(c['name'] ?? ''),
        location: String(c['location'] ?? ''),
        streamUrl: `/api/stream/${String(c['id'] ?? '')}/hls`,
        isOnline: String(c['status'] ?? '').toLowerCase() === 'online',
        isRecording: recordingCameraIds.has(String(c['id'] ?? '')),
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
        streamUrl: `/api/stream/${String(raw['id'] ?? '')}/hls`,
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
  toggleRecording: async (cameraId) => {
    const camera = useCameraStore.getState().cameras.find((c) => c.id === cameraId);
    if (!camera) return;

    try {
      const endpoint = camera.isRecording
        ? `/api/cameras/${cameraId}/stop-recording`
        : `/api/cameras/${cameraId}/start-recording`;

      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle recording');

      // Update local state
      set((state) => ({
        cameras: state.cameras.map((cam) =>
          cam.id === cameraId ? { ...cam, isRecording: !cam.isRecording } : cam
        ),
      }));
    } catch (err) {
      console.error('Failed to toggle recording:', err);
      // Optionally revert state or show error
    }
  },
  updateCameraStatus: (cameraId, isOnline) =>
    set((state) => ({
      cameras: state.cameras.map((cam) =>
        cam.id === cameraId ? { ...cam, isOnline } : cam
      ),
    })),
  deleteCamera: async (cameraId: string) => {
    try {
      const res = await fetch(`/api/cameras/${cameraId}`, {
        method: 'DELETE',
      });
      if (!res.ok) return false;
      
      // Remove from local state
      set((state) => ({
        cameras: state.cameras.filter((cam) => cam.id !== cameraId),
      }));
      return true;
    } catch (err) {
      console.error('Failed to delete camera:', err);
      return false;
    }
  },
}));
