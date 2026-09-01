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
    getConfiguration,
    initializeStorage,
    setConfiguration,
} from "../../src/shared/storage";
import type { FilterConfiguration } from "../../src/shared/types";

const storage = { get: vi.fn(), set: vi.fn() };

vi.stubGlobal("chrome", {
    storage: { local: storage },
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
        const configuration: FilterConfiguration = { enabled: false, filters: [] };
        storage.get.mockResolvedValue({ [STORAGE_KEY_CONFIGURATION]: configuration });
        await expect(getConfiguration()).resolves.toEqual(configuration);
    });

    it("writes the configuration to storage", async () => {
        const configuration: FilterConfiguration = { enabled: true, filters: [] };
        storage.set.mockResolvedValue(undefined);
        await setConfiguration(configuration);

        expect(storage.set).toHaveBeenCalledWith({ [STORAGE_KEY_CONFIGURATION]: configuration });
    });

    it("initializes missing configuration", async () => {
        storage.get.mockResolvedValue({});
        storage.set.mockResolvedValue(undefined);
        await initializeStorage();

        expect(storage.set).toHaveBeenCalledWith({ [STORAGE_KEY_CONFIGURATION]: DEFAULT_CONFIGURATION });
    });

    it("does not overwrite an existing configuration", async () => {
        const configuration: FilterConfiguration = { enabled: false, filters: [] };
        storage.get.mockResolvedValue({ [STORAGE_KEY_CONFIGURATION]: configuration });
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

        await expect(getConfiguration()).resolves.toEqual(DEFAULT_CONFIGURATION);
    });
});