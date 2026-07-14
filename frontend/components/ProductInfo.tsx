"use client";

import Image from "next/image";
import { useProductStore } from "@/store/productStore";

const ProductInfo = () => {
  const barcode = useProductStore((state) => state.barcode);
  const previews = useProductStore((state) => state.previews);

  if (!previews.length) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between font-medium">
        <span className="text-[#3C3C43]/60">바코드 번호</span>
        <span>{barcode}</span>
      </div>

      <div className="border-t border-[#E5E5EA]"></div>

      <div className="flex w-full gap-2">
        {previews.map((src, index) => (
          <div
            key={src}
            className="relative aspect-square w-full">
            <Image
              src={src}
              alt={`product-${index + 1}`}
              fill
              unoptimized
              className="rounded-sm object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductInfo;
