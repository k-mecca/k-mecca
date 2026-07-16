import type { ScanResponse } from "@/types/product";

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
