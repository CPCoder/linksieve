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
import type {
    FilterConfiguration,
    FilterRule,
    StorageData,
} from "./types";

function getStorageArea(): chrome.storage.StorageArea
{
    return chrome.storage.local;
}

function cloneDefaultConfiguration(): FilterConfiguration
{
    return structuredClone(DEFAULT_CONFIGURATION);
}

function isFilterRule(value: unknown): value is FilterRule
{
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const rule = value as Partial<FilterRule>;

    return (
        typeof rule.id === "string" &&
        typeof rule.value === "string" &&
        (rule.matchType === "domain" || rule.matchType === "url") &&
        typeof rule.enabled === "boolean"
    );
}

function isFilterConfiguration(
    value: unknown,
): value is FilterConfiguration
{
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const configuration = value as Partial<FilterConfiguration>;

    return (
        typeof configuration.enabled === "boolean" &&
        Array.isArray(configuration.filters) &&
        configuration.filters.every(isFilterRule)
    );
}

export async function getConfiguration(): Promise<FilterConfiguration>
{
    const data = await getStorageArea().get(
        STORAGE_KEY_CONFIGURATION,
    ) as StorageData;

    if (!isFilterConfiguration(data.configuration)) {
        return cloneDefaultConfiguration();
    }

    return data.configuration;
}

export async function setConfiguration(
    configuration: FilterConfiguration,
): Promise<void>
{
    await getStorageArea().set({
        [STORAGE_KEY_CONFIGURATION]: configuration,
    });
}

export async function initializeStorage(): Promise<void>
{
    const data = await getStorageArea().get(
        STORAGE_KEY_CONFIGURATION,
    ) as StorageData;

    if (!isFilterConfiguration(data.configuration)) {
        await setConfiguration(cloneDefaultConfiguration());
    }
}

export async function addFilter(
    filter: FilterRule,
): Promise<FilterConfiguration>
{
    const configuration = await getConfiguration();

    const updatedConfiguration: FilterConfiguration = {
        ...configuration,
        filters: [
            ...configuration.filters,
            filter,
        ],
    };

    await setConfiguration(updatedConfiguration);

    return updatedConfiguration;
}

export async function removeFilter(
    filterId: string,
): Promise<FilterConfiguration>
{
    const configuration = await getConfiguration();

    const updatedConfiguration: FilterConfiguration = {
        ...configuration,
        filters: configuration.filters.filter(
            (filter) => filter.id !== filterId,
        ),
    };

    await setConfiguration(updatedConfiguration);

    return updatedConfiguration;
}

export async function updateFilter(
    filterId: string,
    update: Partial<Omit<FilterRule, "id">>,
): Promise<FilterConfiguration>
{
    const configuration = await getConfiguration();

    const updatedConfiguration: FilterConfiguration = {
        ...configuration,
        filters: configuration.filters.map((filter) =>
            filter.id === filterId
            ? { ...filter, ...update }
            : filter,
        ),
    };

    await setConfiguration(updatedConfiguration);

    return updatedConfiguration;
}

export async function setFilteringEnabled(
    enabled: boolean,
): Promise<FilterConfiguration>
{
    const configuration = await getConfiguration();

    const updatedConfiguration: FilterConfiguration = {
        ...configuration,
        enabled,
    };

    await setConfiguration(updatedConfiguration);

    return updatedConfiguration;
}

export function subscribeToConfigurationChanges(
    listener: (
        configuration: FilterConfiguration,
    ) => void | Promise<void>,
): () => void
{
    const handleChange = (
        changes: Record<string, chrome.storage.StorageChange>,
    ): void => {
        const change = changes[STORAGE_KEY_CONFIGURATION];

        if (change === undefined) {
            return;
        }

        if (!isFilterConfiguration(change.newValue)) {
            return;
        }

        void listener(change.newValue);
    };

    chrome.storage.onChanged.addListener(handleChange);

    return () => {
        chrome.storage.onChanged.removeListener(handleChange);
    };
}
