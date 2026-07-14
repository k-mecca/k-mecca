import { create } from "zustand";

interface ProductState {
  barcode: string;
  setBarcode: (barcode: string) => void;

  photos: File[];
  previews: string[];
  addPhoto: (photo: File) => void;
  resetPhotos: () => void;

  isCompleted: boolean;
  setIsCompleted: (isCompleted: boolean) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  barcode: "",
  setBarcode: (barcode) => set({ barcode }),

  photos: [],
  previews: [],
  addPhoto: (photo) =>
    set((state) => ({
      photos: [...state.photos, photo],
      previews: [...state.previews, URL.createObjectURL(photo)],
    })),
  resetPhotos: () =>
    set((state) => {
      state.previews.forEach((url) => URL.revokeObjectURL(url));
      return { photos: [], previews: [] };
    }),

  isCompleted: false,
  setIsCompleted: (isCompleted) => set({ isCompleted }),
}));
