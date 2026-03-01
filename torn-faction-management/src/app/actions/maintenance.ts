// src/app/actions/maintenance.ts
'use server';

import { redis } from '@/src/lib/redis';

export async function clearAllUserData() {
  try {
    // 1. Find all keys starting with 'user:'
    const userKeys = await redis.keys('user:*');
    const pinKeys = await redis.keys('reset_pin:*');
    
    const allKeys = [...userKeys, ...pinKeys];

    if (allKeys.length === 0) {
      return { success: true, message: "Database already clean." };
    }

    // 2. Delete them
    await redis.del(...allKeys);

    console.log(`Successfully wiped ${allKeys.length} keys.`);
    return { success: true, message: `Wiped ${allKeys.length} keys. You can now register fresh.` };
  } catch (error: any) {
    console.error("Wipe failed:", error);
    return { success: false, message: error.message };
  }
}