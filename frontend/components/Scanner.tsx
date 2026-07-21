import Image from "next/image";
import scan from "../public/images/scan.svg";
import { FiRotateCcw } from "react-icons/fi";
import { cn } from "@/lib/utils";

type ScannerProps = {
  className?: string;
  showMatching?: boolean;
  isMatched?: boolean;
  onMatchingClick?: () => void;
};

const Scanner = ({ className, showMatching = false, isMatched = false, onMatchingClick }: ScannerProps) => {
  return (
    <div className={cn("relative aspect-square w-full rounded-[22px] shadow-[0_0_0_9999px_#1E293933]", className)}>
      {showMatching && (
        <button
          type="button"
          onClick={onMatchingClick}
          className={cn(
            "pointer-events-auto absolute -top-4 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center gap-2 rounded-full px-4 py-2 text-gray-800 shadow-sm backdrop-blur-sm",
            isMatched ? "bg-kmecca" : "bg-[#D3351D]/75",
          )}>
          <span className="text-sm font-semibold">{isMatched ? "Matching!" : "Mismatching"}</span>
          <FiRotateCcw className="h-4 w-4" />
        </button>
      )}

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
