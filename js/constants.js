
export const APP_STORAGE_KEYS = {
  PROJECT_COLLECTION: 'yggdrasilProjectCollection_v2.1',
  ACTIVE_PROJECT_ID: 'yggdrasilActiveProjectId_v2.1',
  TECH_TREE_HISTORY: 'techTreeHistory_v2.1',
  COLLAPSED_NODES: 'techTreeCollapsedNodes_v2.1',
  THEME_MODE: 'themeMode_v2.1',
  STARTUP_LOAD_LOGGED: 'startup_load_logged_v2.1',
  SIDEBAR_COLLAPSED_STATE: 'yggdrasilSidebarCollapsedState_v2.1',
  SIDEBAR_PANEL_STATES: 'yggdrasilSidebarPanelStates_v2.1',
  WORKSPACE_PANEL_STATES: 'yggdrasilWorkspacePanelStates_v2.1',
  ACTIVE_MAIN_VIEW: 'yggdrasilActiveMainView_v2.1',
};

export const ELF_WARFARE_STRUCTURE_JSON_STRING = `
{
  "tree": {
    "id": "elf-warfare-root-example-v1",
    "name": "Elven Warfare Doctrines",
    "description": "Core principles of elven combat strategies, focusing on agility, precision, and harmony with nature.",
    "importance": "major",
    "isLocked": false,
    "children": [
      {
        "id": "elf-archery-example-v1",
        "name": "Masterful Archery",
        "description": "Techniques for elven longbows, including volley fire, pinpoint accuracy, and enchanted arrows.",
        "importance": "common",
        "children": [
          {
            "id": "elf-arrow-crafting-example-v1",
            "name": "Arrow Crafting & Enchantment",
            "description": "Fletching specialized arrows and imbuing them with minor magical properties.",
            "importance": "minor",
            "children": []
          }
        ]
      },
      {
        "id": "natures-embrace",
        "name": "Nature's Embrace",
        "description": "Integration of natural magic and creatures into military operations. This branch can explore links to deeper nature magic.",
        "importance": "common",
        "children": [
          {
            "id": "druidic-healing",
            "name": "Druidic Healing",
            "description": "Develop advanced nature-based healing for troops.",
            "isLocked": false,
            "importance": "common",
            "children": []
          }
        ]
      },
      {
        "id": "elf-blade-dancing-example-v1",
        "name": "Blade Dancing Combat",
        "description": "Fluid and graceful close-quarters combat with dual blades or sword and dagger.",
        "importance": "common",
        "children": []
      }
    ]
  }
}
`;

export const NODE_IMPORTANCE_OPTIONS = [
    { value: 'minor', label: 'Minor', rune: '🌱' },
    { value: 'common', label: 'Common', rune: '🌿' },
    { value: 'major', label: 'Major', rune: '🌳' },
];

// Derived map for direct lookup, avoiding duplication.
export const NODE_IMPORTANCE_RUNES = NODE_IMPORTANCE_OPTIONS.reduce((acc, { value, rune }) => {
    acc[value] = rune;
    return acc;
}, {});

