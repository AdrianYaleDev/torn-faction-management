// src/lib/user-service.ts
import { redis } from './redis';
import bcrypt from 'bcryptjs';

export const UserService = {
  async createUser(username: string, password: string) {
    const exists = await redis.exists(`user:${username}`);
    if (exists) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Store user object
    await redis.set(`user:${username}`, {
      username,
      password: hashedPassword,
      factionId: null, // To be filled later via API key
      trialStarted: Date.now(),
    });
    
    return { username };
  },

  async validateUser(username: string, password: string) {
    const user: any = await redis.get(`user:${username}`);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
};