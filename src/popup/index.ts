/**
 * Project:   LinkSieve
 * File:      index.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { getConfiguration } from "../shared/storage";

async function initialize(): Promise<void>
{
    const status = document.querySelector<HTMLElement>("#status");
    const options = document.querySelector<HTMLButtonElement>("#options");

    if (status === null || options === null) {
        return;
    }

    const configuration = await getConfiguration();

    status.textContent = configuration.enabled ? `${configuration.filters.length} filter(s) active` : "Filtering disabled";

    options.addEventListener("click", () => {
        void chrome.runtime.openOptionsPage();
    });
}

void initialize();