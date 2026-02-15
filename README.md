# AI Character Prompt Generator

A professional desktop application for generating detailed AI image prompts for character creation. Built with React, TypeScript, and Vite.

## 🎯 Overview

The AI Character Prompt Generator is a powerful tool designed for creating comprehensive, well-structured prompts for AI image generation models. It features an intuitive interface with stat-based character customization, intelligent contradiction detection, and support for multiple AI models.

## ✨ Key Features

- **🎲 D&D-Style Stats System**: Six core stats (STR, DEX, CON, AGE, INT, CHA) that intelligently affect character attributes
- **🎨 600+ Options**: Extensive library of poses, outfits, equipment, expressions, and settings
- **🤖 Multi-Model Support**: Optimized formatting for FLUX, Pony Diffusion, SDXL, SD1.5, Illustrious, and Juggernaut
- **⚠️ Smart Contradiction Detection**: Automatically catches logical inconsistencies (e.g., frail character in combat pose)
- **🔄 Auto-Sync System**: Stats automatically suggest appropriate physical attributes and traits
- **🎭 15 World Settings**: From High Fantasy to Cyberpunk, Medieval Historical to Lovecraftian Horror
- **📋 Equipment Presets**: Quick loadouts for common archetypes (Wizard, Fighter, Rogue, etc.)
- **🎯 Token Budget Management**: Ensures prompts stay within model limits
- **♿ Accessibility**: Full keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Edge)
- Minimum 1024px screen width (desktop application)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Promt-AI-Image-generator

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### First Launch

1. Application loads with sensible defaults (Male Human, High Fantasy setting)
2. Adjust stats on the left sidebar (STR, DEX, CON, AGE, INT, CHA)
3. Customize character details in the tabbed interface
4. Select your target AI model from the dropdown
5. Copy generated prompt and paste into your AI image generator

## 📖 Documentation

For detailed information, see:

- **[QUICKSTART.md](./QUICKSTART.md)** - Complete feature guide and testing instructions
- **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** - Production deployment checklist
- **[INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md)** - Technical implementation details

## 🎮 Usage Example

### Creating a Female Elf Wizard

1. **Set Gender**: Character tab → Select "Female"
2. **Set Race**: Character tab → Select "Elf"
3. **Adjust Stats**: Increase INT slider to 5 (genius level)
4. **Select Outfit**: Gear tab → Choose "Wizard" preset
5. **Choose Pose**: Expression tab → Select "Casting Spell"
6. **Select Model**: Choose "FLUX (Natural Language)"
7. **Copy Prompt**: Click "Copy" button in the prompt panel

## 🏗️ Technical Stack

- **Framework**: React 19.2 with TypeScript 5.9
- **Build Tool**: Vite 7.3.1
- **State Management**: Zustand (zero prop-drilling)
- **UI Components**: Custom collapsible controls with Lucide React icons
- **Styling**: CSS with design tokens
- **Testing**: Vitest (69 passing tests)
- **Performance**: O(1) Map-based lookups, optimized re-renders

## 🧪 Quality Assurance

- ✅ **69/69 tests passing** (813ms runtime)
- ✅ **Zero TypeScript errors**
- ✅ **Production build**: 317 KB (98 KB gzipped)
- ✅ **WCAG 2.1 Level AA compliant**
- ✅ **Comprehensive contradiction detection**
- ✅ **Token budget enforcement**

## 🎨 AI Model Support

| Model | Format | Quality Prefix | Token Limit |
|-------|--------|---------------|-------------|
| **FLUX** | Natural language | Yes | 256 |
| **Pony Diffusion** | Booru tags | score_9 prefix | 77 |
| **SDXL** | Weighted keywords | (masterpiece:1.08) | 77 |
| **SD 1.5** | Legacy weighted | Simple weights | 77 |
| **Illustrious** | Curly braces | {masterpiece} | 77 |
| **Juggernaut** | SDXL-based | BREAK support | 77 |

## 🔧 Development

```bash
# Run tests
npm test

# Build for production
npm run build

# Type checking
npm run type-check

# Lint code
npm run lint
```

## 📊 Project Structure

```
src/
├── components/        # React components
│   ├── controls/     # Reusable form controls
│   └── ui/           # Base UI components
├── services/         # Business logic
│   ├── promptEngine/ # Prompt generation pipeline
│   ├── contradictionDetector.ts
│   └── sliderSync.ts
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── styles/           # CSS stylesheets

public/
├── data/             # JSON data files (600+ options)
└── controls.json     # Control configuration
```

## 🌟 Features in Detail

### Stat System
- **Strength (STR)**: Affects muscle mass, body type
- **Dexterity (DEX)**: Influences pose capabilities, agility
- **Constitution (CON)**: Determines body fat, endurance
- **Age (AGE)**: Sets age level, affects appearance options
- **Intelligence (INT)**: Suggests facial features, demeanor
- **Charisma (CHA)**: Controls attractiveness level

### Contradiction Detection
- **Physical impossibilities**: Low strength + bodybuilder muscle
- **Logical conflicts**: Young age + gray hair
- **Biomechanical issues**: Frail constitution + acrobatic poses
- **Auto-fix suggestions**: One-click resolution with navigation

### Override System
- Manual changes "lock" controls from auto-sync
- Visual indicators show overridden state
- Preserves user preferences while allowing slider adjustments

## 📝 Version History

- **v2.0.0** (2026-02-15): Production release with accessibility improvements
  - Added keyboard navigation and ARIA labels
  - Fixed memory leaks
  - Improved color contrast
  - Enhanced error handling

## 🤝 Contributing

This is a desktop-focused application (minimum 1024px width). When contributing:

- Maintain accessibility standards (WCAG 2.1 AA)
- Add tests for new features
- Follow existing code patterns
- Update documentation

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Built with expertise in D&D/fantasy RPG systems
- Art style references: Boris Vallejo, Larry Elmore, Warhammer Fantasy
- Photography terms: Rembrandt lighting, Chiaroscuro, etc.

---

**Ready to create amazing character prompts?** Start the development server with `npm run dev` or check out [QUICKSTART.md](./QUICKSTART.md) for a comprehensive guide!
