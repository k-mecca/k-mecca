import { ProductData } from "@/types/product";

export type ProductShareData = {
  queryImageUrl: string;
  candidates: ProductData[];
  createdAt: string;
};

export async function productSharePost(photo: Blob, candidates: ProductData[]) {
  const formData = new FormData();
  formData.append("photo", photo, "photo.jpeg");
  formData.append("candidates", JSON.stringify(candidates));

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan/share`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "공유 실패");
  }

  return result as { shareId: string };
}

export async function productShareGet(shareId: string): Promise<ProductShareData> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan/share/${shareId}`, {
    method: "GET",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "상품 조회 실패");
  }

  return result;
}
