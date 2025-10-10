// Automatic category icon mapping based on category name
export const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase().trim();

  // Collections (check first for broader categories)
  if (name.includes('girl') || name.includes('women') || name.includes('ladies')) return '👩';
  if (name.includes('men') || name.includes('boy') || name.includes('male')) return '👨';
  if (name.includes('kid') || name.includes('child')) return '👶';
  if (name.includes('collection')) return '🛍️';

  // Clothing
  if (name.includes('dress')) return '👗';
  if (name.includes('shirt') || name.includes('blouse')) return '👔';
  if (name.includes('pants') || name.includes('trouser')) return '👖';
  if (name.includes('short')) return '🩳';
  if (name.includes('jacket') || name.includes('coat')) return '🧥';
  if (name.includes('sweater') || name.includes('hoodie')) return '🧶';
  if (name.includes('suit')) return '🤵';
  if (name.includes('jeans')) return '👖';
  if (name.includes('skirt')) return '👗';

  // Footwear
  if (name.includes('shoe') || name.includes('sneaker')) return '👟';
  if (name.includes('boot')) return '🥾';
  if (name.includes('sandal') || name.includes('slipper')) return '🩴';
  if (name.includes('heel')) return '👠';

  // Accessories
  if (name.includes('bag') || name.includes('purse')) return '👜';
  if (name.includes('hat') || name.includes('cap')) return '🧢';
  if (name.includes('glasses') || name.includes('sunglass')) return '🕶️';
  if (name.includes('watch')) return '⌚';
  if (name.includes('jewelry') || name.includes('necklace') || name.includes('earring')) return '💍';
  if (name.includes('belt')) return '👔';
  if (name.includes('scarf')) return '🧣';
  if (name.includes('glove')) return '🧤';
  if (name.includes('tie')) return '👔';
  if (name.includes('sock')) return '🧦';

  // Special categories
  if (name.includes('sale') || name.includes('discount')) return '🏷️';
  if (name.includes('new') || name.includes('arrival')) return '✨';
  if (name.includes('popular') || name.includes('trending')) return '🔥';
  if (name.includes('featured')) return '⭐';

  // Default icon
  return '🛍️';
};
