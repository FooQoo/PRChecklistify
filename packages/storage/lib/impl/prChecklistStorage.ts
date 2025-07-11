import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

// Type for PR checklist item
export interface PRChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// Type for PR data including checklist items
export interface PRData {
  uniqueId: string; // Using the uniqueId format: {owner}/{repo}#{prNumber}
  repositoryName: string;
  items: PRChecklistItem[];
}

// Type mapping for storage - each key is a PR identifier
export interface PRChecklistStorageData {
  [uniqueId: string]: PRData;
}

type PRChecklistStorage = BaseStorage<PRChecklistStorageData> & {
  // Add a new PR to storage
  addPR: (prData: PRData) => Promise<void>;
  // Get a specific PR's data
  getPR: (uniqueId: string) => Promise<PRData | undefined>;
  // Update a PR's checklist items
  updatePRItems: (uniqueId: string, items: PRChecklistItem[]) => Promise<void>;
  // Remove a PR from storage
  removePR: (uniqueId: string) => Promise<void>;
  // Toggle the completed status of a checklist item
  toggleItemStatus: (uniqueId: string, itemId: string) => Promise<void>;
};

const storage = createStorage<PRChecklistStorageData>(
  'pr-checklist-storage-key',
  {},
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

// Extended storage with custom methods for PR checklists
export const prChecklistStorage: PRChecklistStorage = {
  ...storage,

  // Add a new PR to storage or update an existing one
  addPR: async (prData: PRData) => {
    await storage.set(currentData => {
      return {
        ...currentData,
        [prData.uniqueId]: prData,
      };
    });
  },

  // Get a specific PR's data
  getPR: async (uniqueId: string) => {
    const data = await storage.get();
    return data[uniqueId];
  },

  // Update a PR's checklist items
  updatePRItems: async (uniqueId: string, items: PRChecklistItem[]) => {
    await storage.set(currentData => {
      if (!currentData[uniqueId]) {
        return currentData;
      }

      return {
        ...currentData,
        [uniqueId]: {
          ...currentData[uniqueId],
          items,
        },
      };
    });
  },

  // Remove a PR from storage
  removePR: async (uniqueId: string) => {
    await storage.set(currentData => {
      const { [uniqueId]: removed, ...rest } = currentData;
      void removed; // satisfy eslint for unused variable
      return rest;
    });
  },

  // Toggle the completed status of a checklist item
  toggleItemStatus: async (uniqueId: string, itemId: string) => {
    await storage.set(currentData => {
      if (!currentData[uniqueId]) {
        return currentData;
      }

      const updatedItems = currentData[uniqueId].items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      );

      return {
        ...currentData,
        [uniqueId]: {
          ...currentData[uniqueId],
          items: updatedItems,
        },
      };
    });
  },
};
