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
 * Remove duplicate phrases/words that appear in the prompt
 * Parentheses-aware to avoid breaking weighted syntax
 */
export function removeDuplicates(text: string): string {
  if (!text) return '';

  // Step 1: Extract all segments, keeping weighted groups together
  // This regex matches either a weighted group (parentheses) or a plain comma-separated segment
  const segments: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;

    if (char === ',' && parenDepth === 0) {
      segments.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) segments.push(current.trim());

  const seenPhrases = new Set<string>();
  const seenSignificantWords = new Set<string>();
  const uniqueSegments: string[] = [];

  // Common filler words to ignore during word-level deduplication
  const fillerWords = new Set([
    'a', 'an', 'the', 'with', 'and', 'in', 'on', 'of', 'for', 'to', 'at', 'by', 
    'is', 'are', 'was', 'were', 'been', 'has', 'have', 'had',
    'wearing', 'clad', 'clothed', 'dressed', 'garbed', 'attired',
    'build', 'appearance', 'bearing', 'look', 'features', 'style', 'setting',
    'background', 'foreground', 'shot', 'view', 'angle', 'perspective', 'focus'
  ]);

  for (const segment of segments) {
    const normalized = segment.toLowerCase().replace(/[():0-9.]/g, '').trim();
    if (!normalized) {
      if (segment.length > 0) uniqueSegments.push(segment);
      continue;
    }

    // Exact phrase match check (normalized)
    if (seenPhrases.has(normalized)) continue;
    seenPhrases.add(normalized);

    // Word-level redundancy check
    const words = normalized.split(/[\s-]+/).filter(w => w.length > 3 && !fillerWords.has(w));
    
    if (words.length > 0) {
      // If every significant word in this segment has already been seen in a PREVIOUS segment, 
      // it's likely redundant (e.g., "leather armor" after "wearing fine leather armor")
      const allWordsSeen = words.every(w => seenSignificantWords.has(w));
      if (allWordsSeen) continue;

      // Add new words to seen set
      words.forEach(w => seenSignificantWords.add(w));
    }

    uniqueSegments.push(segment);
  }

  return uniqueSegments.join(', ');
}

/**
 * Comprehensive prompt cleanup
 */
export function cleanupPrompt(text: string): string {
  if (!text) return '';
  let result = text;

  // First pass: clean punctuation
  result = cleanPrompt(result);

  // Second pass: remove duplicates (now smarter and parentheses-aware)
  result = removeDuplicates(result);

  // Third pass: final punctuation cleanup
  result = cleanPrompt(result);

  return result;
}

/**
 * Clean up tag-based prompts (Pony, Illustrious)
 * Aggressive deduplication and normalization
 */
export function cleanTagPrompt(text: string): string {
  if (!text) return '';

  // Use the parentheses-aware duplicate remover first
  let cleaned = removeDuplicates(text);

  // Normalize all whitespace to single spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Fix comma spacing
  cleaned = cleaned.replace(/\s*,\s*/g, ', ');

  // Standard punctuation cleanup
  cleaned = cleanPrompt(cleaned);

  return cleaned;
}
