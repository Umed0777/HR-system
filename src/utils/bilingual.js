// true, если заполнены оба языка
export const isBilingualFilled = (ru, tj) =>
  !!(ru && ru.trim() && tj && tj.trim());

// true, если заполнен только один из языков
export const isBilingualPartial = (ru, tj) =>
  !!(ru && ru.trim()) !== !!(tj && tj.trim());
