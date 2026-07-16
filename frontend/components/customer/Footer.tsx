"use client";

import { useState, type ChangeEvent } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiImagesSquareFill } from "react-icons/pi";
import { uploadRecognition } from "@/service/customer";

function Footer() {
  const [tab, setTab] = useState("product");

  const handleUploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    e.target.value = "";
    if (!image) return;

    try {
      await uploadRecognition(image);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 p-10">
      <input
        id="image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleUploadChange}
      />
      <label
        htmlFor="image-upload"
        className="flex h-13 w-13 cursor-pointer items-center justify-center rounded-full bg-[#E5E7EB] shadow-sm">
        <PiImagesSquareFill className="text-3xl" />
      </label>

      <Tabs
        value={tab}
        onValueChange={setTab}>
        <TabsList className="relative inline-grid h-14 grid-cols-2 rounded-full bg-[#6A7282]/75 p-1.5 shadow-sm">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-0.75rem)/2)] rounded-full bg-[#E5E7EB] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: `translateX(${tab === "barcode" ? "100%" : "0%"})` }}
          />
          <TabsTrigger
            value="product"
            className="relative z-10 h-full w-full rounded-full bg-transparent px-5 font-medium text-[#99A1AF] shadow-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-transparent data-active:bg-transparent data-active:text-[#1E2939] data-active:shadow-none dark:data-active:bg-transparent">
            사물 인식
          </TabsTrigger>
          <TabsTrigger
            value="barcode"
            className="relative z-10 h-full w-full rounded-full bg-transparent px-5 font-medium text-[#99A1AF] shadow-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-transparent data-active:bg-transparent data-active:text-[#1E2939] data-active:shadow-none dark:data-active:bg-transparent">
            바코드 인식
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export default Footer;
