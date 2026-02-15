/**
 * Equipment Preset System
 * Provides predefined equipment combinations for common character archetypes
 */

export interface EquipmentSlot {
  head?: string;
  torso?: string;
  arms?: string;
  hands?: string;
  legs?: string;
  feet?: string;
  back?: string;
  waist?: string;
  neck?: string;
  mainHand?: string;
  offHand?: string;
}

export interface EquipmentPreset {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'magic' | 'stealth' | 'social' | 'labor';
  slots: EquipmentSlot;
  tags: string[]; // For filtering (e.g., 'heavy', 'light', 'cloth', 'leather', 'plate')
}

/**
 * Predefined Equipment Presets
 */
export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  // === COMBAT ARCHETYPES ===
  {
    id: 'fighter',
    name: 'Fighter',
    description: 'Heavy armor and versatile weapons for frontline combat',
    category: 'combat',
    tags: ['heavy', 'plate', 'martial'],
    slots: {
      head: 'Full Helm',
      torso: 'Plate Armor',
      arms: 'Plate Vambraces',
      hands: 'Gauntlets',
      legs: 'Plate Greaves',
      feet: 'Steel Boots',
      back: 'Heavy Cloak',
      waist: 'Sword Belt',
      mainHand: 'Longsword',
      offHand: 'Shield',
    },
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior with blessed armor and divine symbols',
    category: 'combat',
    tags: ['heavy', 'plate', 'holy'],
    slots: {
      head: 'Winged Helm',
      torso: 'Holy Plate Armor',
      arms: 'Blessed Vambraces',
      hands: 'White Gauntlets',
      legs: 'Plate Greaves',
      feet: 'Steel Boots',
      back: 'Radiant Cloak',
      waist: 'Sacred Belt',
      neck: 'Holy Symbol',
      mainHand: 'Holy Sword',
      offHand: 'Sacred Shield',
    },
  },
  {
    id: 'barbarian',
    name: 'Barbarian',
    description: 'Tribal warrior with minimal armor and massive weapons',
    category: 'combat',
    tags: ['light', 'tribal', 'berserker'],
    slots: {
      torso: 'Fur Vest',
      arms: 'Leather Bracers',
      hands: 'Wrapped Hands',
      legs: 'Hide Pants',
      feet: 'Leather Boots',
      waist: 'Tribal Belt',
      neck: 'Bone Necklace',
      mainHand: 'Greataxe',
      back: 'Animal Pelt',
    },
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Light armor and ranged weapons for wilderness survival',
    category: 'combat',
    tags: ['light', 'leather', 'ranged'],
    slots: {
      head: 'Ranger Hood',
      torso: 'Leather Armor',
      arms: 'Leather Bracers',
      hands: 'Fingerless Gloves',
      legs: 'Leather Pants',
      feet: 'Soft Boots',
      back: 'Travel Cloak',
      waist: 'Quiver Belt',
      mainHand: 'Longbow',
      offHand: 'Hunting Knife',
    },
  },

  // === MAGIC ARCHETYPES ===
  {
    id: 'mage',
    name: 'Mage',
    description: 'Arcane robes and magical implements for spellcasting',
    category: 'magic',
    tags: ['cloth', 'arcane', 'scholarly'],
    slots: {
      head: 'Wizard Hat',
      torso: 'Arcane Robes',
      arms: 'Rune Sleeves',
      hands: 'Silk Gloves',
      legs: 'Cloth Pants',
      feet: 'Soft Shoes',
      back: 'Star-Embroidered Cloak',
      waist: 'Component Pouch',
      neck: 'Arcane Amulet',
      mainHand: 'Wooden Staff',
      offHand: 'Spellbook',
    },
  },
  {
    id: 'cleric',
    name: 'Cleric',
    description: 'Divine vestments and holy symbols for healing and protection',
    category: 'magic',
    tags: ['medium', 'chainmail', 'holy'],
    slots: {
      head: 'Priest Hood',
      torso: 'Chain Shirt',
      arms: 'Cloth Sleeves',
      hands: 'Prayer Gloves',
      legs: 'Robes',
      feet: 'Simple Boots',
      back: 'Holy Vestment',
      waist: 'Prayer Belt',
      neck: 'Holy Symbol',
      mainHand: 'Mace',
      offHand: 'Scripture',
    },
  },
  {
    id: 'warlock',
    name: 'Warlock',
    description: 'Dark robes and eldritch accessories for pact magic',
    category: 'magic',
    tags: ['cloth', 'dark', 'eldritch'],
    slots: {
      head: 'Hooded Cowl',
      torso: 'Dark Robes',
      arms: 'Shadowy Sleeves',
      hands: 'Black Gloves',
      legs: 'Dark Pants',
      feet: 'Shadow Boots',
      back: 'Tattered Cloak',
      waist: 'Ritual Belt',
      neck: 'Eldritch Amulet',
      mainHand: 'Twisted Staff',
      offHand: 'Dark Tome',
    },
  },

  // === STEALTH ARCHETYPES ===
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'Light leather armor and concealed weapons for stealth',
    category: 'stealth',
    tags: ['light', 'leather', 'sneaky'],
    slots: {
      head: 'Leather Cap',
      torso: 'Studded Leather',
      arms: 'Leather Bracers',
      hands: 'Thin Gloves',
      legs: 'Dark Pants',
      feet: 'Soft Boots',
      back: 'Dark Cloak',
      waist: 'Thieves Tools Belt',
      mainHand: 'Shortsword',
      offHand: 'Dagger',
    },
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Concealed armor and silent weapons for deadly precision',
    category: 'stealth',
    tags: ['light', 'leather', 'deadly'],
    slots: {
      head: 'Face Wrap',
      torso: 'Black Leather',
      arms: 'Hidden Bracers',
      hands: 'Assassin Gloves',
      legs: 'Shadow Pants',
      feet: 'Silent Boots',
      back: 'Smoke Cloak',
      waist: 'Poison Vial Belt',
      neck: 'Garrote Wire',
      mainHand: 'Poisoned Dagger',
      offHand: 'Throwing Knives',
    },
  },
  {
    id: 'monk',
    name: 'Monk',
    description: 'Minimal cloth wrappings for unarmed martial arts',
    category: 'stealth',
    tags: ['cloth', 'martial', 'unarmed'],
    slots: {
      head: 'Meditation Band',
      torso: 'Simple Robes',
      arms: 'Arm Wraps',
      hands: 'Hand Wraps',
      legs: 'Loose Pants',
      feet: 'Sandals',
      waist: 'Rope Belt',
      neck: 'Prayer Beads',
    },
  },

  // === SOCIAL ARCHETYPES ===
  {
    id: 'noble',
    name: 'Noble',
    description: 'Fine clothing and elegant accessories for high society',
    category: 'social',
    tags: ['fine', 'expensive', 'elegant'],
    slots: {
      head: 'Noble Circlet',
      torso: 'Embroidered Doublet',
      arms: 'Silk Sleeves',
      hands: 'White Gloves',
      legs: 'Fine Breeches',
      feet: 'Polished Boots',
      back: 'Velvet Cape',
      waist: 'Jeweled Belt',
      neck: 'Gold Necklace',
      mainHand: 'Rapier',
    },
  },
  {
    id: 'merchant',
    name: 'Merchant',
    description: 'Practical clothing with coin pouches and trade goods',
    category: 'social',
    tags: ['practical', 'middle-class', 'trader'],
    slots: {
      head: 'Merchant Hat',
      torso: 'Wool Vest',
      arms: 'Rolled Sleeves',
      hands: 'Work Gloves',
      legs: 'Sturdy Pants',
      feet: 'Walking Boots',
      back: 'Travel Pack',
      waist: 'Coin Purse Belt',
      neck: 'Trade Guild Pendant',
      mainHand: 'Walking Stick',
    },
  },
  {
    id: 'bard',
    name: 'Bard',
    description: 'Colorful performer attire with musical instruments',
    category: 'social',
    tags: ['colorful', 'performer', 'artistic'],
    slots: {
      head: 'Feathered Hat',
      torso: 'Colorful Vest',
      arms: 'Puffy Sleeves',
      hands: 'Fingerless Gloves',
      legs: 'Tight Pants',
      feet: 'Dancing Boots',
      back: 'Dramatic Cape',
      waist: 'Instrument Belt',
      neck: 'Silver Chain',
      mainHand: 'Lute',
      offHand: 'Dagger',
    },
  },

  // === LABOR ARCHETYPES ===
  {
    id: 'peasant',
    name: 'Peasant',
    description: 'Simple, worn clothing for common folk and laborers',
    category: 'labor',
    tags: ['simple', 'poor', 'common'],
    slots: {
      torso: 'Simple Tunic',
      arms: 'Patched Sleeves',
      hands: 'Rough Gloves',
      legs: 'Worn Pants',
      feet: 'Tattered Boots',
      waist: 'Rope Belt',
    },
  },
  {
    id: 'blacksmith',
    name: 'Blacksmith',
    description: 'Heavy leather apron and tools for metalworking',
    category: 'labor',
    tags: ['practical', 'craftsman', 'sturdy'],
    slots: {
      torso: 'Leather Apron',
      arms: 'Thick Bracers',
      hands: 'Work Gloves',
      legs: 'Canvas Pants',
      feet: 'Steel-Toed Boots',
      waist: 'Tool Belt',
      mainHand: 'Smith Hammer',
      offHand: 'Tongs',
    },
  },
  {
    id: 'sailor',
    name: 'Sailor',
    description: 'Weather-resistant clothing for life at sea',
    category: 'labor',
    tags: ['practical', 'nautical', 'weather-resistant'],
    slots: {
      head: 'Tricorn Hat',
      torso: 'Canvas Shirt',
      arms: 'Rolled Sleeves',
      hands: 'Rope-Burned Hands',
      legs: 'Sailor Pants',
      feet: 'Deck Boots',
      waist: 'Rope Belt',
      neck: 'Anchor Pendant',
      mainHand: 'Cutlass',
      offHand: 'Hook',
    },
  },
];

