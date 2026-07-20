import { create } from "zustand";
import type { ProductData } from "@/types/product";

interface CustomerState {
  uploadImage: File | null;
  uploadPreview: string | null;
  uploadScanning: boolean;
  uploadResult: ProductData | null;
  /** 업로드 비교용 카메라 스캔 완료 여부 — null이면 아직 미스캔 */
  uploadCompareMatch: boolean | null;
  setUploadImage: (image: File) => void;
  setUploadScanning: (scanning: boolean) => void;
  setUploadResult: (result: ProductData | null) => void;
  setUploadCompareMatch: (matched: boolean | null) => void;
  clearUploadImage: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  uploadImage: null,
  uploadPreview: null,
  uploadScanning: false,
  uploadResult: null,
  uploadCompareMatch: null,

  setUploadImage: (image) => {
    const prev = get().uploadPreview;
    if (prev) URL.revokeObjectURL(prev);
    set({
      uploadImage: image,
      uploadPreview: URL.createObjectURL(image),
      uploadScanning: true,
      uploadResult: null,
      uploadCompareMatch: null,
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
      uploadCompareMatch: null,
    });
  },
  setUploadScanning: (scanning) => {
    set({ uploadScanning: scanning });
  },
  setUploadResult: (result) => {
    set({ uploadResult: result });
  },
  setUploadCompareMatch: (matched) => {
    set({ uploadCompareMatch: matched });
  },
}));
