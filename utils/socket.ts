// Socket utility
import { Server as IOServer, Socket } from 'socket.io';

export function emitToRoom(io: IOServer, roomId: string, event: string, data: any) {
  io.to(roomId).emit(event, data);
}

export function emitToUser(io: IOServer, userId: string, event: string, data: any) {
  io.to(userId).emit(event, data);
}
