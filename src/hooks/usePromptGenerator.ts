import { useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { PromptEngine } from '../services/promptEngine';

/**
 * Custom hook to generate prompts based on selections and target model
 * Also provides utility functions for prompt manipulation
 */
export function usePromptGenerator() {
  const {
    selections,
    sliders,
    targetModel,
    controlsConfig,
    dataCache,
    generatedPrompt,
    setGeneratedPrompt,
  } = useStore();

  // Generate prompt whenever selections, sliders, or target model changes
  useEffect(() => {
    if (!controlsConfig || !dataCache || Object.keys(dataCache).length === 0) return;

    const engine = new PromptEngine(controlsConfig, dataCache);
    const prompt = engine.generateFormatted(selections, targetModel, 0);
    setGeneratedPrompt(prompt);
  }, [selections, sliders, targetModel, controlsConfig, dataCache, setGeneratedPrompt]);

  /**
   * Clean meta text patterns from prompt
   */
  const cleanMetaText = useCallback((text: string): string => {
    return text
      .replace(/cleaned\s*up[#]*\s*/gi, '')
      .replace(/optimized[#]*\s*/gi, '')
      .replace(/^[#]+\s*/gm, '')
      .trim();
  }, []);

  /**
   * Split prompt into positive and negative parts
   */
  const splitPrompt = useCallback(() => {
    const match = generatedPrompt.match(/^(.*?)\s*Negative\s+[Pp]rompt:\s*(.*)$/s);
    if (match) {
      return {
        positive: cleanMetaText(match[1] || ''),
        negative: cleanMetaText(match[2] || ''),
      };
    }
    return {
      positive: cleanMetaText(generatedPrompt),
      negative: '',
    };
  }, [generatedPrompt, cleanMetaText]);

  return {
    generatedPrompt,
    splitPrompt,
    cleanMetaText,
  };
}
