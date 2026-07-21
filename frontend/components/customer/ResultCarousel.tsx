import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useScanStore } from "@/store/scanStore";
import { productSharePost } from "@/service/product-share";
import { formatUsd } from "@/utils/exchange-rate";
import { getStockStatus } from "@/utils/stock-status";
import { RiShareBoxLine } from "react-icons/ri";

const ResultCarousel = ({ photoUrl }: { photoUrl?: string | null }) => {
  const { scanResult } = useScanStore();

  const handleShareClick = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const existingShareId = new URLSearchParams(window.location.search).get("shareId")?.trim();

    try {
      let shareUrl: string;

      if (existingShareId) {
        // 주소에 shareId가 없을 때만 productSharePost 호출
        shareUrl = `${baseUrl}/?shareId=${existingShareId}`;
      } else {
        if (!photoUrl || !scanResult?.length) {
          alert("공유할 스캔 결과가 없습니다.");
          return;
        }

        const photoRes = await fetch(photoUrl);
        const photo = await photoRes.blob();
        const { shareId } = await productSharePost(photo, scanResult);
        shareUrl = `${baseUrl}/?shareId=${shareId}`;
      }

      const shareData = {
        title: document.title,
        url: shareUrl,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          await navigator.clipboard.writeText(shareUrl);
          alert("링크가 복사되었습니다.");
        }
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      alert("링크가 복사되었습니다.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "공유에 실패했습니다.");
    }
  };

  const handleProductClick = () => {
    window.open(`https://www.kmecca.com/goods/goods_view.php?goodsNo=1000000288`, "_blank", "noopener,noreferrer");
  };

  return (
    <Carousel
      opts={{
        loop: true,
        align: "start",
      }}
      className="w-full p-4">
      <CarouselContent className="-ml-2">
        {scanResult?.map((item, index) => {
          const stockStatus = getStockStatus(item.currentStock);

          return (
            <CarouselItem
              key={index}
              className="basis-[94%] pl-2">
              <div
                onClick={handleProductClick}
                className="flex flex-col gap-3 rounded-md bg-white px-4 py-5">
                <div className="flex gap-2">
                  <div className="relative aspect-square h-31 w-31 shrink-0 overflow-hidden rounded-md">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized // 외부 이미지 도메인 허용
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-xs text-[#4A5565]">{item.barcode}</span>
                      <p className="truncate text-lg font-medium text-[#1E2939]">{item.name}</p>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <div className={`h-3 w-3 rounded-full ${stockStatus.dotClassName}`} />
                        <span className={`text-sm font-semibold ${stockStatus.textClassName}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-gray-600">
                          ₩{item.salePrice?.toLocaleString()}
                        </span>
                        <span className="text-gray-500">${formatUsd(item.salePrice ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // 상위 버튼 이벤트 막기
                    void handleShareClick();
                  }}
                  className="flex items-center justify-center gap-1 rounded-sm bg-[#e5e7eb] px-5 py-4">
                  <RiShareBoxLine className="text-[20px]" />
                  <span className="text-sm font-semibold">상품 공유하기</span>
                </button>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};

export default ResultCarousel;
