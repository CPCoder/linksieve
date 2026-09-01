import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentObserver } from "../../src/content/observer";

describe("ContentObserver", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.stubGlobal("document", { body: {} });
    });

    it("creates and starts a MutationObserver", () => {
        const observe = vi.fn();
        const disconnect = vi.fn();

        vi.stubGlobal(
            "MutationObserver",
            class {
                public observe = observe;
                public disconnect = disconnect;
                public constructor(_callback: MutationCallback) {}
            },
        );

        const handler = vi.fn();
        const observer = new ContentObserver(handler);

        observer.start();
        expect(observe).toHaveBeenCalledWith(document.body, { childList: true, subtree: true });
    });

    it("disconnects the MutationObserver", () => {
        const disconnect = vi.fn();

        vi.stubGlobal(
            "MutationObserver",
            class {
                public observe(): void {}
                public disconnect = disconnect;
                public constructor(_callback: MutationCallback) {}
            },
        );

        const observer = new ContentObserver(vi.fn());

        observer.stop();
        expect(disconnect).toHaveBeenCalledOnce();
    });
});