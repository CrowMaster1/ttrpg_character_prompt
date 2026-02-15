import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function loadDataFile(fileName: string): Promise<any> {
  try {
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}`);
    }
    const text = await response.text();
    if (fileName.endsWith('.json')) {
      return JSON.parse(text);
    } else if (fileName.endsWith('.txt')) {
      return text.split('\n').filter(line => line.trim()).map(line => ({
        name: line.trim(),
        description: line.trim()
      }));
    }
    return null;
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error);
    return null;
  }
}
