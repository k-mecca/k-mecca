import { FaArrowLeft } from "react-icons/fa6";
import { LuSquareArrowUp } from "react-icons/lu";
import { MdLanguage } from "react-icons/md";

type HeaderProps = {
  isCaptured?: boolean;
  resetScan?: () => void;
};

const Header = ({ isCaptured, resetScan }: HeaderProps) => {
  return (
    <header className="relative z-10 flex shrink-0 justify-between px-4 py-3">
      <button
        type="button"
        disabled={!isCaptured}
        onClick={resetScan}
        className="group flex h-11 w-11 items-center justify-center rounded-full bg-[#F9FAFB]/75 shadow-sm">
        <FaArrowLeft className="text-2xl group-disabled:text-[#99A1AF]" />
      </button>
      <button className="flex h-11 items-center gap-0.5 rounded-full bg-[#F9FAFB]/75 px-5 shadow-sm">
        <LuSquareArrowUp className="text-[22px]" />
        <span className="text-sm font-semibold">화면 공유</span>
      </button>
      <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F9FAFB]/75 shadow-sm">
        <MdLanguage className="text-2xl" />
      </button>
    </header>
  );
};

export default Header;
