/**
 * Project:   LinkSieve
 * File:      constants.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import type { FilterConfiguration } from "./types.js";

export const EXTENSION_NAME = "LinkSieve";
export const EXTENSION_VERSION = "0.1.0";

export const LINKEDIN_ORIGIN = "https://www.linkedin.com";
export const LINKEDIN_JOBS_PATH = "/jobs/";

export const STORAGE_KEY_CONFIGURATION = "configuration";

export const DEFAULT_CONFIGURATION: FilterConfiguration = {
    enabled: true,
    filters: [
        {
            id: "micro1-ai",
            value: "micro1.ai",
            matchType: "domain",
            enabled: true,
        },
    ],
};