/**
 * Proprietary Module: Session Rooms
 * 
 * Private session system with Join Codes for collaborative workspaces.
 * This module is part of the proprietary layer and separated from the GPL core.
 * 
 * Note: Currently local-only mock; backend via Supabase planned for future.
 */

export interface SessionRoom {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  participantCount: number;
  isPrivate: boolean;
}

const ROOMS_STORAGE_KEY = "filon-session-rooms";
const rooms = new Map<string, SessionRoom>();

/**
 * Generate a random join code (6 alphanumeric characters)
 */
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new session room
 * @param name - Room name
 * @param isPrivate - Whether room is private (default: true)
 * @returns Join code for the room
 */
export function createSessionRoom(name: string, isPrivate = true): string {
  const code = generateJoinCode();
  const room: SessionRoom = {
    id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    code,
    createdAt: Date.now(),
    participantCount: 1,
    isPrivate,
  };
  
  rooms.set(code, room);
  
  // Persist to localStorage (mock)
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        localStorage.getItem(ROOMS_STORAGE_KEY) || "[]"
      ) as SessionRoom[];
      stored.push(room);
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(stored));
    } catch (err) {
      console.warn("[sessionRooms] Failed to persist room:", err);
    }
  }
  
  console.log(`[SESSION_ROOM] Created room "${name}" with code: ${code}`);
  return code;
}

/**
 * Join a session room by code
 * @param code - Join code
 * @returns Room object if found, null otherwise
 */
export function joinSessionRoom(code: string): SessionRoom | null {
  // Check in-memory cache first
  let room = rooms.get(code);
  
  // Check localStorage (mock)
  if (!room && typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        localStorage.getItem(ROOMS_STORAGE_KEY) || "[]"
      ) as SessionRoom[];
      room = stored.find((r) => r.code === code) || undefined;
      
      if (room) {
        rooms.set(code, room);
      }
    } catch (err) {
      console.warn("[sessionRooms] Failed to load rooms:", err);
    }
  }
  
  if (!room) {
    console.warn(`[SESSION_ROOM] Room not found for code: ${code}`);
    return null;
  }
  
  // Increment participant count
  room.participantCount += 1;
  rooms.set(code, room);
  
  console.log(`[SESSION_ROOM] Joined room "${room.name}" (code: ${code})`);
  return room;
}

/**
 * Get room by code
 * @param code - Join code
 * @returns Room object if found, null otherwise
 */
export function getRoomByCode(code: string): SessionRoom | null {
  return rooms.get(code) || null;
}

/**
 * List all available rooms (for debugging/admin)
 * @returns Array of all rooms
 */
export function listRooms(): SessionRoom[] {
  return Array.from(rooms.values());
}

/**
 * Leave a session room
 * @param code - Join code
 */
export function leaveSessionRoom(code: string): void {
  const room = rooms.get(code);
  if (room) {
    room.participantCount = Math.max(0, room.participantCount - 1);
    rooms.set(code, room);
    console.log(`[SESSION_ROOM] Left room "${room.name}" (code: ${code})`);
  }
}

/**
 * Delete a session room
 * @param code - Join code
 */
export function deleteSessionRoom(code: string): void {
  rooms.delete(code);
  
  // Remove from localStorage (mock)
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        localStorage.getItem(ROOMS_STORAGE_KEY) || "[]"
      ) as SessionRoom[];
      const filtered = stored.filter((r) => r.code !== code);
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn("[sessionRooms] Failed to delete room:", err);
    }
  }
  
  console.log(`[SESSION_ROOM] Deleted room with code: ${code}`);
}

/**
 * Load rooms from localStorage on init (mock)
 */
export function loadRoomsFromStorage(): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = JSON.parse(
      localStorage.getItem(ROOMS_STORAGE_KEY) || "[]"
    ) as SessionRoom[];
    
    stored.forEach((room) => {
      rooms.set(room.code, room);
    });
    
    console.log(`[SESSION_ROOM] Loaded ${stored.length} rooms from storage`);
  } catch (err) {
    console.warn("[sessionRooms] Failed to load rooms from storage:", err);
  }
}

