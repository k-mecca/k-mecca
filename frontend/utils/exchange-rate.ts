export const formatUsd = (krw: number, exchangeRate: number = 1435) => {
  return (krw / exchangeRate).toFixed(2);
};
