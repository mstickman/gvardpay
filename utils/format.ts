export const formatBalance = (amount: number, decimals: number = 2): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatAddress = (address: string, chars: number = 4): string => {
  if (!address || address.length < chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  return `${days} дн назад`;
};

export const formatUSD = (amount: number): string => {
  return `$${formatBalance(amount, 2)}`;
};
