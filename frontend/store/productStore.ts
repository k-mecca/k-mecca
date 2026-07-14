import { create } from "zustand";

interface ProductState {
  barcode: string;
  setBarcode: (barcode: string) => void;

  images: string[];
  setImage: (image: string) => void;
  resetImages: () => void;

  isCompleted: boolean;
  setIsCompleted: (isCompleted: boolean) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  barcode: "",
  setBarcode: (barcode) => set({ barcode }),

  images: [],
  setImage: (image) =>
    set((state) => ({
      images: [...state.images, image],
    })),
  resetImages: () => set({ images: [] }),

  isCompleted: false,
  setIsCompleted: (isCompleted) => set({ isCompleted }),
}));
