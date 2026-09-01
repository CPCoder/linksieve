/**
 * Project:   LinkSieve
 * File:      logger.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

const DEBUG_STORAGE_KEY = "linksieveDebug";

function isDebugEnabled(): boolean
{
    try {
        return globalThis.localStorage?.getItem(DEBUG_STORAGE_KEY) === "1";
    } catch {
        return false;
    }
}

export function debug(...args: unknown[]): void
{
    if (isDebugEnabled()) {
        console.debug(`[${"LinkSieve"}]`, ...args);
    }
}

export function info(...args: unknown[]): void
{
    if (isDebugEnabled()) {
        console.info(`[${"LinkSieve"}]`, ...args);
    }
}

export function warn(...args: unknown[]): void
{
    console.warn(`[${"LinkSieve"}]`, ...args);
}

export function error(...args: unknown[]): void
{
    console.error(`[${"LinkSieve"}]`, ...args);
}