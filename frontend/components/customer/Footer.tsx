"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiImagesSquareFill } from "react-icons/pi";
import { IoSearch } from "react-icons/io5";
import { FaBarcode } from "react-icons/fa6";
import { uploadRecognitionPost } from "@/service/customer";
import { useCustomerStore } from "@/store/customerStore";
import { useFooterStore } from "@/store/footerStore";

function Footer() {
  const [tab, setTab] = useState("search");
  const inputRef = useRef<HTMLInputElement>(null);
  const setUploadImage = useCustomerStore((state) => state.setUploadImage);
  const setUploadScanning = useCustomerStore((state) => state.setUploadScanning);
  const setUploadResult = useCustomerStore((state) => state.setUploadResult);
  const setButtonValue = useFooterStore((state) => state.setButtonValue);

  const handleUploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    e.target.value = "";
    if (!image) return;

    setUploadImage(image);
    setTimeout(() => setUploadScanning(false), 2700);

    try {
      const res = await uploadRecognitionPost(image);
      setUploadResult(res.candidates[0] ?? null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative z-10 flex shrink-0 items-center justify-center p-4 pb-10">
      <input
        ref={inputRef}
        id="image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleUploadChange}
      />

      <Tabs
        value={tab}
        onValueChange={setTab}>
        <TabsList className="relative inline-grid h-14 grid-cols-3 rounded-full bg-[#6A7282]/75 p-1.5 shadow-sm">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-full bg-[#E5E7EB] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              transform: `translateX(${tab === "search" ? "100%" : tab === "barcode" ? "200%" : "0%"})`,
            }}
          />

          <TabsTrigger
            value="product"
            onClick={() => {
              inputRef.current?.click();
              setButtonValue("product");
            }}
            className="relative z-10 h-full w-full rounded-full bg-transparent px-5 font-medium text-[#99A1AF] shadow-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-transparent data-active:bg-transparent data-active:text-[#1E2939] data-active:shadow-none dark:data-active:bg-transparent">
            <PiImagesSquareFill className="size-6" />
          </TabsTrigger>

          <TabsTrigger
            value="search"
            onClick={() => setButtonValue("search")}
            className="relative z-10 h-full w-full rounded-full bg-transparent px-5 font-medium text-[#99A1AF] shadow-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-transparent data-active:bg-transparent data-active:text-[#1E2939] data-active:shadow-none dark:data-active:bg-transparent">
            <IoSearch className="size-6" />
          </TabsTrigger>

          <TabsTrigger
            value="barcode"
            onClick={() => setButtonValue("barcode")}
            className="relative z-10 h-full w-full rounded-full bg-transparent px-5 font-medium text-[#99A1AF] shadow-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-transparent data-active:bg-transparent data-active:text-[#1E2939] data-active:shadow-none dark:data-active:bg-transparent">
            <FaBarcode className="size-6" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export default Footer;
