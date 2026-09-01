/**
 * Project:   LinkSieve
 * File:      index.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { initializeStorage } from "../shared/storage";
import { info } from "../shared/logger";

chrome.runtime.onInstalled.addListener(async () => {
    await initializeStorage();
    info("Extension installed or updated.");
});

chrome.runtime.onStartup.addListener(async () => {
    await initializeStorage();
    info("Extension started.");
});