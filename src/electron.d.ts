export interface ElectronAPI {
  ollama: {
    listModels: () => Promise<{
      success: boolean;
      models?: Array<{ name: string }>;
      error?: string;
    }>;
    generate: (params: {
      model: string;
      prompt: string;
    }) => Promise<{
      success: boolean;
      response?: string;
      error?: string;
    }>;
    isRunning: () => Promise<{
      success: boolean;
      running: boolean;
      error?: string;
    }>;
  };
  fs: {
    readJson: (filePath: string) => Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    writeJson: (filePath: string, data: any) => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
