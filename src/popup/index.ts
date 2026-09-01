/**
 * Project:   LinkSieve
 * File:      index.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import {
    getConfiguration,
    setFilteringEnabled,
    subscribeToConfigurationChanges,
} from "../shared/storage.js";
import type { FilterConfiguration } from "../shared/types.js";

const filteringState = document.querySelector<HTMLElement>("#filtering-state");
const filterCount = document.querySelector<HTMLElement>("#filter-count");
const filteringEnabled = document.querySelector<HTMLInputElement>("#filtering-enabled");
const optionsButton = document.querySelector<HTMLButtonElement>("#options-button");
const status = document.querySelector<HTMLElement>("#status");

function requireElement<T extends Element>(element: T | null, selector: string): T
{
    if (element === null) {
        throw new Error(`Required element not found: ${selector}`);
    }

    return element;
}

function render(configuration: FilterConfiguration): void
{
    const state = requireElement(filteringState, "#filtering-state");
    const count = requireElement(filterCount, "#filter-count");
    const enabled = requireElement(filteringEnabled, "#filtering-enabled");

    state.textContent = configuration.enabled ? "Enabled" : "Disabled";
    count.textContent = String(configuration.filters.filter((filter) => filter.enabled).length);
    enabled.checked = configuration.enabled;
}

function showStatus(message: string): void
{
    const element = requireElement(
        status,
        "#status",
    );

    element.textContent = message;
}

async function handleFilteringChange(enabled: boolean): Promise<void>
{
    const configuration = await setFilteringEnabled(enabled);

    render(configuration);
    showStatus("Saved");
}

function openOptions(): void
{
    const runtime = chrome.runtime;

    if (typeof runtime.openOptionsPage === "function") {
        void runtime.openOptionsPage();

        return;
    }

    showStatus("Options unavailable");
}

async function initialize(): Promise<void>
{
    const enabled = requireElement(filteringEnabled, "#filtering-enabled");
    const button = requireElement(optionsButton, "#options-button");
    const configuration = await getConfiguration();

    render(configuration);

    enabled.addEventListener("change", () => {
        void handleFilteringChange(enabled.checked);
    });

    button.addEventListener("click", openOptions);

    subscribeToConfigurationChanges((updatedConfiguration) => {
        render(updatedConfiguration);
    });
}

void initialize();