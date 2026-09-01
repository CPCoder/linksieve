/**
 * Project:   LinkSieve
 * File:      url.test.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { describe, expect, it } from "vitest";
import {
    extractLinkedInJobId,
    extractLinkedInSafetyDestination,
    getDomain,
    isLinkedInSafetyUrl,
    matchesDomain,
    matchesUrl,
    normalizeDomain,
    normalizeUrl,
    resolveExternalApplicationUrl,
} from "../../src/shared/url";

describe("normalizeUrl", () => {
    it("normalizes a valid URL", () => {
        expect(
            normalizeUrl(" HTTPS://Example.COM/path#section "),
        ).toBe("https://example.com/path");
    });

    it("removes default ports", () => {
        expect(normalizeUrl("https://example.com:443/path")).toBe(
            "https://example.com/path",
        );
    });

    it("returns null for invalid URLs", () => {
        expect(normalizeUrl("not a URL")).toBeNull();
    });
});

describe("getDomain", () => {
    it("extracts the hostname", () => {
        expect(
            getDomain("https://jobs.example.com/path"),
        ).toBe("jobs.example.com");
    });

    it("returns null for invalid URLs", () => {
        expect(getDomain("invalid")).toBeNull();
    });
});

describe("normalizeDomain", () => {
    it("normalizes a plain domain", () => {
        expect(normalizeDomain(" Example.COM/ ")).toBe(
            "example.com",
        );
    });

    it("accepts a URL", () => {
        expect(normalizeDomain("https://jobs.example.com/path")).toBe(
            "jobs.example.com",
        );
    });

    it("returns null for an empty value", () => {
        expect(normalizeDomain("")).toBeNull();
    });
});

describe("matchesDomain", () => {
    it("matches the exact domain", () => {
        expect(
            matchesDomain("https://micro1.ai/jobs/123", "micro1.ai"),
        ).toBe(true);
    });

    it("matches a subdomain", () => {
        expect(
            matchesDomain(
                "https://jobs.micro1.ai/post/123",
                "micro1.ai",
            ),
        ).toBe(true);
    });

    it("does not match an unrelated domain", () => {
        expect(
            matchesDomain(
                "https://example.com/jobs/micro1.ai",
                "micro1.ai",
            ),
        ).toBe(false);
    });

    it("does not match a similar-looking domain", () => {
        expect(
            matchesDomain(
                "https://micro1.ai.example.com/job",
                "micro1.ai",
            ),
        ).toBe(false);
    });

    it("does not match a suffix without a domain boundary", () => {
        expect(
            matchesDomain(
                "https://notmicro1.ai/job",
                "micro1.ai",
            ),
        ).toBe(false);
    });
});

describe("matchesUrl", () => {
    it("matches equivalent normalized URLs", () => {
        expect(
            matchesUrl(
                "HTTPS://Example.COM/job/123#section",
                "https://example.com/job/123",
            ),
        ).toBe(true);
    });

    it("does not perform substring matching", () => {
        expect(
            matchesUrl(
                "https://example.com/job/123",
                "https://example.com/job",
            ),
        ).toBe(false);
    });
});

describe("isLinkedInSafetyUrl", () => {
    it("detects LinkedIn safety URLs", () => {
        expect(
            isLinkedInSafetyUrl(
                "https://www.linkedin.com/safety/go/?url=https%3A%2F%2Fexample.com",
            ),
        ).toBe(true);
    });

    it("rejects ordinary LinkedIn URLs", () => {
        expect(
            isLinkedInSafetyUrl(
                "https://www.linkedin.com/jobs/view/123",
            ),
        ).toBe(false);
    });

    it("rejects safety paths on other domains", () => {
        expect(
            isLinkedInSafetyUrl(
                "https://example.com/safety/go/?url=https%3A%2F%2Ffoo.com",
            ),
        ).toBe(false);
    });
});

describe("extractLinkedInSafetyDestination", () => {
    it("extracts and normalizes the destination URL", () => {
        const value =
            "https://www.linkedin.com/safety/go/?" +
            "url=https%3A%2F%2Fjobs.micro1.ai%2Fpost%2F123";

        expect(extractLinkedInSafetyDestination(value)).toBe(
            "https://jobs.micro1.ai/post/123",
        );
    });

    it("returns null when there is no destination", () => {
        expect(
            extractLinkedInSafetyDestination(
                "https://www.linkedin.com/safety/go/",
            ),
        ).toBeNull();
    });

    it("returns null for invalid destinations", () => {
        expect(
            extractLinkedInSafetyDestination(
                "https://www.linkedin.com/safety/go/?url=invalid",
            ),
        ).toBeNull();
    });

    it("returns null for non-safety URLs", () => {
        expect(
            extractLinkedInSafetyDestination(
                "https://www.linkedin.com/jobs/view/123",
            ),
        ).toBeNull();
    });
});

describe("resolveExternalApplicationUrl", () => {
    it("resolves a LinkedIn safety redirect", () => {
        const value =
            "https://www.linkedin.com/safety/go/?" +
            "url=https%3A%2F%2Fjobs.micro1.ai%2Fpost%2F123";

        expect(resolveExternalApplicationUrl(value)).toBe(
            "https://jobs.micro1.ai/post/123",
        );
    });

    it("normalizes a direct external URL", () => {
        expect(
            resolveExternalApplicationUrl(
                "HTTPS://Jobs.Example.COM/application#section",
            ),
        ).toBe("https://jobs.example.com/application");
    });

    it("returns null for invalid URLs", () => {
        expect(resolveExternalApplicationUrl("invalid")).toBeNull();
    });
});

describe("extractLinkedInJobId", () => {
    it("extracts a job ID from a standard LinkedIn job URL", () => {
        expect(
            extractLinkedInJobId(
                "https://www.linkedin.com/jobs/view/4461086047",
            ),
        ).toBe("4461086047");
    });

    it("extracts a job ID with query parameters", () => {
        expect(
            extractLinkedInJobId(
                "https://www.linkedin.com/jobs/view/4461086047/?trackingId=abc",
            ),
        ).toBe("4461086047");
    });

    it("returns null for a non-job LinkedIn URL", () => {
        expect(
            extractLinkedInJobId(
                "https://www.linkedin.com/feed/",
            ),
        ).toBeNull();
    });

    it("returns null for a non-LinkedIn URL", () => {
        expect(
            extractLinkedInJobId(
                "https://example.com/jobs/view/4461086047",
            ),
        ).toBeNull();
    });

    it("returns null for an invalid URL", () => {
        expect(extractLinkedInJobId("invalid")).toBeNull();
    });
});