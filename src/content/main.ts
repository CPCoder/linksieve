/**
 * Project:   LinkSieve
 * File:      main.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com>
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { initializeContent } from "./index.js";

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            void initializeContent();
        },
        {
            once: true,
        },
    );
} else {
    void initializeContent();
}