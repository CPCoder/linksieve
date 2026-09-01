/**
 * Project:     LinkSieve
 * File:        index.test.ts
 * Date:        2026-09-01
 * Author:      Steffen Haase <shworx.development@gmail.com
 * Copyright:   2026 SHWorX (Steffen Haase)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getConfiguration = vi.fn();

vi.mock("../../src/shared/storage", () => ({
    getConfiguration,
}));

vi.mock("../../src/shared/logger", () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
}));

describe("LinkedIn content integration", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        document.body.innerHTML = "";
        history.replaceState({}, "", "https://www.linkedin.com/jobs/view/4461086047");
    });

    it("hides a matching LinkedIn job card", async () => {
        getConfiguration.mockResolvedValue({
            enabled: true,
            filters: [
                {
                    id: "micro1-ai",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        });

        document.body.innerHTML = `
            <ul>
                <li class="jobs-search-results__list-item">
                    <div class="job-card-container">
                        <a
                            aria-label="Apply on company website"
                            href="https://www.linkedin.com/safety/go/?url=https%3A%2F%2Fjobs.micro1.ai%2Fpost%2F123"
                        >
                            Apply
                        </a>
                    </div>
                </li>
            </ul>
        `;

        await import("../../src/content/index");
        await new Promise((resolve) => setTimeout(resolve, 0));

        const job = document.querySelector(".jobs-search-results__list-item",);

        expect(job).not.toBeNull();
        expect(job?.classList.contains("linksieve-hidden")).toBe(true);
    });

    it("does not hide a non-matching job card", async () => {
        getConfiguration.mockResolvedValue({
            enabled: true,
            filters: [
                {
                    id: "micro1-ai",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        });

        document.body.innerHTML = `
            <ul>
                <li class="jobs-search-results__list-item">
                    <div class="job-card-container">
                        <a
                            aria-label="Apply on company website"
                            href="https://www.linkedin.com/safety/go/?url=https%3A%2F%2Fjobs.example.com%2Fpost%2F123"
                        >
                            Apply
                        </a>
                    </div>
                </li>
            </ul>
        `;

        await import("../../src/content/index");
        await new Promise((resolve) => setTimeout(resolve, 0));

        const job = document.querySelector(".jobs-search-results__list-item",);

        expect(job?.classList.contains("linksieve-hidden")).toBe(false);
    });

    it("does not hide a job when filtering is disabled", async () => {
        getConfiguration.mockResolvedValue({
            enabled: false,
            filters: [
                {
                    id: "micro1-ai",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        });

        document.body.innerHTML = `
            <ul>
                <li class="jobs-search-results__list-item">
                    <div class="job-card-container">
                        <a
                            aria-label="Apply on company website"
                            href="https://www.linkedin.com/safety/go/?url=https%3A%2F%2Fjobs.micro1.ai%2Fpost%2F123"
                        >
                            Apply
                        </a>
                    </div>
                </li>
            </ul>
        `;

        await import("../../src/content/index");
        await new Promise((resolve) => setTimeout(resolve, 0));

        const job = document.querySelector(".jobs-search-results__list-item",);

        expect(job?.classList.contains("linksieve-hidden")).toBe(false);
    });

    it("handles dynamically inserted job cards", async () => {
        getConfiguration.mockResolvedValue({
            enabled: true,
            filters: [
                {
                    id: "micro1-ai",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        });

        await import("../../src/content/index");

        const list = document.createElement("ul");

        document.body.appendChild(list);

        const job = document.createElement("li");
        job.className = "jobs-search-results__list-item";

        job.innerHTML = `
            <div class="job-card-container">
                <a
                    aria-label="Apply on company website"
                    href="https://www.linkedin.com/safety/go/?url=https%3A%2F%2Fjobs.micro1.ai%2Fpost%2F123"
                >
                    Apply
                </a>
            </div>
        `;

        list.appendChild(job);

        await new Promise((resolve) => setTimeout(resolve, 0));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(job.classList.contains("linksieve-hidden")).toBe(true);
    });

    it("ignores cards without an application URL", async () => {
        getConfiguration.mockResolvedValue({
            enabled: true,
            filters: [
                {
                    id: "micro1-ai",
                    value: "micro1.ai",
                    matchType: "domain",
                    enabled: true,
                },
            ],
        });

        document.body.innerHTML = `
            <ul>
                <li class="jobs-search-results__list-item">
                    <div class="job-card-container">
                        <a href="https://www.linkedin.com/jobs/view/123">
                            View job
                        </a>
                    </div>
                </li>
            </ul>
        `;

        await import("../../src/content/index");
        await new Promise((resolve) => setTimeout(resolve, 0));

        const job = document.querySelector(".jobs-search-results__list-item",);

        expect(job?.classList.contains("linksieve-hidden")).toBe(false);
    });
});