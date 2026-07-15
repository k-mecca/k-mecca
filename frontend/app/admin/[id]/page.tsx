"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import ProductInfo from "@/components/ProductInfo";
import Footer from "@/components/Footer";
import { useProductStore } from "@/store/productStore";

const RecognitionPage = () => {
  const router = useRouter();
  const barcode = useProductStore((state) => state.barcode);
  const photos = useProductStore((state) => state.photos);
  const isCompleted = useProductStore((state) => state.isCompleted);

  useEffect(() => {
    if (photos.length === 0) {
      router.push("/admin/scan");
    }
  }, [photos, router]);

  if (photos.length === 0) return null;

  return (
    <div className="relative h-full w-full">
      <Header className="text-black" />

      {isCompleted ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 text-xl font-medium text-[#1E2939]">
          <Image
            src="/images/check-circle.png"
            alt="check"
            width={64}
            height={64}
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <p>{barcode}</p>
            <p>등록이 완료되었습니다</p>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-center gap-20 p-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-xl font-medium">인식이 완료되었습니다</p>
            <p>등록할 상품 정보를 확인해주세요</p>
          </div>

          <ProductInfo />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default RecognitionPage;
