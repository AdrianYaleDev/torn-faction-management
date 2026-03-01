// src/lib/user-service.ts
import { redis } from './redis';
import bcrypt from 'bcryptjs';

export const UserService = {
  async createUser(username: string, email: string, password: string) {
    const exists = await redis.exists(`user:${username}`);
    if (exists) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Store user object with email
    await redis.set(`user:${username}`, {
      username,
      email, // Added this field
      password: hashedPassword,
      factionId: null,
      trialStarted: Date.now(),
    });
    
    return { username, email };
  },

  async validateUser(username: string, password: string) {
    const user: any = await redis.get(`user:${username}`);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  },

  async userExists(username: string): Promise<boolean> {
    const exists = await redis.exists(`user:${username}`);
    return exists === 1;
  },

  async updatePassword(username: string, newPassword: string) {
    const user: any = await redis.get(`user:${username}`);
    if (!user) throw new Error('User not found');

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await redis.set(`user:${username}`, user);
    return { success: true };
  },

  async linkFaction(username: string, encryptedKey: string, factionId: string) {
    // 1. Get the existing user
    const user: any = await redis.get(`user:${username}`);
    if (!user) throw new Error('User not found');

    // 2. Update the specific fields
    const updatedUser = {
      ...user,
      apiKey: encryptedKey,
      factionId: factionId
    };

    // 3. Save back to Redis
    await redis.set(`user:${username}`, updatedUser);
    return updatedUser;
  }
};