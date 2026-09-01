/**
 * Project:   LinkSieve
 * File:      url.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com>
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import type {
    FilterConfiguration,
    FilterRule,
} from "./types.js";

const LINKEDIN_HOST = "www.linkedin.com";
const LINKEDIN_SAFETY_PATH = "/safety/go/";
const LINKEDIN_JOB_PATH_PATTERN = /^\/jobs\/view\/(\d+)(?:\/|$)/;
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

function isValidDomain(domain: string): boolean
{
    if (domain.length > 253) {
        return false;
    }

    const labels = domain.split(".");

    if (labels.some((label) => label === "" || label.length > 63)) {
        return false;
    }

    return labels.every((label) => DOMAIN_LABEL_PATTERN.test(label));
}

export function normalizeUrl(value: string): string | null
{
    const input = value.trim();

    if (input === "") {
        return null;
    }

    try {
        const url = new URL(input);

        url.hash = "";
        url.hostname = url.hostname.toLowerCase();

        if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) {
            url.port = "";
        }

        return url.toString();
    } catch {
        return null;
    }
}

export function getDomain(value: string): string | null
{
    const normalizedUrl = normalizeUrl(value);

    if (normalizedUrl === null) {
        return null;
    }

    try {
        return new URL(normalizedUrl).hostname;
    } catch {
        return null;
    }
}

export function normalizeDomain(value: string): string | null
{
    let domain = value.trim().toLowerCase();

    if (domain === "") {
        return null;
    }

    if (domain.includes("://")) {
        domain = getDomain(domain) ?? "";
    } else {
        domain = domain.split("/")[0] ?? "";
    }

    domain = domain.replace(/\.$/, "");

    if (domain === "" || !isValidDomain(domain)) {
        return null;
    }

    return domain;
}

export function matchesDomain(url: string, domain: string): boolean
{
    const hostname = getDomain(url);
    const normalizedDomain = normalizeDomain(domain);

    if (hostname === null || normalizedDomain === null) {
        return false;
    }

    return (hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`));
}

export function matchesUrl(url: string, filter: string): boolean
{
    const normalizedUrl = normalizeUrl(url);
    const normalizedFilter = normalizeUrl(filter);

    if (normalizedUrl === null || normalizedFilter === null) {
        return false;
    }

    return normalizedUrl === normalizedFilter;
}

export function matchesFilterRule(
    url: string,
    rule: FilterRule,
): boolean
{
    if (!rule.enabled) {
        return false;
    }

    switch (rule.matchType) {
        case "domain":
            return matchesDomain(url, rule.value);
        case "url":
            return matchesUrl(url, rule.value);
        default:
            return false;
    }
}

export function matchesConfiguration(
    url: string,
    configuration: FilterConfiguration,
): boolean
{
    if (!configuration.enabled) {
        return false;
    }

    return configuration.filters.some((rule) => matchesFilterRule(url, rule));
}

export function isLinkedInSafetyUrl(value: string): boolean
{
    const normalizedUrl = normalizeUrl(value);

    if (normalizedUrl === null) {
        return false;
    }

    try {
        const url = new URL(normalizedUrl);

        return (url.hostname === LINKEDIN_HOST && url.pathname === LINKEDIN_SAFETY_PATH);
    } catch {
        return false;
    }
}

export function extractLinkedInSafetyDestination(
    value: string,
): string | null
{
    const normalizedUrl = normalizeUrl(value);

    if (normalizedUrl === null || !isLinkedInSafetyUrl(normalizedUrl)) {
        return null;
    }

    try {
        const url = new URL(normalizedUrl);
        const destination = url.searchParams.get("url");

        if (destination === null || destination.trim() === "") {
            return null;
        }

        return normalizeUrl(destination);
    } catch {
        return null;
    }
}

export function resolveExternalApplicationUrl(
    value: string,
): string | null
{
    if (isLinkedInSafetyUrl(value)) {
        return extractLinkedInSafetyDestination(value);
    }

    return normalizeUrl(value);
}

export function extractLinkedInJobId(value: string): string | null
{
    const normalizedUrl = normalizeUrl(value);

    if (normalizedUrl === null) {
        return null;
    }

    try {
        const url = new URL(normalizedUrl);

        if (url.hostname !== LINKEDIN_HOST) {
            return null;
        }

        const match = url.pathname.match(LINKEDIN_JOB_PATH_PATTERN);

        return match?.[1] ?? null;
    } catch {
        return null;
    }
}
