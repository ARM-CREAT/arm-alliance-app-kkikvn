import type { WebSocket } from 'ws';

export interface Participant {
  id: string;
  name: string;
  ws: WebSocket;
  isHost: boolean;
  joinedAt: Date;
}

export interface Room {
  roomCode: string;
  participants: Map<string, Participant>;
}

// In-memory store: maps room codes to room data
const rooms = new Map<string, Room>();

/**
 * Get or create a room
 */
export function getOrCreateRoom(roomCode: string): Room {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      roomCode,
      participants: new Map(),
    });
  }
  return rooms.get(roomCode)!;
}

/**
 * Add a participant to a room
 */
export function addParticipant(
  roomCode: string,
  participantId: string,
  name: string,
  ws: WebSocket,
  isHost: boolean
): Participant {
  const room = getOrCreateRoom(roomCode);
  const participant: Participant = {
    id: participantId,
    name,
    ws,
    isHost,
    joinedAt: new Date(),
  };
  room.participants.set(participantId, participant);
  return participant;
}

/**
 * Remove a participant from a room
 */
export function removeParticipant(roomCode: string, participantId: string): Participant | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const participant = room.participants.get(participantId);
  room.participants.delete(participantId);

  // If room is empty, delete it
  if (room.participants.size === 0) {
    rooms.delete(roomCode);
  }

  return participant || null;
}

/**
 * Get all participants in a room
 */
export function getParticipants(roomCode: string): Participant[] {
  const room = rooms.get(roomCode);
  return room ? Array.from(room.participants.values()) : [];
}

/**
 * Get participant count for a room
 */
export function getParticipantCount(roomCode: string): number {
  const room = rooms.get(roomCode);
  return room ? room.participants.size : 0;
}

/**
 * Get a specific participant
 */
export function getParticipant(roomCode: string, participantId: string): Participant | null {
  const room = rooms.get(roomCode);
  return room ? room.participants.get(participantId) || null : null;
}

/**
 * Broadcast a message to all participants in a room
 */
export function broadcastToRoom(roomCode: string, message: any, excludeParticipantId?: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  room.participants.forEach((participant) => {
    if (excludeParticipantId && participant.id === excludeParticipantId) {
      return;
    }

    if (participant.ws.readyState === 1) { // WebSocket.OPEN = 1
      try {
        participant.ws.send(messageStr);
      } catch (error) {
        // Silently ignore send errors
      }
    }
  });
}

/**
 * Broadcast to all except sender
 */
export function broadcastToRoomExcludeSender(roomCode: string, message: any, senderParticipantId: string) {
  broadcastToRoom(roomCode, message, senderParticipantId);
}

/**
 * Send a message to a specific participant
 */
export function sendToParticipant(roomCode: string, participantId: string, message: any) {
  const participant = getParticipant(roomCode, participantId);
  if (participant && participant.ws.readyState === 1) {
    try {
      participant.ws.send(JSON.stringify(message));
    } catch (error) {
      // Silently ignore send errors
    }
  }
}

/**
 * Get all rooms
 */
export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}

/**
 * Check if a room exists
 */
export function roomExists(roomCode: string): boolean {
  return rooms.has(roomCode);
}
