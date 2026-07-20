export function getStockStatus(stock: number | null | undefined) {
  const currentStock = stock ?? 0;

  if (currentStock === 0) {
    return {
      label: "매장 품절",
      dotClassName: "bg-[#D3351D]",
      textClassName: "text-[#D3351D]",
    };
  }

  if (currentStock < 30) {
    return {
      label: "품절 임박",
      dotClassName: "bg-[#E6D00D]",
      textClassName: "text-[#E6D00D]",
    };
  }

  return {
    label: "구매 가능",
    dotClassName: "bg-kmecca",
    textClassName: "text-kmecca",
  };
}
