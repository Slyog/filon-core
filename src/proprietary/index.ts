/**
 * Proprietary Layer Entry Point
 * 
 * Exports all premium entrypoints (AI features, session logic, plugin API).
 * This module separates closed-source AI & premium logic from the public GPL core.
 * 
 * All modules in this directory are proprietary and not part of the GPL-licensed core.
 */

// Auto Layout Module
export * from "./modules/autoLayout";

// Describe to Edit Module
export * from "./modules/describeToEdit";

// Session Rooms Module
export * from "./modules/sessionRooms";

// Plugin API Module
export * from "./modules/pluginAPI";

