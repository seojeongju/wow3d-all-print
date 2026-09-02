import { create } from 'zustand';

/** Hero → /quote 사진 업로드 핸드오프 (SPA 네비게이션용) */
interface PhotoHandoffState {
    pendingPhoto: File | null;
    setPendingPhoto: (file: File | null) => void;
    consumePendingPhoto: () => File | null;
}

export const usePhotoHandoffStore = create<PhotoHandoffState>((set, get) => ({
    pendingPhoto: null,
    setPendingPhoto: (file) => set({ pendingPhoto: file }),
    consumePendingPhoto: () => {
        const photo = get().pendingPhoto;
        set({ pendingPhoto: null });
        return photo;
    },
}));
