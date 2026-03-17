export const camelCaseToSentence = (s: string) => {
  if (!s) {
    return "";
  }
  const result = s.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Converts a free-form sentence string to camelCase.
 * e.g. "My Custom Category" → "myCustomCategory"
 * Leading/trailing whitespace is trimmed before conversion.
 */
export const sentenceToCamelCase = (s: string): string => {
  return s
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
};

export const upperCaseToSentence = (str: string): string => {
  if (!str) return "";

  // 1. Replace underscores with spaces
  const spacedStr = str.replace(/_/g, " ");

  // 2. Convert to lowercase
  const lowerCaseStr = spacedStr.toLowerCase();

  // 3. Capitalize the first letter
  const sentenceCaseStr =
    lowerCaseStr.charAt(0).toUpperCase() + lowerCaseStr.slice(1);

  return sentenceCaseStr;
}
