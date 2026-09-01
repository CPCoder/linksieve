/**
 * Project:   LinkSieve
 * File:      observer.test.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    ContentObserver,
} from "../../src/content/observer";

function flushMutations(): Promise<void>
{
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

describe("ContentObserver", () => {
    beforeEach(() => {
        if (document.body === null) {
            document.documentElement.appendChild(
                document.createElement("body"),
            );
        }

        document.body.innerHTML = "";
    });

    it("processes newly added elements", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const element = document.createElement("div");

        document.body.appendChild(element);

        await flushMutations();

        expect(handler).toHaveBeenCalledWith(element);

        observer.stop();
    });

    it("processes descendants of newly added elements", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const container = document.createElement("div");
        const link = document.createElement("a");

        container.appendChild(link);
        document.body.appendChild(container);

        await flushMutations();

        expect(handler).toHaveBeenCalledWith(container);
        expect(handler).toHaveBeenCalledWith(link);

        observer.stop();
    });

    it("processes deeply nested descendants", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const container = document.createElement("div");
        const article = document.createElement("article");
        const link = document.createElement("a");

        article.appendChild(link);
        container.appendChild(article);
        document.body.appendChild(container);

        await flushMutations();

        expect(handler).toHaveBeenCalledWith(container);
        expect(handler).toHaveBeenCalledWith(article);
        expect(handler).toHaveBeenCalledWith(link);

        observer.stop();
    });

    it("deduplicates elements within a mutation batch", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const container = document.createElement("div");
        const link = document.createElement("a");

        container.appendChild(link);
        document.body.appendChild(container);

        link.setAttribute("aria-label", "Apply on company website");

        await flushMutations();

        expect(
            handler.mock.calls.filter(
                ([value]) => value === container,
            ),
        ).toHaveLength(1);

        expect(
            handler.mock.calls.filter(
                ([value]) => value === link,
            ),
        ).toHaveLength(1);

        observer.stop();
    });

    it("processes elements when observed attributes change", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const link = document.createElement("a");

        document.body.appendChild(link);

        await flushMutations();

        handler.mockClear();

        link.setAttribute(
            "href",
            "https://www.linkedin.com/safety/go/?url=https%3A%2F%2Fmicro1.ai",
        );

        await flushMutations();

        expect(handler).toHaveBeenCalledWith(link);

        observer.stop();
    });

    it("processes aria-label changes", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const link = document.createElement("a");

        document.body.appendChild(link);

        await flushMutations();

        handler.mockClear();

        link.setAttribute(
            "aria-label",
            "Apply on company website",
        );

        await flushMutations();

        expect(handler).toHaveBeenCalledWith(link);

        observer.stop();
    });

    it("ignores changes to unrelated attributes", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const element = document.createElement("div");

        document.body.appendChild(element);

        await flushMutations();

        handler.mockClear();

        element.setAttribute("class", "job-card");

        await flushMutations();

        expect(handler).not.toHaveBeenCalled();

        observer.stop();
    });

    it("processes an element again when it is reinserted", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const element = document.createElement("div");

        document.body.appendChild(element);

        await flushMutations();

        document.body.removeChild(element);
        document.body.appendChild(element);

        await flushMutations();

        expect(
            handler.mock.calls.filter(
                ([value]) => value === element,
            ),
        ).toHaveLength(2);

        observer.stop();
    });

    it("ignores non-element nodes", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        document.body.appendChild(
            document.createTextNode("LinkedIn job"),
        );

        await flushMutations();

        expect(handler).not.toHaveBeenCalled();

        observer.stop();
    });

    it("does nothing when the observer is stopped", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();
        observer.stop();

        document.body.appendChild(
            document.createElement("div"),
        );

        await flushMutations();

        expect(handler).not.toHaveBeenCalled();
    });

    it("does nothing when the document body does not exist", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        document.body.remove();

        observer.start();

        const element = document.createElement("div");

        element.setAttribute(
            "aria-label",
            "Apply on company website",
        );

        await flushMutations();

        expect(handler).not.toHaveBeenCalled();

        observer.stop();
    });

    it("processes the mutation target when an element is removed", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const container = document.createElement("div");
        const child = document.createElement("span");

        container.appendChild(child);
        document.body.appendChild(container);

        await flushMutations();

        handler.mockClear();

        container.removeChild(child);

        await flushMutations();

        expect(handler).toHaveBeenCalledWith(container);

        observer.stop();
    });
});
