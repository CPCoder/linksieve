/*
 * Project:     linksieve
 * File:        index.test.ts
 * Date:        2026-09-01
 * Author:      Steffen Haase <shworx.development@gmail.com
 * Copyright:   2026 SHWorX (Steffen Haase)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getConfiguration = vi.fn();
const addFilter = vi.fn();
const removeFilter = vi.fn();
const setFilteringEnabled = vi.fn();
const updateFilter = vi.fn();

vi.mock("../../src/shared/storage", () => ({
    getConfiguration,
    addFilter,
    removeFilter,
    setFilteringEnabled,
    updateFilter,
}));

describe("options page", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        document.body.innerHTML = `
            <input id="filtering-enabled" type="checkbox">

            <form id="filter-form">
                <input
                    id="filter-value"
                    name="value"
                    type="text"
                >

                <select id="filter-match-type">
                    <option value="domain">Domain</option>
                    <option value="url">Exact URL</option>
                </select>

                <button type="submit">Add filter</button>
            </form>

            <p id="form-error" hidden></p>
            <p id="save-message" hidden></p>
            <div id="filter-list"></div>
        `;

        getConfiguration.mockResolvedValue({
            enabled: true,
            filters: [],
        });
    });

    it("loads the current configuration", async () => {
        await import("../../src/options/index");

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(getConfiguration).toHaveBeenCalledOnce();

        expect(
            document.querySelector<HTMLInputElement>(
                "#filtering-enabled",
            )?.checked,
        ).toBe(true);
    });

    it("adds a domain filter", async () => {
        const configuration = {
            enabled: true,
            filters: [],
        };

        const updatedConfiguration = {
            enabled: true,
            filters: [
                {
                    id: "generated-id",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        };

        getConfiguration.mockResolvedValue(configuration);
        addFilter.mockResolvedValue(updatedConfiguration);

        vi.stubGlobal("crypto", {
            randomUUID: vi.fn().mockReturnValue("generated-id"),
        });

        await import("../../src/options/index");

        await new Promise((resolve) => setTimeout(resolve, 0));

        const value = document.querySelector<HTMLInputElement>(
            "#filter-value",
        );

        const form = document.querySelector<HTMLFormElement>(
            "#filter-form",
        );

        if (value === null || form === null) {
            throw new Error("Test DOM initialization failed.");
        }

        value.value = "  MICRO1.AI  ";

        form.dispatchEvent(
            new Event("submit", {
                bubbles: true,
                cancelable: true,
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(addFilter).toHaveBeenCalledWith({
            id: "generated-id",
            value: "micro1.ai",
            matchType: "domain",
            enabled: true,
        });
    });

    it("rejects an invalid domain", async () => {
        await import("../../src/options/index");

        await new Promise((resolve) => setTimeout(resolve, 0));

        const value = document.querySelector<HTMLInputElement>(
            "#filter-value",
        );

        const form = document.querySelector<HTMLFormElement>(
            "#filter-form",
        );

        if (value === null || form === null) {
            throw new Error("Test DOM initialization failed.");
        }

        value.value = "not a valid domain";

        form.dispatchEvent(
            new Event("submit", {
                bubbles: true,
                cancelable: true,
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(addFilter).not.toHaveBeenCalled();

        expect(
            document.querySelector("#form-error")?.textContent,
        ).toBe("Enter a valid domain.");
    });

    it("adds an exact URL filter", async () => {
        const updatedConfiguration = {
            enabled: true,
            filters: [
                {
                    id: "generated-id",
                    value: "https://example.com/jobs/123",
                    matchType: "url",
                    enabled: true,
                },
            ],
        };

        addFilter.mockResolvedValue(updatedConfiguration);

        vi.stubGlobal("crypto", {
            randomUUID: vi.fn().mockReturnValue("generated-id"),
        });

        await import("../../src/options/index");

        await new Promise((resolve) => setTimeout(resolve, 0));

        const value = document.querySelector<HTMLInputElement>(
            "#filter-value",
        );

        const type = document.querySelector<HTMLSelectElement>(
            "#filter-match-type",
        );

        const form = document.querySelector<HTMLFormElement>(
            "#filter-form",
        );

        if (value === null || type === null || form === null) {
            throw new Error("Test DOM initialization failed.");
        }

        type.value = "url";
        value.value = "HTTPS://Example.COM/jobs/123#section";

        form.dispatchEvent(
            new Event("submit", {
                bubbles: true,
                cancelable: true,
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(addFilter).toHaveBeenCalledWith({
            id: "generated-id",
            value: "https://example.com/jobs/123",
            matchType: "url",
            enabled: true,
        });
    });

    it("rejects duplicate filters", async () => {
        getConfiguration.mockResolvedValue({
            enabled: true,
            filters: [
                {
                    id: "existing",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        });

        await import("../../src/options/index");

        await new Promise((resolve) => setTimeout(resolve, 0));

        const value = document.querySelector<HTMLInputElement>(
            "#filter-value",
        );

        const form = document.querySelector<HTMLFormElement>(
            "#filter-form",
        );

        if (value === null || form === null) {
            throw new Error("Test DOM initialization failed.");
        }

        value.value = "MICRO1.AI";

        form.dispatchEvent(
            new Event("submit", {
                bubbles: true,
                cancelable: true,
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(addFilter).not.toHaveBeenCalled();

        expect(
            document.querySelector("#form-error")?.textContent,
        ).toBe("This filter already exists.");
    });

    it("updates the global filtering state", async () => {
        const updatedConfiguration = {
            enabled: false,
            filters: [],
        };

        setFilteringEnabled.mockResolvedValue(
            updatedConfiguration,
        );

        await import("../../src/options/index");

        await new Promise((resolve) => setTimeout(resolve, 0));

        const enabled = document.querySelector<HTMLInputElement>(
            "#filtering-enabled",
        );

        if (enabled === null) {
            throw new Error("Test DOM initialization failed.");
        }

        enabled.checked = false;

        enabled.dispatchEvent(
            new Event("change", {
                bubbles: true,
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(
            setFilteringEnabled,
        ).toHaveBeenCalledWith(false);
    });

    it("removes a filter", async () => {
        getConfiguration.mockResolvedValue({
            enabled: true,
            filters: [
                {
                    id: "existing",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        });

        removeFilter.mockResolvedValue({
            enabled: true,
            filters: [],
        });

        await import("../../src/options/index");

        await new Promise((resolve) => setTimeout(resolve, 0));

        const removeButton =
            document.querySelector<HTMLButtonElement>(
                ".filter-item__remove",
            );

        if (removeButton === null) {
            throw new Error("Remove button was not rendered.");
        }

        removeButton.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(removeFilter).toHaveBeenCalledWith("existing");
    });

    it("updates an individual filter", async () => {
        getConfiguration.mockResolvedValue({
            enabled: true,
            filters: [
                {
                    id: "existing",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        });

        updateFilter.mockResolvedValue({
            enabled: true,
            filters: [
                {
                    id: "existing",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: false,
                },
            ],
        });

        await import("../../src/options/index");

        await new Promise((resolve) => setTimeout(resolve, 0));

        const checkbox =
            document.querySelector<HTMLInputElement>(
                ".filter-item input[type='checkbox']",
            );

        if (checkbox === null) {
            throw new Error("Filter checkbox was not rendered.");
        }

        checkbox.checked = false;

        checkbox.dispatchEvent(
            new Event("change", {
                bubbles: true,
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(updateFilter).toHaveBeenCalledWith(
            "existing",
            {
                enabled: false,
            },
        );
    });
});
