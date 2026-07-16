import { create } from "zustand";
import type { ProductData } from "@/types/product";

interface ScanState {
  scanResult: ProductData[] | null;
  setScanResult: (result: ProductData[] | null) => void;
  resetScanResult: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  scanResult: null,
  setScanResult: (result) => {
    set({ scanResult: result });
  },
  resetScanResult: () => {
    set({ scanResult: null });
  },
}));