export const EVENT_TYPE_INFO = {
    // AI
    'TREE_INIT_AI': { icon: '🧠', color: 'var(--primary-accent)', isKey: true, keywords: ['generated'] },
    'AI_MOD_CONFIRMED': { icon: '🤖', color: 'var(--primary-accent)', isKey: true, keywords: ['applied'] },
    'AI_MOD_REJECTED': { icon: '🚫', color: 'var(--text-tertiary)', isKey: false, keywords: ['rejected', 'discarded'] },
    'AI_MOD_UNDONE': { icon: '↩️', color: 'var(--warning-color)', isKey: true, keywords: ['undone', 'reverted', 'cancelled'] },
    'NODE_INSIGHTS_GENERATED': { icon: '💡', color: 'var(--primary-accent-dark)', isKey: true, keywords: ['generated'] },
    'AI_STRATEGY_GEN': { icon: '✨', color: 'var(--primary-accent-dark)', isKey: true, keywords: ['generated'] },
    'AI_SUMMARY_GEN': { icon: '📜', color: 'var(--primary-accent-dark)', isKey: true, keywords: ['generated'] },
    'TREE_MOD_AI': { icon: '🤖', color: 'var(--text-secondary)', isKey: true, keywords: ['proposed', 'modifications'] },

    // Node Ops
    'NODE_CREATED': { icon: '➕', color: 'var(--success-color)', isKey: true, keywords: ['created', 'added'] },
    'NODE_UPDATED': { icon: '✏️', color: 'var(--text-secondary)', isKey: true, keywords: ['updated', 'changed', 'renamed'] },
    'NODE_DELETED': { icon: '🗑️', color: 'var(--error-color)', isKey: true, keywords: ['deleted', 'removed'] },
    'NODE_LOCK_TOGGLED': { icon: '🔒', color: 'var(--text-secondary)', isKey: true, keywords: ['locked', 'unlocked'] },
    'NODE_IMPORTANCE_CHANGED': { icon: '⚖️', color: 'var(--text-secondary)', isKey: true, keywords: ['changed'] },

    // Project Linking
    'NODE_PROJECT_LINK_CREATED': { icon: '🔗', color: 'var(--secondary-accent-dark)', isKey: true, keywords: ['linked'] },
    'NODE_PROJECT_LINK_REMOVED': { icon: '🚫', color: 'var(--secondary-accent-dark)', isKey: true, keywords: ['unlinked'] },

    // Tree-wide
    'TREE_LOCK_ALL': { icon: '🛡️', color: 'var(--warning-color)', isKey: true, keywords: ['locked'] },
    'TREE_UNLOCK_ALL': { icon: '🛡️', color: 'var(--warning-color)', isKey: true, keywords: ['unlocked'] },
    'TREE_DOWNLOADED': { icon: '📥', color: 'var(--text-secondary)', isKey: false, keywords: ['downloaded'] },
    'TREE_DATA_EXTRACTED': { icon: '📤', color: 'var(--text-secondary)', isKey: false, keywords: ['extracted'] },

    // Project Management
    'PROJECT_CREATED': { icon: '📁', color: 'var(--success-color)', isKey: true, keywords: ['created', 'saved'] },
    'PROJECT_LOADED': { icon: '📂', color: 'var(--text-primary)', isKey: true, keywords: ['loaded', 'activated'] },
    'PROJECT_SAVED': { icon: '💾', color: 'var(--text-secondary)', isKey: false, keywords: ['saved'] },
    'PROJECT_RENAMED': { icon: '✏️', color: 'var(--text-primary)', isKey: true, keywords: ['renamed'] },
    'PROJECT_DELETED': { icon: '🗑️', color: 'var(--error-color)', isKey: true, keywords: ['deleted'] },
    'PROJECT_IMPORTED': { icon: '📄', color: 'var(--success-color)', isKey: true, keywords: ['imported'] },
    'PROJECT_EXAMPLE_LOADED': { icon: '⭐', color: 'var(--text-primary)', isKey: true, keywords: ['started', 'loaded'] },

    // System & Misc
    'API_KEY_STATUS_CHANGED': { icon: '🔑', color: 'var(--text-secondary)', isKey: false, keywords: ['set', 'cleared'] },
    'APP_ERROR_ENCOUNTERED': { icon: '⚠️', color: 'var(--error-color)', isKey: true, keywords: ['failed'] },
    'THEME_CHANGED': { icon: '🎨', color: 'var(--text-tertiary)', isKey: false, keywords: ['switched'] },
    'VIEW_CHANGED': { icon: '👁️', color: 'var(--text-tertiary)', isKey: false, keywords: ['opened', 'closed', 'changed'] },
    'HISTORY_CLEARED': { icon: '🧹', color: 'var(--text-tertiary)', isKey: false, keywords: ['cleared'] },

    // Default
    'default': { icon: '🔹', color: 'var(--text-tertiary)', isKey: false, keywords: [] }
};

export const ADVANCED_NATURE_MAGIC_JSON_STRING = `
{
  "tree": {
    "id": "nature-magic-root-example-v1", 
    "name": "Advanced Nature Magic",
    "description": "Deep understanding and manipulation of natural forces, flora, and fauna.",
    "importance": "major",
    "isLocked": false,
    "children": [
      {
        "id": "elemental-attunement-example-v1",
        "name": "Elemental Attunement",
        "description": "Channeling the power of earth, air, fire, and water for potent spells.",
        "importance": "common",
        "children": [
          {
            "id": "geomancy-example-v1",
            "name": "Geomancy",
            "description": "Shaping stone and earth, creating barriers or tremors.",
            "importance": "minor",
            "children": []
          },
          {
            "id": "aeromancy-example-v1",
            "name": "Aeromancy",
            "description": "Controlling winds, summoning gusts, or creating localized storms.",
            "importance": "minor",
            "children": []
          }
        ]
      },
      {
        "id": "druidic-shapeshifting-example-v1",
        "name": "Druidic Shapeshifting",
        "description": "Assuming potent animal forms (bear, wolf, eagle) for various combat and utility purposes.",
        "importance": "common",
        "children": []
      },
      {
        "id": "flora-manipulation-example-v1",
        "name": "Verdant Growth & Flora Control",
        "description": "Accelerating plant growth, animating plants for defense, or creating entangling vines.",
        "importance": "common",
        "children": []
      }
    ]
  }
}
`;
