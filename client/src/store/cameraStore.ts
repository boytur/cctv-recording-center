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
}

export const useCameraStore = create<CameraState>((set) => ({
  cameras: [
    {
      id: 'cam1',
      name: 'กล้องหน้าบ้าน',
      location: 'ประตูหน้า',
      streamUrl: '/api/stream/cam1',
      isOnline: true,
      isRecording: true,
    },
    {
      id: 'cam2',
      name: 'กล้องหลังบ้าน',
      location: 'สวนหลังบ้าน',
      streamUrl: '/api/stream/cam2',
      isOnline: true,
      isRecording: true,
    },
    {
      id: 'cam3',
      name: 'กล้องโรงรถ',
      location: 'ที่จอดรถ',
      streamUrl: '/api/stream/cam3',
      isOnline: false,
      isRecording: false,
    },
    {
      id: 'cam4',
      name: 'กล้องห้องนั่งเล่น',
      location: 'ภายในบ้าน',
      streamUrl: '/api/stream/cam4',
      isOnline: true,
      isRecording: true,
    },
  ],
  selectedCamera: null,
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
