/**
 * Project:   LinkSieve
 * File:      storage.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import {
    DEFAULT_CONFIGURATION,
    STORAGE_KEY_CONFIGURATION,
} from "./constants";
import type { FilterConfiguration, StorageData } from "./types";

function getStorageArea(): chrome.storage.StorageArea
{
    return chrome.storage.local;
}

function cloneDefaultConfiguration(): FilterConfiguration
{
    return structuredClone(DEFAULT_CONFIGURATION);
}

function isFilterConfiguration(
    value: unknown,
): value is FilterConfiguration
{
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const configuration = value as Partial<FilterConfiguration>;

    return (typeof configuration.enabled === "boolean" && Array.isArray(configuration.filters));
}

export async function getConfiguration(): Promise<FilterConfiguration>
{
    const data = await getStorageArea().get(STORAGE_KEY_CONFIGURATION) as StorageData;

    if (!isFilterConfiguration(data.configuration)) {
        return cloneDefaultConfiguration();
    }

    return data.configuration;
}

export async function setConfiguration(
    configuration: FilterConfiguration,
): Promise<void>
{
    await getStorageArea().set({ [STORAGE_KEY_CONFIGURATION]: configuration });
}

export async function initializeStorage(): Promise<void>
{
    const data = await getStorageArea().get(STORAGE_KEY_CONFIGURATION) as StorageData;

    if (!isFilterConfiguration(data.configuration)) {
        await setConfiguration(cloneDefaultConfiguration());
    }
}