/**
 * Proprietary Module: Describe to Edit
 * 
 * Natural Language parser that converts simple string commands into graph modifications.
 * This module is part of the proprietary layer and separated from the GPL core.
 */

import type { Node, Edge } from "reactflow";

export interface GraphCommand {
  verb: string;
  target?: string;
  relation?: string;
  object?: string;
  nodeId?: string;
}

export interface GraphModifier {
  onConnect: (source: string, target: string) => void;
  setNodeType: (nodeId: string, type: string) => void;
  addNode: (label: string, type?: string) => void;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<Node["data"]>) => void;
}

/**
 * Parse natural language command into structured command
 * @param input - Natural language string (e.g., "connect A to B")
 * @returns Parsed command object
 */
export function parseCommand(input: string): GraphCommand | null {
  const trimmed = input.trim().toLowerCase();
  
  // Pattern: "connect A to B"
  const connectMatch = trimmed.match(/^connect\s+(\w+)\s+to\s+(\w+)$/);
  if (connectMatch) {
    return {
      verb: "connect",
      target: connectMatch[1],
      object: connectMatch[2],
    };
  }
  
  // Pattern: "make X a Y" or "set X as Y"
  const makeMatch = trimmed.match(/^(make|set)\s+(\w+)\s+(?:a|as)\s+(\w+)$/);
  if (makeMatch) {
    return {
      verb: "make",
      target: makeMatch[2],
      object: makeMatch[3],
    };
  }
  
  // Pattern: "add X" or "create X"
  const addMatch = trimmed.match(/^(add|create)\s+(.+)$/);
  if (addMatch) {
    return {
      verb: "add",
      object: addMatch[2],
    };
  }
  
  // Pattern: "delete X" or "remove X"
  const deleteMatch = trimmed.match(/^(delete|remove)\s+(\w+)$/);
  if (deleteMatch) {
    return {
      verb: "delete",
      target: deleteMatch[2],
    };
  }
  
  // Pattern: "update X with Y"
  const updateMatch = trimmed.match(/^update\s+(\w+)\s+with\s+(.+)$/);
  if (updateMatch) {
    return {
      verb: "update",
      target: updateMatch[1],
      object: updateMatch[2],
    };
  }
  
  return null;
}

/**
 * Execute parsed command on graph via modifier callbacks
 * @param command - Parsed command
 * @param nodes - Current nodes (for finding by label)
 * @param modifier - Graph modifier callbacks
 * @returns Success status
 */
export function executeCommand(
  command: GraphCommand,
  nodes: Node[],
  modifier: GraphModifier
): boolean {
  try {
    switch (command.verb) {
      case "connect": {
        if (!command.target || !command.object) return false;
        
        // Find nodes by label (case-insensitive)
        const sourceNode = nodes.find(
          (n) => n.data.label?.toLowerCase() === command.target?.toLowerCase()
        );
        const targetNode = nodes.find(
          (n) => n.data.label?.toLowerCase() === command.object?.toLowerCase()
        );
        
        if (sourceNode && targetNode) {
          modifier.onConnect(sourceNode.id, targetNode.id);
          return true;
        }
        return false;
      }
      
      case "make":
      case "set": {
        if (!command.target || !command.object) return false;
        
        const node = nodes.find(
          (n) => n.data.label?.toLowerCase() === command.target?.toLowerCase()
        );
        
        if (node) {
          modifier.setNodeType(node.id, command.object);
          return true;
        }
        return false;
      }
      
      case "add":
      case "create": {
        if (!command.object) return false;
        modifier.addNode(command.object);
        return true;
      }
      
      case "delete":
      case "remove": {
        if (!command.target) return false;
        
        const node = nodes.find(
          (n) => n.data.label?.toLowerCase() === command.target?.toLowerCase()
        );
        
        if (node) {
          modifier.deleteNode(node.id);
          return true;
        }
        return false;
      }
      
      case "update": {
        if (!command.target || !command.object) return false;
        
        const node = nodes.find(
          (n) => n.data.label?.toLowerCase() === command.target?.toLowerCase()
        );
        
        if (node) {
          modifier.updateNode(node.id, { label: command.object });
          return true;
        }
        return false;
      }
      
      default:
        return false;
    }
  } catch (err) {
    console.error("[describeToEdit] Command execution failed:", err);
    return false;
  }
}

/**
 * Process natural language input and execute on graph
 * @param input - Natural language string
 * @param nodes - Current nodes
 * @param modifier - Graph modifier callbacks
 * @returns Success status
 */
export function processNaturalLanguage(
  input: string,
  nodes: Node[],
  modifier: GraphModifier
): boolean {
  const command = parseCommand(input);
  if (!command) {
    console.warn("[describeToEdit] Failed to parse command:", input);
    return false;
  }
  
  return executeCommand(command, nodes, modifier);
}

