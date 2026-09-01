/**
 * Project:   LinkSieve
 * File:      index.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { ContentObserver } from "./observer";
import { debug } from "../shared/logger";

function initialize(): void
{
    const observer = new ContentObserver((mutations) => {
        debug("LinkedIn DOM mutations detected.", mutations.length);
    });

    observer.start();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
    initialize();
}