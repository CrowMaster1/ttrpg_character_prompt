# GEMINI.md - AI Character Prompt Generator Context

This file provides instructional context for Gemini CLI interactions with the AI Character Prompt Generator project.

## 🎯 Project Overview

The AI Character Prompt Generator is a professional desktop application built with **React**, **TypeScript**, **Vite**, and **Electron**. It implements a "Stats-as-Skeleton" system for generating highly detailed AI image prompts for character creation across various AI models.

### Core Philosophy
- **Stats-Driven**: D&D-style attributes (STR, DEX, CON, AGE, INT, CHA) serve as the foundation, automatically suggesting physical traits, poses, and demeanors.
- **Consistency First**: A built-in contradiction detector ensures character logic (e.g., preventing "frail acrobats" or "young characters with gray hair").
- **Model-Specific Optimization**: Tailors output syntax for FLUX, Pony Diffusion, SDXL, SD 1.5, Illustrious, and Juggernaut.

## 🏗️ Technical Architecture

### State Management
- **Zustand (`src/store/useStore.ts`)**: Manages global application state, including character selections, stat sliders, active model, and user overrides.
- **Overrides System**: When a user manually changes a control, it is "locked" from automatic stat-based synchronization until reset.

### Prompt Generation Pipeline (`src/services/promptEngine/`)
The generation process follows a 6-phase pipeline:
1.  **Foundation Assembly**: Maps stat levels to core keywords (e.g., STR -> muscle mass).
2.  **Detail Validation**: Checks equipment and features against stats for consistency.
3.  **Composition Optimization**: Suggests camera angles and lighting based on character build.
4.  **Model Formatting**: Applies model-specific syntax (e.g., Booru tags for Pony, natural language for FLUX).
5.  **Negative Prompt Generation**: Context-aware negative prompts based on selections.
6.  **AI Enhancement**: Optional local LLM integration via **Ollama** for prompt refinement.

### Key Logic Services
- **`contradictionDetector.ts`**: Contains rules and auto-resolve logic for identifying character inconsistencies.
- **`sliderSync.ts`**: Handles the mapping of 1-5 stat levels to specific character attributes.
- **`ollamaService.ts`**: Direct HTTP client for interacting with a local Ollama instance for prompt cleaning and enhancement.

## 🚀 Building and Running

### Development
- `npm run dev`: Starts the Vite development server (Web only).
- `npm run electron:dev`: Starts the Vite server and launches the Electron application.
- `npm run type-check`: Runs TypeScript compiler for error checking.

### Testing & Linting
- `npm test`: Runs the Vitest suite (currently 69+ tests covering prompt engine and contradiction logic).
- `npm run lint`: Executes ESLint for code quality.

### Production Build
- `npm run build`: Generates the production web bundle in `dist/`.
- `npm run electron:build`: Packages the application for the current OS using `electron-builder`.
- `npm run electron:build:portable`: Creates a portable Windows executable.

## 🛠️ Development Conventions

### Code Style
- **TypeScript Strictness**: Adhere to strict typing; avoid `any`.
- **Functional Components**: Use React functional components with hooks.
- **Zustand Access**: Prefer granular state selection in components to minimize re-renders.

### Data Management
- UI controls are defined in `public/controls.json`.
- Character options (poses, outfits, etc.) are stored as JSON files in `public/data/`.
- Maintain O(1) lookup patterns when adding new data categories to the `PromptEngine`.

### Testing
- Add unit tests in `*.test.ts` for any new logic in `services/`.
- Ensure contradiction rules have corresponding tests in `contradictionDetector.test.ts`.

## 📁 Key Files Reference
- `src/services/promptEngine/index.ts`: Main entry point for prompt generation.
- `src/services/promptEngine/modelFormatter.ts`: Logic for model-specific syntax.
- `src/services/contradictionDetector.ts`: Rule engine for character consistency.
- `src/store/useStore.ts`: Central application state.
- `public/controls.json`: UI configuration and data source mapping.
- `electron/main.cjs`: Electron main process configuration.
