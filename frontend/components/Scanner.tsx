import Image from "next/image";
import scan from "../public/images/scan.svg";
import { cn } from "@/lib/utils";

const Scanner = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative aspect-square w-full rounded-[22px] shadow-[0_0_0_9999px_#1E293933]", className)}>
      <Image
        src={scan}
        alt="scan"
        fill
        priority
        draggable={false}
        className="scale-101"
      />
    </div>
  );
};

export default Scanner;
