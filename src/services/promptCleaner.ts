/**
 * Prompt Cleaner Utility
 * Removes excessive punctuation, redundant spaces, and cleans up formatting issues
 */

/**
 * Clean up excessive commas and normalize spacing
 */
export function cleanPrompt(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove excessive commas (multiple commas in a row)
  cleaned = cleaned.replace(/,{2,}/g, ',');

  // Remove comma followed by space and another comma
  cleaned = cleaned.replace(/,\s*,+/g, ',');

  // Remove spaces before commas
  cleaned = cleaned.replace(/\s+,/g, ',');

  // Ensure single space after commas
  cleaned = cleaned.replace(/,([^\s])/g, ', $1');

  // Remove excessive spaces (multiple spaces in a row)
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Remove comma at the start of the string
  cleaned = cleaned.replace(/^,\s*/, '');

  // Remove comma at the end of the string
  cleaned = cleaned.replace(/,\s*$/, '');

  // Remove period followed by comma
  cleaned = cleaned.replace(/\.\s*,/g, '.');

  // Ensure single space after periods (but NOT inside decimal numbers like 1.08)
  cleaned = cleaned.replace(/\.([^\s\d])/g, '. $1');

  // Remove excessive periods
  cleaned = cleaned.replace(/\.{2,}/g, '.');

  // Clean up parentheses spacing for weighted prompts
  cleaned = cleaned.replace(/\(\s+/g, '(');
  cleaned = cleaned.replace(/\s+\)/g, ')');

  // Clean up multiple spaces around colons in weighted syntax
  cleaned = cleaned.replace(/\s*:\s*/g, ':');

  // Remove empty parentheses
  cleaned = cleaned.replace(/\(\s*\)/g, '');

  // Remove empty curly braces (for Illustrious)
  cleaned = cleaned.replace(/\{\s*\}/g, '');

  // Remove comma before closing parenthesis
  cleaned = cleaned.replace(/,\s*\)/g, ')');

  // Fix double commas around weighted elements like (word:1.2),, next
  cleaned = cleaned.replace(/\)\s*,\s*,/g, '),');

  // Trim and return
  return cleaned.trim();
}

/**
 * Remove duplicate phrases/words that appear consecutively
 */
export function removeDuplicates(text: string): string {
  const parts = text.split(/,\s*/);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const part of parts) {
    const normalized = part.trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      unique.push(part.trim());
    }
  }

  return unique.join(', ');
}

/**
 * Comprehensive prompt cleanup
 */
export function cleanupPrompt(text: string): string {
  let result = text;

  // First pass: clean punctuation
  result = cleanPrompt(result);

  // Second pass: remove duplicates
  result = removeDuplicates(result);

  // Third pass: final punctuation cleanup
  result = cleanPrompt(result);

  return result;
}

/**
 * Clean up tag-based prompts (Pony, Illustrious)
 * More aggressive comma/space normalization
 */
export function cleanTagPrompt(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Normalize all whitespace to single spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Fix comma spacing
  cleaned = cleaned.replace(/\s*,\s*/g, ', ');

  // Remove excessive commas
  cleaned = cleaned.replace(/,{2,}/g, ',');

  // Remove leading/trailing commas
  cleaned = cleaned.replace(/^,\s*/, '');
  cleaned = cleaned.replace(/,\s*$/, '');

  // Remove empty tags (tags with no content between commas)
  cleaned = cleaned.replace(/,\s*,/g, ',');

  // Split into tags and remove empty/whitespace-only tags
  const tags = cleaned.split(',').map(t => t.trim()).filter(t => t.length > 0);

  // Remove duplicate tags
  const uniqueTags = [...new Set(tags)];

  return uniqueTags.join(', ');
}
