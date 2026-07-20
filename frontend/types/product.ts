export type ProductData = {
  barcode: string;
  name: string;
  salePrice?: number | null;
  currentStock?: number | null;
  imageUrl?: string | null;
  score?: number;
};

export type ScanResponse = {
  isConfident: boolean;
  candidates: ProductData[];
  guidance?: {
    type: string;
    message: string;
  };
};

export type BarcodeData = {
  registered: boolean;
  product?: {
    barcode: string;
    name: string;
    salePrice?: number | null;
    currentStock?: number | null;
    imageUrl?: string | null;
  };
};
