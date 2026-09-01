/**
 * Project:   LinkSieve
 * File:      index.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com>
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import {
    getConfiguration,
    subscribeToConfigurationChanges,
} from "../shared/storage.js";
import {
    extractLinkedInJobId,
    matchesConfiguration,
    resolveExternalApplicationUrl,
} from "../shared/url.js";
import { LINKEDIN_ORIGIN } from "../shared/constants.js";
import { debug } from "../shared/logger.js";
import { ContentObserver } from "./observer.js";
import type { FilterConfiguration } from "../shared/types.js";

const APPLICATION_LINK_SELECTOR =
    'a[aria-label="Apply on company website"]';

const JOB_LINK_SELECTOR =
    'a[href*="/jobs/view/"]';

const JOB_CONTAINER_SELECTORS = [
    "li.jobs-search-results__list-item",
    "div.job-card-container",
    "div.jobs-search-results-list__list-item",
    "article",
];

const HIDDEN_CLASS = "linksieve-hidden";
const PROCESSED_ATTRIBUTE = "data-linksieve-processed";

const applicationUrlCache = new Map<string, string>();
const applicationUrlRequests = new Map<string, Promise<string | null>>();

let contentObserver: ContentObserver | null = null;
let configurationSubscription:
    ((configuration: FilterConfiguration) => void | Promise<void>)
    | null = null;

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

function findJobLink(
    container: Element,
): HTMLAnchorElement | null
{
    return container.querySelector<HTMLAnchorElement>(
        JOB_LINK_SELECTOR,
    );
}

export function extractJobIdFromContainer(
    container: Element,
): string | null
{
    const link = findJobLink(container);

    if (link === null) {
        return null;
    }

    return extractLinkedInJobId(link.href);
}

export function extractApplicationUrlFromHtml(
    html: string,
): string | null
{
    const parsedDocument = new DOMParser().parseFromString(
        html,
        "text/html",
    );

    const applicationLink =
        parsedDocument.querySelector<HTMLAnchorElement>(
            APPLICATION_LINK_SELECTOR,
        );

    if (applicationLink === null) {
        return null;
    }

    const href = applicationLink.getAttribute("href");

    if (href === null || href.trim() === "") {
        return null;
    }

    return resolveExternalApplicationUrl(href);
}

export async function fetchApplicationUrl(
    jobId: string,
): Promise<string | null>
{
    const cachedUrl = applicationUrlCache.get(jobId);

    if (cachedUrl !== undefined) {
        return cachedUrl;
    }

    const existingRequest = applicationUrlRequests.get(jobId);

    if (existingRequest !== undefined) {
        return existingRequest;
    }

    const request = (async (): Promise<string | null> => {
        try {
            const response = await fetch(
                `${LINKEDIN_ORIGIN}/jobs/view/${jobId}`,
                {
                    credentials: "include",
                },
            );

            if (!response.ok) {
                debug("Failed to fetch LinkedIn job page.", {
                    jobId,
                    status: response.status,
                });

                return null;
            }

            const html = await response.text();
            const applicationUrl =
                extractApplicationUrlFromHtml(html);

            if (applicationUrl !== null) {
                applicationUrlCache.set(
                    jobId,
                    applicationUrl,
                );
            }

            return applicationUrl;
        } catch (error) {
            debug("Failed to resolve LinkedIn application URL.", {
                jobId,
                error,
            });

            return null;
        } finally {
            applicationUrlRequests.delete(jobId);
        }
    })();

    applicationUrlRequests.set(jobId, request);

    return request;
}

function setJobVisibility(
    container: Element,
    hidden: boolean,
): void
{
    container.classList.toggle(HIDDEN_CLASS, hidden);
}

function markProcessed(
    container: Element,
): void
{
    container.setAttribute(
        PROCESSED_ATTRIBUTE,
        "true",
    );
}

function clearProcessed(
    container: Element,
): void
{
    container.removeAttribute(PROCESSED_ATTRIBUTE);
}

function isProcessed(
    container: Element,
): boolean
{
    return (
        container.getAttribute(PROCESSED_ATTRIBUTE) === "true"
    );
}

async function evaluateJobContainer(
    container: Element,
    configuration: FilterConfiguration,
): Promise<void>
{
    const jobId = extractJobIdFromContainer(container);

    if (jobId === null) {
        setJobVisibility(container, false);
        markProcessed(container);

        return;
    }

    const applicationUrl = await fetchApplicationUrl(jobId);

    if (applicationUrl === null) {
        setJobVisibility(container, false);
        markProcessed(container);

        return;
    }

    const matches = matchesConfiguration(
        applicationUrl,
        configuration,
    );

    setJobVisibility(container, matches);
    markProcessed(container);

    if (matches) {
        debug("LinkedIn job filtered.", {
            jobId,
            applicationUrl,
        });
    }
}

async function processJobContainer(
    container: Element,
    force = false,
): Promise<void>
{
    if (!force && isProcessed(container)) {
        return;
    }

    const configuration = await getConfiguration();

    await evaluateJobContainer(
        container,
        configuration,
    );
}

function findJobContainers(): Set<Element>
{
    const containers = new Set<Element>();

    const links = document.querySelectorAll<HTMLAnchorElement>(
        JOB_LINK_SELECTOR,
    );

    for (const link of links) {
        const container = findJobContainer(link);

        if (container !== null) {
            containers.add(container);
        }
    }

    return containers;
}

async function inspectExistingJobs(): Promise<void>
{
    const containers = findJobContainers();

    await Promise.all(
        [...containers].map((container) =>
            processJobContainer(container),
        ),
    );
}

async function reprocessExistingJobs(
    configuration: FilterConfiguration,
): Promise<void>
{
    const containers = findJobContainers();

    await Promise.all(
        [...containers].map(async (container) => {
            clearProcessed(container);

            await evaluateJobContainer(
                container,
                configuration,
            );
        }),
    );
}

async function processElement(
    element: Element,
): Promise<void>
{
    const directContainer = findJobContainer(element);

    if (directContainer !== null) {
        clearProcessed(directContainer);

        await processJobContainer(directContainer);

        return;
    }

    const jobLink = element.matches(JOB_LINK_SELECTOR)
                    ? element
                    : element.querySelector<HTMLAnchorElement>(
            JOB_LINK_SELECTOR,
        );

    if (jobLink === null) {
        return;
    }

    const container = findJobContainer(jobLink);

    if (container === null) {
        return;
    }

    clearProcessed(container);

    await processJobContainer(container);
}

export async function initializeContent(): Promise<void>
{
    await inspectExistingJobs();

    if (configurationSubscription === null) {
        configurationSubscription =
            async (configuration) => {
                await reprocessExistingJobs(configuration);
            };

        subscribeToConfigurationChanges(
            configurationSubscription,
        );
    }

    if (contentObserver === null) {
        contentObserver = new ContentObserver((element) => {
            void processElement(element);
        });

        contentObserver.start();
    }
}