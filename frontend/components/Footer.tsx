"use client";

import { useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore";
import { productPost } from "@/service/staff";

const Footer = () => {
  const router = useRouter();
  const barcode = useProductStore((state) => state.barcode);
  const photos = useProductStore((state) => state.photos);
  const isCompleted = useProductStore((state) => state.isCompleted);
  const setIsCompleted = useProductStore((state) => state.setIsCompleted);

  const handleCompleteClick = async () => {
    try {
      const result = await productPost(barcode, photos);
      console.log(result);

      setIsCompleted(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <footer className="absolute right-0 bottom-0 left-0 flex flex-col gap-2 p-4">
      {!isCompleted && (
        <button
          onClick={handleCompleteClick}
          className="rounded-md bg-[#1DCAD3BF] px-5 py-4 font-semibold text-[#1E2939]">
          완료하기
        </button>
      )}

      <button
        onClick={() => {
          router.push("/admin/scan");
          setIsCompleted(false);
        }}
        className={`rounded-md px-5 py-4 font-semibold ${isCompleted ? "bg-[#1DCAD3BF] text-[#1E2939]" : "bg-[#EDEDED] text-[#8E8E93]"}`}>
        {isCompleted ? "이어서 등록하기" : "재등록하기"}
      </button>
    </footer>
  );
};

export default Footer;
