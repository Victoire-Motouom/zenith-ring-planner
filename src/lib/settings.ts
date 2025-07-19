import { db } from './database';

export const getSetting = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting "${key}":`, error);
    return defaultValue;
  }
};

export const setSetting = async <T>(key: string, value: T): Promise<void> => {
  try {
    await db.settings.put({ key, value });
  } catch (error) {
    console.error(`Error setting "${key}":`, error);
  }
};
