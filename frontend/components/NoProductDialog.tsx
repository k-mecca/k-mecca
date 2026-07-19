"use client";

import { usePathname } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NoProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NoProductDialog = ({ open, onOpenChange }: NoProductDialogProps) => {
  const pathname = usePathname();
  const text = pathname.startsWith("/admin")
    ? "상품 정보를 새로 등록해 주세요"
    : "다른 상품을 스캔해주세요.";

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col gap-2">
          <AlertDialogTitle className="text-xl font-medium">등록된 상품이 없어요</AlertDialogTitle>
          <AlertDialogDescription className="text-black">{text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => onOpenChange(false)}
            className="h-12 w-full bg-[#EDEDED] font-semibold text-black hover:bg-[#EDEDED]">
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NoProductDialog;
