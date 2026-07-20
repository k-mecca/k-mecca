import { create } from "zustand";
import type { ProductData } from "@/types/product";

interface CustomerState {
  uploadImage: File | null;
  uploadPreview: string | null;
  uploadScanning: boolean;
  uploadResult: ProductData | null;
  setUploadImage: (image: File) => void;
  setUploadScanning: (scanning: boolean) => void;
  setUploadResult: (result: ProductData | null) => void;
  clearUploadImage: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  uploadImage: null,
  uploadPreview: null,
  uploadScanning: false,
  uploadResult: null,

  setUploadImage: (image) => {
    const prev = get().uploadPreview;
    if (prev) URL.revokeObjectURL(prev);
    set({
      uploadImage: image,
      uploadPreview: URL.createObjectURL(image),
      uploadScanning: true,
      uploadResult: null,
    });
  },
  clearUploadImage: () => {
    const prev = get().uploadPreview;
    if (prev) URL.revokeObjectURL(prev);
    set({
      uploadImage: null,
      uploadPreview: null,
      uploadScanning: false,
      uploadResult: null,
    });
  },
  setUploadScanning: (scanning) => {
    set({ uploadScanning: scanning });
  },
  setUploadResult: (result) => {
    set({ uploadResult: result });
  },
}));
