import { create } from "zustand";
import type { ProductData } from "@/types/product";
import type { BarcodeData } from "@/types/product";

interface ScanState {
  scanResult: ProductData[] | null;
  setScanResult: (result: ProductData[] | null) => void;
  resetScanResult: () => void;

  barcodeResult: BarcodeData | null;
  setBarcodeResult: (result: BarcodeData | null) => void;
  resetBarcodeResult: () => void;

  isCaptured: boolean;
  setIsCaptured: (captured: boolean) => void;
}

export const useScanStore = create<ScanState>((set) => ({
  scanResult: null,
  setScanResult: (result) => {
    set({ scanResult: result });
  },
  resetScanResult: () => {
    set({ scanResult: null });
  },

  barcodeResult: null,
  setBarcodeResult: (result) => {
    set({ barcodeResult: result });
  },
  resetBarcodeResult: () => {
    set({ barcodeResult: null });
  },

  isCaptured: false,
  setIsCaptured: (captured) => {
    set({ isCaptured: captured });
  },
}));
