"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";

export type ScanHistoryItem = {
  id: string;
  url: string;
};

type ScanHistoryProps = {
  items: ScanHistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
};

const ScanHistory = ({ items, selectedId, onSelect, onRemove }: ScanHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstItemId = items[0]?.id;

  // 새 이미지가 앞에 추가되면 스크롤을 맨 앞으로
  useEffect(() => {
    if (!firstItemId || !scrollRef.current) return;
    scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
  }, [firstItemId]);

  if (items.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="pointer-events-auto absolute top-20 left-4 z-10 flex w-[calc(100%-2rem)] touch-pan-x snap-x snap-mandatory scrollbar-none gap-4 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, index) => {
        const isSelected = item.id === selectedId;

        return (
          <div
            key={item.id}
            className="relative size-[78px] shrink-0 snap-start p-1">
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`relative size-[70px] overflow-hidden rounded-md border shadow-sm ${
                isSelected ? "border-kmecca border-3" : "border-[#F9FAFB]"
              }`}>
              <Image
                src={item.url}
                alt={`capture-image-${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="absolute top-0 right-0 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#F9FAFB]/75 shadow-sm">
              <IoClose className="h-[18px] w-[18px] drop-shadow-sm" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ScanHistory;
