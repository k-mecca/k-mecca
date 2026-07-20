import { create } from "zustand";

interface FooterState {
  buttonValue: "product" | "search" | "barcode";
  setButtonValue: (button: "product" | "search" | "barcode") => void;
}

export const useFooterStore = create<FooterState>((set) => ({
  buttonValue: "search",
  setButtonValue: (button) => {
    set({ buttonValue: button });
  },
}));