/**
 * Get all available presets
 */
export function getAllPresets(): EquipmentPreset[] {
  return EQUIPMENT_PRESETS;
}

/**
 * Get preset by ID
 */
export function getPresetById(id: string): EquipmentPreset | undefined {
  return EQUIPMENT_PRESETS.find(preset => preset.id === id);
}

/**
 * Get presets filtered by category
 */
export function getPresetsByCategory(category: EquipmentPreset['category']): EquipmentPreset[] {
  return EQUIPMENT_PRESETS.filter(preset => preset.category === category);
}

/**
 * Get presets filtered by tags
 */
export function getPresetsByTag(tag: string): EquipmentPreset[] {
  return EQUIPMENT_PRESETS.filter(preset => preset.tags.includes(tag));
}

/**
 * Apply a preset to equipment slots
 * Returns the slots from the preset
 */
export function applyPreset(presetId: string): EquipmentSlot | null {
  const preset = getPresetById(presetId);
  if (!preset) return null;

  // Return a copy of the slots
  return { ...preset.slots };
}

/**
 * Check if current equipment slots match a specific preset
 * Useful for showing which preset is currently active
 */
export function getCurrentPreset(currentSlots: EquipmentSlot): string | null {
  for (const preset of EQUIPMENT_PRESETS) {
    if (slotsMatchPreset(currentSlots, preset.slots)) {
      return preset.id;
    }
  }
  return null;
}

