
// import { TechTreeNode, NodeStatus } from './types.js'; // Types removed

export const APP_STORAGE_KEYS = {
  PROJECT_COLLECTION: 'yggdrasilProjectCollection_v2.1',
  ACTIVE_PROJECT_ID: 'yggdrasilActiveProjectId_v2.1',
  TECH_TREE_HISTORY: 'techTreeHistory_v2.1',
  COLLAPSED_NODES: 'techTreeCollapsedNodes_v2.1',
  THEME_MODE: 'themeMode_v2.1',
  STARTUP_LOAD_LOGGED: 'startup_load_logged_v2.1',
  SIDEBAR_COLLAPSED_STATE: 'yggdrasilSidebarCollapsedState_v2.1',
  SIDEBAR_PANEL_STATES: 'yggdrasilSidebarPanelStates_v2.1', 
  ACTIVE_MAIN_VIEW: 'yggdrasilActiveMainView_v2.1',
  ACTIVE_WORKSPACE_SUB_TAB: 'yggdrasilActiveWorkspaceSubTab_v2.1', 
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
