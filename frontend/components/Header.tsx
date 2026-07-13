import { IoMdInformationCircleOutline } from "react-icons/io";

const Header = () => {
  return (
    <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-4 py-3 text-white">
      <p>케이메카 상품등록</p>

      <button>
        <IoMdInformationCircleOutline className="text-2xl" />
      </button>
    </header>
  );
};

export default Header;
