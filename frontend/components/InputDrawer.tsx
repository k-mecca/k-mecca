"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { useProductStore } from "@/store/productStore";
import { productGet } from "@/service/staff";
import NoProductDialog from "./NoProductDialog";
import { IoClose } from "react-icons/io5";

const InputDrawer = () => {
  const [value, setValue] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noProductOpen, setNoProductOpen] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const setBarcode = useProductStore((state) => state.setBarcode);

  const handleSubmit = async () => {
    const barcodeNumber = value.trim();
    if (!barcodeNumber || isLookingUp) return;

    setIsLookingUp(true);

    try {
      const result = await productGet(barcodeNumber);

      // 바코드 있을 때
      if (result.registered === true) {
        setTimeout(() => {
          setDrawerOpen(false);
          setBarcode(barcodeNumber);
        }, 500);
      } else {
        // 바코드 없을 때
        setTimeout(() => {
          setNoProductOpen(true);
          setValue(""); // 여기서 말고 dialog 확인 누른 후에 초기화 하기
        }, 300);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <>
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}>
        <DrawerTrigger
          render={
            <Button
              variant="outline"
              className="h-[52px] rounded-full bg-[#F9FAFBE5]/90 px-5 py-4 backdrop-blur-[6px] hover:bg-[#F9FAFBE5]/90"
            />
          }>
          <span className="font-semibold text-[#1E2939]">바코드 번호 입력</span>
        </DrawerTrigger>
        <DrawerContent className="mx-auto w-full max-w-[400px] bg-[#F2F2F2]">
          <DrawerHeader>
            <DrawerTitle className="flex justify-end p-0">
              <DrawerClose
                render={
                  <Button className="h-fit w-fit bg-[#F2F2F2] p-0 hover:bg-[#F2F2F2]">
                    <IoClose className="size-6 text-black" />
                  </Button>
                }
              />
            </DrawerTitle>
            <DrawerDescription className="mt-6 flex flex-col gap-3">
              <span className="text-left text-base font-medium">바코드 번호</span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="바코드 번호를 입력해주세요"
                className="h-[52px] w-full rounded-md border border-[#979797] bg-white p-3 focus:outline-none"
              />
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="mt-6">
            <Button
              onClick={handleSubmit}
              disabled={isLookingUp || !value.trim()}
              className="h-[52px] bg-[#282828] px-5 py-4 hover:bg-[#282828]">
              <span className="font-semibold text-[#F2F2F7]">등록하기</span>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <NoProductDialog
        open={noProductOpen}
        onOpenChange={setNoProductOpen}
      />
    </>
  );
};

export default InputDrawer;
