export function formatBdt(amount) {
  return `৳ ${Number(amount || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
