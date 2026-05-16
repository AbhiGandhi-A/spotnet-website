// Example: User model interface for MongoDB

import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  username: string;
  password: string;
  profileImage?: string;
  friends: ObjectId[];
  friendRequests: ObjectId[];
  sessions: ObjectId[];
  notifications: ObjectId[];
  rooms: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  online: boolean;
}

// Add other interfaces (Session, Friend, Room, etc.) in this file as needed.