/**
 * Check if two slot configurations match
 */
function slotsMatchPreset(slots1: EquipmentSlot, slots2: EquipmentSlot): boolean {
  const allSlots: (keyof EquipmentSlot)[] = [
    'head', 'torso', 'arms', 'hands', 'legs', 'feet',
    'back', 'waist', 'neck', 'mainHand', 'offHand'
  ];

  return allSlots.every(slot => slots1[slot] === slots2[slot]);
}

/**
 * Get preset status for UI display
 */
export interface PresetStatus {
  activePreset: string | null;
  isModified: boolean;
  lastAppliedPreset: string | null;
}

/**
 * Calculate preset status
 */
export function getPresetStatus(
  currentSlots: EquipmentSlot,
  lastAppliedPreset: string | null
): PresetStatus {
  const activePreset = getCurrentPreset(currentSlots);
  const isModified = lastAppliedPreset !== null && activePreset !== lastAppliedPreset;

  return {
    activePreset,
    isModified,
    lastAppliedPreset,
  };
}

/**
 * Merge preset slots with custom modifications
 * Useful when user wants to start with preset but customize specific slots
 */
export function mergeSlots(baseSlots: EquipmentSlot, overrides: Partial<EquipmentSlot>): EquipmentSlot {
  return {
    ...baseSlots,
    ...overrides,
  };
}
