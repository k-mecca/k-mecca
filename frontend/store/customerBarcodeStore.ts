import { create } from "zustand";

interface CustomerBarcodeState {
  customerBarcode: string;
  setCustomerBarcode: (barcode: string) => void;
}

export const useCustomerBarcodeStore = create<CustomerBarcodeState>((set) => ({
  customerBarcode: "",
  setCustomerBarcode: (barcode: string) => {
    set({ customerBarcode: barcode });
  },
}));
