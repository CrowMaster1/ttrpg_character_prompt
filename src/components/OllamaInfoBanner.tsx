import { useEffect, useState } from 'react';
// Styles consolidated in ../styles/components.css

export function OllamaInfoBanner() {
  const [isOllamaRunning, setIsOllamaRunning] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const checkOllama = async () => {
      try {
        // Check if we're in Electron environment
        if (window.electron?.ollama) {
          const result = await window.electron.ollama.isRunning();
          if (mounted) {
            setIsOllamaRunning(result.running);
            setIsChecking(false);
          }
        } else {
          // For web version, check via fetch
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch('http://localhost:11434/api/tags', {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (mounted) {
              setIsOllamaRunning(response.ok);
              setIsChecking(false);
            }
          } catch {
            if (mounted) {
              setIsOllamaRunning(false);
              setIsChecking(false);
            }
          }
        }
      } catch {
        if (mounted) {
          setIsOllamaRunning(false);
          setIsChecking(false);
        }
      }
    };

    // Check immediately
    checkOllama();

    // Check every 10 seconds
    const interval = setInterval(checkOllama, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Don't show banner if Ollama is running, still checking, or user dismissed it
  if (isOllamaRunning || isChecking || isDismissed) {
    return null;
  }

  // Detect if running in web browser (not Electron)
  const isWebVersion = !window.electron;

  return (
    <div className="ollama-info-banner">
      <div className="ollama-banner-content">
        <svg
          className="ollama-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="ollama-banner-text">
          <strong>Ollama AI Features Unavailable</strong>
          {isWebVersion ? (
            <span>
              <strong>Running on HTTPS (GitHub Pages)?</strong> Browsers often block local connections for security. 
              To fix: (1) Use the <strong>Electron Desktop App</strong> (recommended), 
              (2) Use a secure tunnel like <code>ngrok</code>, or 
              (3) Start with CORS: <code>$env:OLLAMA_ORIGINS="*"; ollama serve</code>.
            </span>
          ) : (
            <span>
              Remember to open Ollama Desktop or run <code>ollama serve</code> to
              enable AI-powered prompt cleaning and enhancement features.
            </span>
          )}
        </div>
        <button
          className="ollama-dismiss-btn"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
