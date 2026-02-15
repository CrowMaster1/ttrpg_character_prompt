import { useState, useCallback, useRef } from 'react';
import { Copy, HelpCircle } from 'lucide-react';
import { TweakPanel, type TweakPanelHandle } from './components/TweakPanel';
import { OllamaPanel } from './components/OllamaPanel';
import { StatsSidebarPanel } from './components/StatsSidebarPanel';
import { FreeModelGuide } from './components/FreeModelGuide';
import { useStore } from './store/useStore';
import { useDataLoader } from './hooks/useDataLoader';
import { usePromptGenerator } from './hooks/usePromptGenerator';
import { detectContradictions } from './services/contradictionDetector';
import type { SimpleSelections } from './services/randomizer';
import './styles/global.css';
import './styles/components.css';
import './components/controls/compact-stat-slider.css';

function App() {
  const [copiedPositive, setCopiedPositive] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [showFreeModelGuide, setShowFreeModelGuide] = useState(false);
  const tweakPanelRef = useRef<TweakPanelHandle>(null);

  const {
    selections, setSelection, resetSelections,
    targetModel, setTargetModel,
    setGeneratedPrompt,
    dataCache,
    controlsConfig,
    sliders, setSlider,
  } = useStore();

  // Load data on mount
  const { error: dataError, isLoading: dataLoading, retry: retryDataLoad } = useDataLoader();

  // Generate prompts automatically
  const { splitPrompt, cleanMetaText } = usePromptGenerator();

  // Get slider warnings from contradiction detection
  const getSliderWarnings = useCallback((): Record<string, string> => {
    const contradictions = detectContradictions(selections, sliders);
    const warnings: Record<string, string> = {};

    contradictions.forEach(c => {
      if (c.severity === 'error' || c.severity === 'warning') {
        // Map contradiction to slider IDs
        const sliderIds = ['strength', 'dexterity', 'constitution', 'age', 'intelligence', 'charisma', 'camera', 'style', 'expression'];
        sliderIds.forEach(id => {
          if (c.message.toLowerCase().includes(id) || c.id.includes(id)) {
            warnings[id] = c.message;
          }
        });
      }
    });

    return warnings;
  }, [selections, sliders]);

  const { positive, negative } = splitPrompt();

  const handleCopy = useCallback((text: string, type: 'positive' | 'negative') => {
    navigator.clipboard.writeText(text);
    if (type === 'positive') {
      setCopiedPositive(true);
      setTimeout(() => setCopiedPositive(false), 2000);
    } else {
      setCopiedNegative(true);
      setTimeout(() => setCopiedNegative(false), 2000);
    }
  }, []);

  const handlePromptCleaned = useCallback((cleanedPrompt: string) => {
    // Update the generated prompt with the cleaned version
    // This will replace the positive prompt part
    const split = splitPrompt();
    const newPrompt = split.negative
      ? `${cleanedPrompt}\n\nNegative prompt: ${split.negative}`
      : cleanedPrompt;
    setGeneratedPrompt(newPrompt);
  }, [splitPrompt, setGeneratedPrompt]);

  const handleNavigateToControl = useCallback((tabId: string, controlId: string) => {
    tweakPanelRef.current?.navigateTo(tabId, controlId);
  }, []);

  const handleResetPose = useCallback(() => {
    setSelection('pose', '');
  }, [setSelection]);

  const handleResetCamera = useCallback(() => {
    setSelection('camera_angle', '');
    setSelection('camera_position', '');
    setSelection('framing', '');
  }, [setSelection]);

  const handleResetLighting = useCallback(() => {
    setSelection('lighting', '');
    setSelection('shadows', '');
  }, [setSelection]);

  // Show error state if data loading failed
  if (dataError) {
    return (
      <div className="error-screen">
        <div className="error-container">
          <h1>⚠️ Failed to Load Data</h1>
          <p className="error-message">{dataError.message}</p>
          <p className="error-hint">
            This usually means data files are missing or couldn't be loaded.
            Please check your internet connection and try again.
          </p>
          <button onClick={retryDataLoad} className="btn btn-primary">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while data is being loaded
  if (dataLoading || !controlsConfig || !dataCache || Object.keys(dataCache).length === 0) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading character generator...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>AI Character Generator</h1>
      </header>

      <div className="main-layout">
        {/* Left: Stats Sidebar (first column) */}
        <StatsSidebarPanel
          sliders={sliders}
          onChange={setSlider}
          warnings={getSliderWarnings()}
          onNavigateToControl={handleNavigateToControl}
          onResetPose={handleResetPose}
          onResetCamera={handleResetCamera}
          onResetLighting={handleResetLighting}
        />

        {/* Middle: TweakPanel (second column) */}
        <div className="tweaks-panel-container">
          <TweakPanel
            ref={tweakPanelRef}
            controlsConfig={controlsConfig}
            dataCache={dataCache}
            selections={selections}
            onSelectionChange={setSelection}
            onResetAll={resetSelections}
            sliders={sliders}
            onSliderChange={setSlider}
            sliderWarnings={getSliderWarnings()}
          />
        </div>

        {/* Right: Prompts + Model Selection (third column) */}
        <div className="prompt-panel">
            {/* Model Selection */}
            <div className="panel-section model-section">
              <div className="model-header">
                <label>AI Model</label>
                <button
                  className="help-button"
                  onClick={() => setShowFreeModelGuide(!showFreeModelGuide)}
                  title="Free online AI generators guide"
                >
                  <HelpCircle size={16} />
                  <span>Free Models</span>
                </button>
              </div>
              <select value={targetModel} onChange={(e) => setTargetModel(e.target.value as any)}>
                <option value="FLUX">FLUX (Natural Language)</option>
                <option value="Pony">Pony Diffusion (Tags)</option>
                <option value="SDXL">SDXL (Weighted)</option>
                <option value="SD1.5">Stable Diffusion 1.5</option>
                <option value="Illustrious">Illustrious (Booru)</option>
                <option value="Juggernaut">Juggernaut (SDXL-based)</option>
              </select>

              {/* Free Model Guide - Collapsible */}
              {showFreeModelGuide && (
                <div className="free-model-guide-container">
                  <FreeModelGuide />
                </div>
              )}
            </div>

            {/* Positive Prompt */}
            <div className="panel-section prompt-section">
              <div className="section-header">
                <h3>Positive Prompt</h3>
                <button
                  onClick={() => handleCopy(positive, 'positive')}
                  className={`btn-copy ${copiedPositive ? 'copied' : ''}`}
                >
                  <Copy size={14} />
                  {copiedPositive ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                value={positive}
                readOnly
                className="prompt-box positive"
                placeholder="Positive prompt..."
              />
              <small>{positive.length} characters</small>
            </div>

            {/* Negative Prompt */}
            {negative && (
              <div className="panel-section prompt-section">
                <div className="section-header">
                  <h3>Negative Prompt</h3>
                  <button
                    onClick={() => handleCopy(negative, 'negative')}
                    className={`btn-copy ${copiedNegative ? 'copied' : ''}`}
                  >
                    <Copy size={14} />
                    {copiedNegative ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  value={negative}
                  readOnly
                  className="prompt-box negative"
                  placeholder="Negative prompt..."
                />
                <small>{negative.length} characters</small>
              </div>
            )}

          {/* Ollama AI Optimizer */}
          <OllamaPanel
            prompt={positive}
            onPromptCleaned={handlePromptCleaned}
            targetModel={targetModel}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
