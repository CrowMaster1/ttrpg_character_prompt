import { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, RefreshCw, Settings, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import {
  loadOllamaConfig,
  saveOllamaConfig,
  listModels,
  pullModel,
  deleteModel,
  cleanPrompt,
  POPULAR_MODELS,
  type OllamaModel,
} from '../services/ollamaService';
// Styles consolidated in ../styles/components.css

interface OllamaPanelProps {
  prompt: string;
  onPromptCleaned: (cleanedPrompt: string) => void;
  targetModel?: string; // The image generation model (FLUX, Pony, etc.)
}

export function OllamaPanel({ prompt, onPromptCleaned, targetModel }: OllamaPanelProps) {
  // Token limits by model
  const TOKEN_LIMITS: Record<string, number> = {
    'FLUX': 256,
    'Pony': 77,
    'SDXL': 77,
    'Illustrious': 248,
    'Juggernaut': 77,
  };

  // Estimate tokens (rough: ~0.75 tokens per word)
  const estimateTokens = (text: string) => Math.ceil(text.split(/\s+/).length * 0.75);
  const currentTokens = estimateTokens(prompt);
  const tokenLimit = targetModel ? TOKEN_LIMITS[targetModel] || 256 : 256;
  const isOverLimit = currentTokens > tokenLimit;
  const [showSettings, setShowSettings] = useState(false);
  const [host, setHost] = useState('http://localhost:11434');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState('');
  const [cleaning, setCleaning] = useState(false);
  const [cleanedPrompt, setCleanedPrompt] = useState('');

  const refreshModels = useCallback(async (hostUrl: string = host) => {
    setLoading(true);
    setError('');
    try {
      const modelList = await listModels(hostUrl);
      setModels(modelList);
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0].name);
      }
      setSuccess('Models loaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = hostUrl.includes('localhost') || hostUrl.includes('127.0.0.1');
      
      let message = err instanceof Error ? err.message : 'Failed to connect to Ollama';
      
      if (isHttps && isLocalhost && message.includes('Failed to fetch')) {
        message = 'HTTPS Blocked: GitHub Pages (HTTPS) cannot connect to local Ollama (HTTP) due to browser security. Use the Electron Desktop App for full AI support.';
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [host, selectedModel]);

  // Load config on mount
  useEffect(() => {
    const config = loadOllamaConfig();
    setHost(config.host);
    setModels(config.models);
    setSelectedModel(config.selectedModel);
    if (config.host) {
      refreshModels(config.host);
    }
  }, [refreshModels]);

  // Save config when it changes
  useEffect(() => {
    saveOllamaConfig({ host, models, selectedModel });
  }, [host, models, selectedModel]);

  const handlePullModel = async (modelName: string) => {
    setPulling(modelName);
    setPullProgress('Starting download...');
    setError('');
    try {
      await pullModel(modelName, host, (progress) => {
        setPullProgress(progress);
      });
      await refreshModels();
      setSuccess(`Model ${modelName} downloaded successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to download model';
      setError(message);
    } finally {
      setPulling(null);
      setPullProgress('');
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    if (!confirm(`Delete model ${modelName}?`)) return;
    setLoading(true);
    setError('');
    try {
      await deleteModel(modelName, host);
      await refreshModels();
      setSuccess(`Model ${modelName} deleted`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete model';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanPrompt = async () => {
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }
    if (!prompt.trim()) {
      setError('No prompt to clean');
      return;
    }

    setCleaning(true);
    setError('');
    setCleanedPrompt('');
    try {
      const cleaned = await cleanPrompt(prompt, selectedModel, host, targetModel, currentTokens);
      setCleanedPrompt(cleaned);
      setSuccess('Prompt optimized for ' + (targetModel || 'target model'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clean prompt';
      setError(message);
    } finally {
      setCleaning(false);
    }
  };

  const handleAcceptCleaned = () => {
    if (cleanedPrompt) {
      onPromptCleaned(cleanedPrompt);
      setCleanedPrompt('');
      setSuccess('Cleaned prompt applied');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div className="ollama-panel">
      <div className="ollama-header">
        <div className="header-title">
          <Sparkles size={18} />
          <h3>AI Prompt Optimizer</h3>
          {targetModel && (
            <span className="target-model-badge">{targetModel}</span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn-icon"
          title="Ollama Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Token Counter */}
      {prompt && (
        <div className={`token-counter ${isOverLimit ? 'over-limit' : ''}`}>
          <span className="token-label">Tokens:</span>
          <span className="token-count">
            {currentTokens} / {tokenLimit}
          </span>
          {isOverLimit && (
            <span className="token-warning">⚠️ Over limit</span>
          )}
        </div>
      )}

      {/* Settings Section */}
      {showSettings && (
        <div className="ollama-settings">
          <div className="setting-row">
            <label>Ollama Host</label>
            <div className="input-group">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="http://localhost:11434"
              />
              <button onClick={() => refreshModels()} className="btn-small" disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              </button>
            </div>
            <small>Default: http://localhost:11434</small>
          </div>

          {/* Installed Models */}
          {models.length > 0 && (
            <div className="models-section">
              <h4>Installed Models</h4>
              <div className="models-list">
                {models.map((model) => (
                  <div key={model.name} className="model-item">
                    <div className="model-info">
                      <span className="model-name">{model.name}</span>
                      <span className="model-size">{model.size}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteModel(model.name)}
                      className="btn-icon btn-danger"
                      title="Delete model"
                      disabled={loading}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download New Models */}
          <div className="models-section">
            <h4>Download Models</h4>
            <div className="download-list">
              {POPULAR_MODELS.map((model) => (
                <div key={model.name} className="download-item">
                  <div className="download-info">
                    <span className="model-name">{model.name}</span>
                    <span className="model-desc">{model.description}</span>
                  </div>
                  <button
                    onClick={() => handlePullModel(model.name)}
                    className="btn-small"
                    disabled={pulling === model.name || loading}
                  >
                    {pulling === model.name ? (
                      <>
                        <RefreshCw size={14} className="spinning" />
                        {pullProgress}
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Pull
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Selection & Clean Action */}
      <div className="ollama-actions">
        <div className="action-row">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={models.length === 0}
          >
            {models.length === 0 ? (
              <option>No models available</option>
            ) : (
              models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))
            )}
          </select>
          <button
            onClick={handleCleanPrompt}
            className="btn-clean"
            disabled={cleaning || !selectedModel || !prompt.trim()}
            title={`Optimize for ${targetModel || 'selected model'} (${tokenLimit} token limit)`}
          >
            {cleaning ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Optimize for {targetModel || 'Model'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="status-message error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="status-message success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Cleaned Prompt Result */}
      {cleanedPrompt && (
        <div className="cleaned-result">
          <div className="result-header">
            <h4>Optimized Prompt</h4>
            <div className="result-stats">
              <span className="stat">
                Tokens: {estimateTokens(cleanedPrompt)} / {tokenLimit}
              </span>
              {estimateTokens(cleanedPrompt) <= tokenLimit ? (
                <span className="stat-success">✓ Within limit</span>
              ) : (
                <span className="stat-warning">⚠️ Still over</span>
              )}
            </div>
            <button onClick={handleAcceptCleaned} className="btn-accept">
              Apply Optimized Version
            </button>
          </div>
          <textarea
            value={cleanedPrompt}
            readOnly
            className="cleaned-textarea"
            rows={6}
          />
          <div className="optimization-info">
            <small>
              <strong>What changed:</strong> Removed contradictions, duplicates, and optimized for {targetModel} ({tokenLimit} token limit)
            </small>
          </div>
        </div>
      )}

      {/* Help Text */}
      {models.length === 0 && !loading && (
        <div className="help-text">
          <p>
            <strong>Get Started:</strong>
          </p>
          <ol>
            <li>Make sure Ollama is running on your system</li>
            <li>Click the settings icon to configure</li>
            <li>Download a model from the list</li>
            <li>Select the model and click "Clean Prompt"</li>
          </ol>
          <p>
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Ollama
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
