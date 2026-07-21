"use client";

import Image from "next/image";
import ScanOverlay from "./ScanOverlay";
import { useCustomerStore } from "@/store/customerStore";
import { getStockStatus } from "@/utils/stock-status";

const UploadRecognition = () => {
  const uploadPreview = useCustomerStore((state) => state.uploadPreview);
  const uploadScanning = useCustomerStore((state) => state.uploadScanning);
  const uploadResult = useCustomerStore((state) => state.uploadResult);

  if (!uploadPreview) return null;
  const showResult = uploadResult !== null && !uploadScanning;
  const stockStatus = getStockStatus(uploadResult?.currentStock);

  const handleProductClick = () => {
    if (uploadResult?.onlineUrl) {
      window.open(uploadResult.onlineUrl, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(`https://www.kmecca.com/goods/goods_list.php?cateCd=012004`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex gap-2 px-4">
      <div className="relative aspect-square h-23 w-23 shrink-0 overflow-hidden rounded-md border border-[#F9FAFB] bg-white shadow-sm">
        <Image
          src={uploadPreview}
          alt="upload-preview"
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      <div
        onClick={handleProductClick}
        className="relative flex min-w-0 flex-1 gap-2 overflow-hidden rounded-md bg-white p-2.5 shadow-sm">
        {showResult && uploadResult ? (
          <>
            <div className="relative aspect-square shrink-0 overflow-hidden rounded-md bg-[#E5E7EB] shadow-sm">
              {uploadResult.imageUrl && (
                <Image
                  src={uploadResult.imageUrl}
                  alt={uploadResult.name}
                  fill
                  unoptimized // 외부 이미지 도메인 허용
                  className="object-cover"
                />
              )}
            </div>
            <div className="relative z-10 flex min-w-0 flex-1 flex-col">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs text-[#4A5565]">{uploadResult.barcode}</span>
                <p className="truncate text-lg font-medium text-[#1E2939]">{uploadResult.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <div className={`h-3 w-3 rounded-full ${stockStatus.dotClassName}`} />
                <span className={`text-sm font-semibold ${stockStatus.textClassName}`}>{stockStatus.label}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="aspect-square w-18 shrink-0 rounded-md bg-[#E5E7EB] shadow-sm" />
            <div className="relative z-10 flex w-full items-center justify-center">
              <p className="font-semibold text-[#4A5565]">Searching</p>
            </div>
            {uploadScanning && (
              <div className="pointer-events-none absolute inset-0 z-20">
                <ScanOverlay />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadRecognition;
