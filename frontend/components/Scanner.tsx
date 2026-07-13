import Image from "next/image";
import scan from "../public/images/scan.svg";

const Scanner = () => {
  return (
    <div className="relative aspect-square w-full rounded-[22px] shadow-[0_0_0_9999px_#1E293933]">
      <Image
        src={scan}
        alt="scan"
        fill
        draggable={false}
        className="scale-101"
      />
    </div>
  );
};

export default Scanner;
