import Scanner from "./Scanner";
import type { IconType } from "react-icons";
import { FaArrowUp, FaArrowRotateRight, FaArrowRotateLeft, FaArrowDown } from "react-icons/fa6";

const PHOTO_STEPS: { guideMessage: string; Icon: IconType }[] = [
  { guideMessage: "정면을 촬영해주세요", Icon: FaArrowUp },
  { guideMessage: "오른쪽 측면을 촬영해주세요", Icon: FaArrowRotateRight },
  { guideMessage: "왼쪽 측면을 촬영해주세요", Icon: FaArrowRotateLeft },
  { guideMessage: "윗면을 촬영해주세요", Icon: FaArrowDown },
];

type MainProps = {
  isScanned: string | null;
  photoCount: number;
  onCapture: () => void;
};

const Main = ({ isScanned, photoCount, onCapture }: MainProps) => {
  const step = PHOTO_STEPS[photoCount];

  return (
    <div className="absolute top-12 right-0 bottom-0 left-0 flex flex-col gap-6 p-6">
      <p className="relative z-10 flex items-end justify-center text-center text-lg font-medium text-white">
        {isScanned ? "상품을 여러 각도에서 촬영해주세요" : "상품 바코드를 스캔해주세요"}
      </p>

      <Scanner />

      {/* 촬영 가이드 메세지 */}
      {isScanned && step && (
        <div className="z-10 flex flex-col items-center justify-center gap-2 text-white">
          <p className="text-center font-medium">{step.guideMessage}</p>
          <step.Icon className="text-xl" />
        </div>
      )}

      {/* 촬영 버튼 & 바코드 입력 */}
      {isScanned ? (
        <footer className="absolute right-0 bottom-0 left-0 z-10 flex h-full max-h-40 items-center justify-center">
          <button
            onClick={onCapture}
            className="relative h-18 w-18 disabled:opacity-40">
            <div className="absolute inset-0 rounded-full bg-[#E5E7EB]" />
            <div className="absolute inset-1.5 rounded-full bg-white" />
          </button>
        </footer>
      ) : (
        <button className="relative z-10 rounded-full bg-[#F9FAFBEB] px-5 py-4 font-semibold backdrop-blur-[6px]">
          바코드 번호 입력
        </button>
      )}
    </div>
  );
};

export default Main;
