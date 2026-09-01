/**
 * Project:   LinkSieve
 * File:      index.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { getConfiguration } from "../shared/storage";
import {
    extractLinkedInJobId,
    resolveExternalApplicationUrl,
    matchesConfiguration,
} from "../shared/url";
import { debug } from "../shared/logger";
import { ContentObserver } from "./observer";

const APPLICATION_LINK_SELECTOR = "a[aria-label*='Apply on company website' i], a[href*='/safety/go/?url=']";

const JOB_CONTAINER_SELECTORS = [
    "li.jobs-search-results__list-item",
    "div.job-card-container",
    "div.jobs-search-results-list__list-item",
    "article",
];

const HIDDEN_CLASS = "linksieve-hidden";
const PROCESSED_ATTRIBUTE = "data-linksieve-processed";

function getApplicationUrl(
    anchor: HTMLAnchorElement,
): string | null
{
    const href = anchor.href;

    if (href === "") {
        return null;
    }

    return resolveExternalApplicationUrl(href);
}

function findJobContainer(
    element: Element,
): Element | null
{
    for (const selector of JOB_CONTAINER_SELECTORS) {
        const container = element.closest(selector);

        if (container !== null) {
            return container;
        }
    }

    return null;
}

function findApplicationLink(
    container: Element,
): HTMLAnchorElement | null
{
    const link = container.querySelector<HTMLAnchorElement>(APPLICATION_LINK_SELECTOR);

    if (link === null) {
        return null;
    }

    return link;
}

function filterJob(
    container: Element,
    applicationUrl: string,
    jobId: string | null,
): void
{
    container.classList.add(HIDDEN_CLASS);
    container.setAttribute(PROCESSED_ATTRIBUTE, "true");
    debug("LinkedIn job filtered.", { jobId, applicationUrl });
}

function markProcessed(container: Element): void
{
    container.setAttribute(PROCESSED_ATTRIBUTE, "true");
}

function isProcessed(container: Element): boolean
{
    return container.getAttribute(PROCESSED_ATTRIBUTE) === "true";
}

async function processJobContainer(
    container: Element,
): Promise<void>
{
    if (isProcessed(container)) {
        return;
    }

    const applicationLink = findApplicationLink(container);

    if (applicationLink === null) {
        return;
    }

    const applicationUrl = getApplicationUrl(applicationLink);

    if (applicationUrl === null) {
        markProcessed(container);
        return;
    }

    const configuration = await getConfiguration();
    const matches = matchesConfiguration(applicationUrl, configuration);
    const jobId = extractLinkedInJobId(window.location.href);

    markProcessed(container);

    if (!matches) {
        return;
    }

    filterJob(container, applicationUrl, jobId);
}

async function processElement(element: Element): Promise<void>
{
    if (element.matches(APPLICATION_LINK_SELECTOR)) {
        const container = findJobContainer(element);

        if (container !== null) {
            await processJobContainer(container);
        }

        return;
    }

    const applicationLink = element.querySelector<HTMLAnchorElement>(APPLICATION_LINK_SELECTOR);

    if (applicationLink === null) {
        return;
    }

    const container = findJobContainer(applicationLink);

    if (container !== null) {
        await processJobContainer(container);
    }
}

async function inspectExistingJobs(): Promise<void>
{
    const links = document.querySelectorAll<HTMLAnchorElement>(APPLICATION_LINK_SELECTOR);

    for (const link of links) {
        const container = findJobContainer(link);

        if (container !== null) {
            await processJobContainer(container);
        }
    }
}

async function initialize(): Promise<void>
{
    await inspectExistingJobs();

    const observer = new ContentObserver((element) => {
        void processElement(element);
    });

    observer.start();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        void initialize();
    }, {
        once: true,
    });
} else {
    void initialize();
}
