/**
 * Project:   LinkSieve
 * File:      index.test.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com>
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const chromeMock = vi.hoisted(() => ({
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
        },
        onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
    },
}));

vi.stubGlobal("chrome", chromeMock);

import {
    extractApplicationUrlFromHtml,
    extractJobIdFromContainer,
    fetchApplicationUrl,
} from "../../src/content/index.js";

const applicationUrl =
    "https://jobs.micro1.ai/post/" +
    "bd545591-e88e-48f9-b3a9-cd3716144c8f";

function createJobContainer(
    jobId = "4461086047",
): HTMLElement
{
    const container = document.createElement("li");

    container.className =
        "jobs-search-results__list-item";

    const link = document.createElement("a");

    link.href =
        `https://www.linkedin.com/jobs/view/${jobId}`;

    container.appendChild(link);
    document.body.appendChild(container);

    return container;
}

function createApplicationHtml(
    url = applicationUrl,
): string
{
    return `
        <!doctype html>
        <html>
            <body>
                <div>
                    <a
                        aria-label="Apply on company website"
                        href="https://www.linkedin.com/safety/go/?url=${encodeURIComponent(url)}"
                    >
                        Apply
                    </a>
                </div>
            </body>
        </html>
    `;
}

describe("content", () => {
    beforeEach(() => {
        document.body.innerHTML = "";

        chromeMock.storage.local.get.mockReset();
        chromeMock.storage.local.get.mockResolvedValue({});

        chromeMock.storage.local.set.mockReset();
        chromeMock.storage.local.set.mockResolvedValue(undefined);

        chromeMock.storage.onChanged.addListener.mockReset();
        chromeMock.storage.onChanged.removeListener.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("extractJobIdFromContainer", () => {
        it("extracts the LinkedIn job ID from a job card", () => {
            const container = createJobContainer();

            expect(
                extractJobIdFromContainer(container),
            ).toBe("4461086047");
        });

        it("returns null when the job card has no job link", () => {
            const container = document.createElement("li");

            container.className =
                "jobs-search-results__list-item";

            document.body.appendChild(container);

            expect(
                extractJobIdFromContainer(container),
            ).toBeNull();
        });

        it("returns null for a non-LinkedIn job link", () => {
            const container = document.createElement("li");
            const link = document.createElement("a");

            container.className =
                "jobs-search-results__list-item";

            link.href =
                "https://example.com/jobs/view/4461086047";

            container.appendChild(link);
            document.body.appendChild(container);

            expect(
                extractJobIdFromContainer(container),
            ).toBeNull();
        });
    });

    describe("extractApplicationUrlFromHtml", () => {
        it("extracts the external application URL", () => {
            expect(
                extractApplicationUrlFromHtml(
                    createApplicationHtml(),
                ),
            ).toBe(applicationUrl);
        });

        it("uses the semantic Apply link selector", () => {
            const html = `
                <a
                    class="random-linkedin-class"
                    aria-label="Apply on company website"
                    href="${applicationUrl}"
                >
                    Apply
                </a>
            `;

            expect(
                extractApplicationUrlFromHtml(html),
            ).toBe(applicationUrl);
        });

        it("does not depend on LinkedIn generated CSS classes", () => {
            const html = `
                <a
                    class="completely-different-class"
                    aria-label="Apply on company website"
                    href="${applicationUrl}"
                >
                    Apply
                </a>
            `;

            expect(
                extractApplicationUrlFromHtml(html),
            ).toBe(applicationUrl);
        });

        it("returns null when no external Apply link exists", () => {
            const html = `
                <a href="https://www.linkedin.com/jobs/view/123">
                    Apply
                </a>
            `;

            expect(
                extractApplicationUrlFromHtml(html),
            ).toBeNull();
        });

        it("returns null when the Apply link has no href", () => {
            const html = `
                <a aria-label="Apply on company website">
                    Apply
                </a>
            `;

            expect(
                extractApplicationUrlFromHtml(html),
            ).toBeNull();
        });
    });

    describe("fetchApplicationUrl", () => {
        it("fetches the authenticated LinkedIn job page", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(
                    new Response(
                        createApplicationHtml(),
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "text/html",
                            },
                        },
                    ),
                );

            await expect(
                fetchApplicationUrl("4461086047"),
            ).resolves.toBe(applicationUrl);

            expect(fetchMock).toHaveBeenCalledWith(
                "https://www.linkedin.com/jobs/view/4461086047",
                {
                    credentials: "include",
                },
            );
        });

        it("caches successful application URL resolutions", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(
                    new Response(
                        createApplicationHtml(),
                        {
                            status: 200,
                        },
                    ),
                );

            await fetchApplicationUrl("cached-job");
            await fetchApplicationUrl("cached-job");

            expect(fetchMock).toHaveBeenCalledOnce();
        });

        it("deduplicates simultaneous requests", async () => {
            let resolveResponse:
                ((response: Response) => void) | undefined;

            const responsePromise = new Promise<Response>(
                (resolve) => {
                    resolveResponse = resolve;
                },
            );

            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockReturnValue(responsePromise);

            const firstRequest =
                fetchApplicationUrl("duplicate-job");

            const secondRequest =
                fetchApplicationUrl("duplicate-job");

            expect(fetchMock).toHaveBeenCalledOnce();

            resolveResponse?.(
                new Response(
                    createApplicationHtml(),
                    {
                        status: 200,
                    },
                ),
            );

            await expect(firstRequest).resolves.toBe(
                applicationUrl,
            );

            await expect(secondRequest).resolves.toBe(
                applicationUrl,
            );
        });

        it("returns null for an unsuccessful response", async () => {
            vi.spyOn(globalThis, "fetch")
              .mockResolvedValue(
                  new Response(null, {
                      status: 404,
                  }),
              );

            await expect(
                fetchApplicationUrl("missing-job"),
            ).resolves.toBeNull();
        });

        it("returns null when fetching fails", async () => {
            vi.spyOn(globalThis, "fetch")
              .mockRejectedValue(
                  new Error("Network failure"),
              );

            await expect(
                fetchApplicationUrl("failed-job"),
            ).resolves.toBeNull();
        });

        it("returns null when no external application link exists", async () => {
            vi.spyOn(globalThis, "fetch")
              .mockResolvedValue(
                  new Response(
                      "<html><body>No Apply link</body></html>",
                      {
                          status: 200,
                      },
                  ),
              );

            await expect(
                fetchApplicationUrl("internal-job"),
            ).resolves.toBeNull();
        });
    });

});