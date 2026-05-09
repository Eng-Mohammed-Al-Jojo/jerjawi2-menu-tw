/**
 * Normalizes an ingredients string into a clean multi-line format.
 * Trims spaces, removes leading bullet symbols, and filters out empty lines.
 */
export const normalizeIngredients = (input: string): string => {
  if (!input) return "";

  return input
    .split(/\n/)
    .map(line => {
      // Remove leading bullets/dashes/dots and trim
      return line.replace(/^[•\-*]\s*/, "").trim();
    })
    .filter(line => line.length > 0)
    .join("\n");
};

/**
 * Splits a normalized string into an array of lines.
 */
export const getIngredientList = (input: string): string[] => {
  if (!input) return [];
  return input.split("\n").filter(line => line.trim().length > 0);
};
