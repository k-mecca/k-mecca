import { RiShareBoxLine } from "react-icons/ri";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useScanStore } from "@/store/scanStore";

const ResultCarousel = () => {
  const { scanResult } = useScanStore();

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
        {scanResult?.map((item, index) => (
          <CarouselItem
            key={index}
            className="basis-[94%] pl-2">
            <div className="flex flex-col gap-3 rounded-md bg-white px-4 py-5">
              <div className="flex gap-2">
                <div className="h-[124px] w-[124px] shrink-0 rounded-md bg-red-100" />

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-xs text-[#4A5565]">{item.barcode}</span>
                    <p className="truncate text-lg font-medium text-[#1E2939]">{item.name}</p>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <div className="bg-kmecca h-3 w-3 rounded-full" />
                      <span className="text-kmecca text-sm font-semibold">구매 가능</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-semibold text-gray-600">₩{item.salePrice?.toLocaleString()}</span>
                      <span className="text-gray-500">$34.87</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleProductClick()}
                className="bg-kmecca flex items-center justify-center gap-2 rounded-sm px-5 py-4">
                <RiShareBoxLine className="text-[20px]" />
                <span className="text-sm font-semibold">상품 공유하기</span>
              </button>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default ResultCarousel;
