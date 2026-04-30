import Dexie from 'dexie';
import type { SystemEntry } from '@/engines/shared/types';

export class LinearSystemsDB extends Dexie {
  systems!: Dexie.Table<SystemEntry, string>;

  constructor() {
    super('linear_systems');
    this.version(1).stores({
      systems: 'id, method, createdAt',
    });
  }
}

export const db = new LinearSystemsDB();

export async function saveSystem(entry: SystemEntry): Promise<string> {
  return db.systems.add(entry);
}

export async function getSystems(): Promise<SystemEntry[]> {
  return db.systems.orderBy('createdAt').reverse().toArray();
}

export async function deleteSystem(id: string): Promise<void> {
  return db.systems.delete(id);
}

export async function clearAllSystems(): Promise<void> {
  return db.systems.clear();
}
