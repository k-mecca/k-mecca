import { FaArrowLeft } from "react-icons/fa6";
import { LuSquareArrowUp } from "react-icons/lu";
import { MdLanguage } from "react-icons/md";

const Header = () => {
  return (
    <header className="absolute top-0 right-0 left-0 z-10 flex justify-between px-4 py-3">
      <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F9FAFB]/75 shadow-sm">
        <FaArrowLeft className="text-2xl" />
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
