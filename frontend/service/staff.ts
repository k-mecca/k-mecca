export async function productGet(barcode: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/products/lookup?barcode=${encodeURIComponent(barcode)}`,
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

export async function productPost(barcode: string, photos: Blob[]) {
  const formData = new FormData();

  formData.append("barcode", barcode);

  photos.forEach((photo) => {
    formData.append("photos", photo);
  });

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "등록 실패");
  }

  return result;
}
