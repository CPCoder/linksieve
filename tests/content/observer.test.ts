/**
 * Project:   LinkSieve
 * File:      observer.test.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { describe, expect, it, vi } from "vitest";
import { ContentObserver } from "../../src/content/observer";

describe("ContentObserver", () => {
    it("processes newly added elements", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const element = document.createElement("div");

        document.body.appendChild(element);

        await new Promise((resolve) => setTimeout(resolve, 0));

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

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(handler).toHaveBeenCalledWith(container);
        expect(handler).toHaveBeenCalledWith(link);
        observer.stop();
    });

    it("does not process the same element twice", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();

        const container = document.createElement("div");
        const link = document.createElement("a");

        container.appendChild(link);
        document.body.appendChild(container);

        await new Promise((resolve) => setTimeout(resolve, 0));

        document.body.removeChild(container);
        document.body.appendChild(container);

        await new Promise((resolve) => setTimeout(resolve, 0));
        const calls = handler.mock.calls.filter(([element]) => element === link);

        expect(calls).toHaveLength(1);
        observer.stop();
    });

    it("ignores non-element nodes", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();
        document.body.appendChild(document.createTextNode("LinkedIn job"));

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(handler).not.toHaveBeenCalled();
        observer.stop();
    });

    it("stops observing mutations", async () => {
        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();
        observer.stop();

        document.body.appendChild(document.createElement("div"));
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(handler).not.toHaveBeenCalled();
    });
});
