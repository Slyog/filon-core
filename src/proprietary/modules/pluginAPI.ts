/**
 * Proprietary Module: Plugin API
 * 
 * Plugin system for extending FILON functionality.
 * This module is part of the proprietary layer and separated from the GPL core.
 */

export interface FilonPlugin {
  id: string;
  name: string;
  version: string;
  init: () => void | Promise<void>;
  unload: () => void | Promise<void>;
  onNodeCreate?: (nodeId: string) => void;
  onNodeUpdate?: (nodeId: string, data: any) => void;
  onNodeDelete?: (nodeId: string) => void;
}

const plugins = new Map<string, FilonPlugin>();

/**
 * Register a plugin
 * @param plugin - Plugin instance
 * @returns Success status
 */
export function registerPlugin(plugin: FilonPlugin): boolean {
  if (plugins.has(plugin.id)) {
    console.warn(`[PLUGIN_API] Plugin "${plugin.id}" is already registered`);
    return false;
  }
  
  try {
    plugins.set(plugin.id, plugin);
    
    // Initialize plugin
    const initResult = plugin.init();
    if (initResult instanceof Promise) {
      initResult.catch((err) => {
        console.error(`[PLUGIN_API] Plugin "${plugin.id}" init failed:`, err);
        plugins.delete(plugin.id);
      });
    }
    
    console.log(`[PLUGIN_API] Plugin registered: ${plugin.name} (${plugin.id})`);
    return true;
  } catch (err) {
    console.error(`[PLUGIN_API] Failed to register plugin "${plugin.id}":`, err);
    return false;
  }
}

/**
 * Unregister a plugin
 * @param id - Plugin ID
 * @returns Success status
 */
export function unregisterPlugin(id: string): boolean {
  const plugin = plugins.get(id);
  if (!plugin) {
    console.warn(`[PLUGIN_API] Plugin "${id}" not found`);
    return false;
  }
  
  try {
    // Unload plugin
    const unloadResult = plugin.unload();
    if (unloadResult instanceof Promise) {
      unloadResult.catch((err) => {
        console.error(`[PLUGIN_API] Plugin "${id}" unload failed:`, err);
      });
    }
    
    plugins.delete(id);
    console.log(`[PLUGIN_API] Plugin unregistered: ${id}`);
    return true;
  } catch (err) {
    console.error(`[PLUGIN_API] Failed to unregister plugin "${id}":`, err);
    return false;
  }
}

/**
 * Get plugin by ID
 * @param id - Plugin ID
 * @returns Plugin instance or null
 */
export function getPlugin(id: string): FilonPlugin | null {
  return plugins.get(id) || null;
}

/**
 * Get all registered plugins
 * @returns Array of all plugins
 */
export function getAllPlugins(): FilonPlugin[] {
  return Array.from(plugins.values());
}

/**
 * Check if plugin is registered
 * @param id - Plugin ID
 * @returns True if registered
 */
export function isPluginRegistered(id: string): boolean {
  return plugins.has(id);
}

/**
 * Notify plugins of node creation
 * @param nodeId - Created node ID
 */
export function notifyNodeCreate(nodeId: string): void {
  plugins.forEach((plugin) => {
    if (plugin.onNodeCreate) {
      try {
        plugin.onNodeCreate(nodeId);
      } catch (err) {
        console.error(`[PLUGIN_API] Plugin "${plugin.id}" onNodeCreate failed:`, err);
      }
    }
  });
}

/**
 * Notify plugins of node update
 * @param nodeId - Updated node ID
 * @param data - Updated data
 */
export function notifyNodeUpdate(nodeId: string, data: any): void {
  plugins.forEach((plugin) => {
    if (plugin.onNodeUpdate) {
      try {
        plugin.onNodeUpdate(nodeId, data);
      } catch (err) {
        console.error(`[PLUGIN_API] Plugin "${plugin.id}" onNodeUpdate failed:`, err);
      }
    }
  });
}

/**
 * Notify plugins of node deletion
 * @param nodeId - Deleted node ID
 */
export function notifyNodeDelete(nodeId: string): void {
  plugins.forEach((plugin) => {
    if (plugin.onNodeDelete) {
      try {
        plugin.onNodeDelete(nodeId);
      } catch (err) {
        console.error(`[PLUGIN_API] Plugin "${plugin.id}" onNodeDelete failed:`, err);
      }
    }
  });
}

/**
 * Clear all plugins (for testing/cleanup)
 */
export function clearAllPlugins(): void {
  plugins.forEach((plugin) => {
    try {
      const unloadResult = plugin.unload();
      if (unloadResult instanceof Promise) {
        unloadResult.catch((err) => {
          console.error(`[PLUGIN_API] Plugin "${plugin.id}" unload failed:`, err);
        });
      }
    } catch (err) {
      console.error(`[PLUGIN_API] Failed to unload plugin "${plugin.id}":`, err);
    }
  });
  
  plugins.clear();
  console.log("[PLUGIN_API] All plugins cleared");
}

