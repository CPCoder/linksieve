/**
 * Project:   LinkSieve
 * File:      index.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { ContentObserver } from "./observer";
import {
    extractLinkedInJobId,
    resolveExternalApplicationUrl,
} from "../shared/url";
import { debug } from "../shared/logger";

const APPLICATION_LINK_SELECTOR = "a[aria-label*='Apply on company website' i], a[href*='/safety/go/?url=']";

function getApplicationUrl(anchor: HTMLAnchorElement): string | null
{
    const href = anchor.href;

    if (href === "") {
        return null;
    }

    return resolveExternalApplicationUrl(href);
}

function handleElement(element: Element): void
{
    if (!(element instanceof HTMLAnchorElement)) {
        return;
    }

    if (!element.matches(APPLICATION_LINK_SELECTOR)) {
        return;
    }

    const applicationUrl = getApplicationUrl(element);

    if (applicationUrl === null) {
        return;
    }

    const jobId = extractLinkedInJobId(window.location.href);
    debug("External application URL discovered.", { jobId, applicationUrl });
}

function inspectExistingLinks(): void
{
    for (const element of document.querySelectorAll(APPLICATION_LINK_SELECTOR)) {
        handleElement(element);
    }
}

function initialize(): void
{
    inspectExistingLinks();
    const observer = new ContentObserver(handleElement);
    observer.start();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
    initialize();
}