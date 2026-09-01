/**
 * Project:   LinkSieve
 * File:      storage.test.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    DEFAULT_CONFIGURATION,
    STORAGE_KEY_CONFIGURATION,
} from "../../src/shared/constants";
import {
    addFilter,
    getConfiguration,
    initializeStorage,
    removeFilter,
    setConfiguration,
    setFilteringEnabled,
    subscribeToConfigurationChanges,
    updateFilter,
} from "../../src/shared/storage";
import type {
    FilterConfiguration,
    FilterRule,
} from "../../src/shared/types";

const storage = {
    get: vi.fn(),
    set: vi.fn(),
};

const storageOnChanged = {
    addListener: vi.fn(),
    removeListener: vi.fn(),
};

vi.stubGlobal("chrome", {
    storage: {
        local: storage,
        onChanged: storageOnChanged,
    },
});

describe("storage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the default configuration when storage is empty", async () => {
        storage.get.mockResolvedValue({});

        const configuration = await getConfiguration();

        expect(configuration).toEqual(DEFAULT_CONFIGURATION);
        expect(configuration).not.toBe(DEFAULT_CONFIGURATION);
    });

    it("returns the stored configuration", async () => {
        const configuration: FilterConfiguration = {
            enabled: false,
            filters: [],
        };

        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: configuration,
        });

        await expect(getConfiguration()).resolves.toEqual(
            configuration,
        );
    });

    it("writes the configuration to storage", async () => {
        const configuration: FilterConfiguration = {
            enabled: true,
            filters: [],
        };

        storage.set.mockResolvedValue(undefined);

        await setConfiguration(configuration);

        expect(storage.set).toHaveBeenCalledWith({
            [STORAGE_KEY_CONFIGURATION]: configuration,
        });
    });

    it("initializes missing configuration", async () => {
        storage.get.mockResolvedValue({});
        storage.set.mockResolvedValue(undefined);

        await initializeStorage();

        expect(storage.set).toHaveBeenCalledWith({
            [STORAGE_KEY_CONFIGURATION]: DEFAULT_CONFIGURATION,
        });
    });

    it("does not overwrite an existing configuration", async () => {
        const configuration: FilterConfiguration = {
            enabled: false,
            filters: [],
        };

        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: configuration,
        });

        await initializeStorage();

        expect(storage.set).not.toHaveBeenCalled();
    });

    it("uses defaults for malformed configuration", async () => {
        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: {
                enabled: "yes",
                filters: "invalid",
            },
        });

        await expect(getConfiguration()).resolves.toEqual(
            DEFAULT_CONFIGURATION,
        );
    });

    it("adds a filter", async () => {
        const configuration: FilterConfiguration = {
            enabled: true,
            filters: [],
        };

        const filter: FilterRule = {
            id: "example",
            value: "example.com",
            matchType: "domain",
            enabled: true,
        };

        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: configuration,
        });
        storage.set.mockResolvedValue(undefined);

        await expect(addFilter(filter)).resolves.toEqual({
            enabled: true,
            filters: [filter],
        });
    });

    it("removes a filter", async () => {
        const first: FilterRule = {
            id: "first",
            value: "first.example",
            matchType: "domain",
            enabled: true,
        };

        const second: FilterRule = {
            id: "second",
            value: "second.example",
            matchType: "domain",
            enabled: true,
        };

        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: {
                enabled: true,
                filters: [first, second],
            },
        });
        storage.set.mockResolvedValue(undefined);

        await expect(removeFilter("first")).resolves.toEqual({
            enabled: true,
            filters: [second],
        });
    });

    it("updates a filter", async () => {
        const filter: FilterRule = {
            id: "example",
            value: "example.com",
            matchType: "domain",
            enabled: true,
        };

        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: {
                enabled: true,
                filters: [filter],
            },
        });
        storage.set.mockResolvedValue(undefined);

        await expect(
            updateFilter("example", {
                enabled: false,
                value: "jobs.example.com",
            }),
        ).resolves.toEqual({
            enabled: true,
            filters: [
                {
                    ...filter,
                    enabled: false,
                    value: "jobs.example.com",
                },
            ],
        });
    });

    it("changes the global filtering state", async () => {
        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: {
                enabled: true,
                filters: [],
            },
        });
        storage.set.mockResolvedValue(undefined);

        await expect(setFilteringEnabled(false)).resolves.toEqual({
            enabled: false,
            filters: [],
        });
    });

    it("subscribes to configuration changes", () => {
        const listener = vi.fn();

        subscribeToConfigurationChanges(listener);

        expect(
            storageOnChanged.addListener,
        ).toHaveBeenCalledOnce();
    });

    it("passes valid configuration changes to the listener", () => {
        const listener = vi.fn();

        subscribeToConfigurationChanges(listener);

        // @ts-ignore
        const callback = storageOnChanged.addListener.mock.calls[0][0];

        const configuration: FilterConfiguration = {
            enabled: true,
            filters: [
                {
                    id: "example",
                    value: "example.com",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        };

        callback({
            [STORAGE_KEY_CONFIGURATION]: {
                oldValue: DEFAULT_CONFIGURATION,
                newValue: configuration,
            },
        });

        expect(listener).toHaveBeenCalledWith(configuration);
    });

    it("ignores unrelated storage changes", () => {
        const listener = vi.fn();

        subscribeToConfigurationChanges(listener);

        // @ts-ignore
        const callback = storageOnChanged.addListener.mock.calls[0][0];

        callback({
            unrelated: {
                oldValue: false,
                newValue: true,
            },
        });

        expect(listener).not.toHaveBeenCalled();
    });

    it("ignores malformed configuration changes", () => {
        const listener = vi.fn();

        subscribeToConfigurationChanges(listener);

        // @ts-ignore
        const callback = storageOnChanged.addListener.mock.calls[0][0];

        callback({
            [STORAGE_KEY_CONFIGURATION]: {
                newValue: {
                    enabled: "invalid",
                    filters: [],
                },
            },
        });

        expect(listener).not.toHaveBeenCalled();
    });

    it("returns an unsubscribe function", () => {
        const unsubscribe = subscribeToConfigurationChanges(
            vi.fn(),
        );

        unsubscribe();

        expect(storageOnChanged.removeListener).toHaveBeenCalledOnce();
        // @ts-ignore
        expect(storageOnChanged.removeListener).toHaveBeenCalledWith(storageOnChanged.addListener.mock.calls[0][0]);
    });
});
