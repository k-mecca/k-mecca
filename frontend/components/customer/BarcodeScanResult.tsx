import Image from "next/image";
import { useScanStore } from "@/store/scanStore";
import { RiShareBoxLine } from "react-icons/ri";

const BarcodeScanResult = () => {
  const { barcodeResult } = useScanStore();

  const handleProductClick = () => {
    window.open(`https://www.kmecca.com/goods/goods_view.php?goodsNo=1000000288`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 rounded-md bg-white px-4 py-5">
        <div className="flex gap-2">
          <div className="relative aspect-square h-[124px] w-[124px] shrink-0 rounded-md border">
            {/* {barcodeResult?.product?.imageUrl && (
              <Image
                src={barcodeResult.product.imageUrl}
                alt={barcodeResult.product.name}
                fill
                unoptimized // 외부 이미지 도메인 허용
              />
            )} */}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs text-[#4A5565]">{barcodeResult?.product?.barcode}</span>
              <p className="truncate text-lg font-medium text-[#1E2939]">{barcodeResult?.product?.name}</p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <div className="bg-kmecca h-3 w-3 rounded-full" />
                <span className="text-kmecca text-sm font-semibold">구매 가능</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-semibold text-gray-600">₩00</span>
                <span className="text-gray-500">$00</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleProductClick()}
          className="bg-kmecca flex items-center justify-center gap-1 rounded-sm px-5 py-4">
          <RiShareBoxLine className="text-[20px]" />
          <span className="text-sm font-semibold">상품 공유하기</span>
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanResult;
