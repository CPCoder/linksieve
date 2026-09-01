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

vi.stubGlobal("chrome", {
    storage: {
        local: storage,
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

    it("uses defaults when a filter has an invalid match type", async () => {
        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: {
                enabled: true,
                filters: [
                    {
                        id: "invalid",
                        value: "example.com",
                        matchType: "contains",
                        enabled: true,
                    },
                ],
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

        expect(storage.set).toHaveBeenCalledWith({
            [STORAGE_KEY_CONFIGURATION]: {
                enabled: true,
                filters: [filter],
            },
        });
    });

    it("removes a filter", async () => {
        const configuration: FilterConfiguration = {
            enabled: true,
            filters: [
                {
                    id: "first",
                    value: "first.example",
                    matchType: "domain",
                    enabled: true,
                },
                {
                    id: "second",
                    value: "second.example",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        };

        storage.get.mockResolvedValue({
            [STORAGE_KEY_CONFIGURATION]: configuration,
        });
        storage.set.mockResolvedValue(undefined);

        await expect(removeFilter("first")).resolves.toEqual({
            enabled: true,
            filters: [configuration.filters[1]],
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

    it("does not modify other filters during an update", async () => {
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

        await expect(
            updateFilter("first", {
                enabled: false,
            }),
        ).resolves.toEqual({
            enabled: true,
            filters: [
                {
                    ...first,
                    enabled: false,
                },
                second,
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
});
