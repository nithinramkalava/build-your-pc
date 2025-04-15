// src/lib/types.ts

export interface UserPreferencesJson {
    budget: number;
    useCases: {
        gaming?: { needed?: boolean; intensity?: number };
        videoEditing?: { needed?: boolean; intensity?: number };
        rendering3D?: { needed?: boolean; intensity?: number };
        programming?: { needed?: boolean; intensity?: number };
        officeWork?: { needed?: boolean; intensity?: number };
        streaming?: { needed?: boolean; intensity?: number };
    };
    technicalPreferences: {
        cpuPlatform?: string;
        gpuPlatform?: string;
        marketSegment?: string;
        formFactor?: string;
        rgbImportance?: number;
        noiseLevel?: string;
        upgradePathImportance?: number;
        storage?: {
            ssdCapacity?: string;
            hddCapacity?: string;
        };
        connectivity?: {
            wifi?: boolean;
            bluetooth?: boolean;
            usbPorts?: string;
        };
    };
    performancePriorities: {
        cpu?: number;
        gpu?: number;
        ram?: number;
        storageSpeed?: number;
    };
}

export interface Part {
    id: number;
    name: string;
    price: number | string | null; // Keep string for original format, use number for calculation
    // Add other potential fields needed during selection (e.g., tdp, compatibility keys)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Allows dynamic properties from DB results
    [key: string]: any; // Allow other properties fetched from DB or calculated
}

export type PartType =
    | 'cpu'
    | 'motherboard'
    | 'cooler'
    | 'gpu'
    | 'case'
    | 'psu'
    | 'memory' // Changed from ram to match Python/DB
    | 'storage';

export type SelectedParts = { [K in PartType]?: Part };