import type { ScanResponse } from "@/types/product";
import type { BarcodeData } from "@/types/product";

export async function scanRecognitionPost(photo: Blob): Promise<ScanResponse> {
  const formData = new FormData();
  formData.append("photo", photo, "photo.jpeg");

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan?mode=store`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "인식 실패");
  }

  return result;
}

export async function uploadRecognitionPost(photo: Blob): Promise<ScanResponse> {
  const formData = new FormData();
  formData.append("photo", photo, "photo.jpeg");

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan?mode=upload`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "인식 실패");
  }

  return result;
}

export async function barcodeProductGet(barcode: string): Promise<BarcodeData> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/products/customer-lookup?barcode=${encodeURIComponent(barcode)}`,
    {
      method: "GET",
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "상품 조회 실패");
  }

  return result;
}
