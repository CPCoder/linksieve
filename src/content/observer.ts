/**
 * Project:   LinkSieve
 * File:      observer.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

export type ElementHandler = (element: Element) => void;

export class ContentObserver
{
    private readonly observer: MutationObserver;

    public constructor(private readonly handler: ElementHandler)
    {
        this.observer = new MutationObserver((mutations) => this.handleMutations(mutations));
    }

    public start(): void
    {
        if (document.body === null) {
            return;
        }

        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    public stop(): void
    {
        this.observer.disconnect();
    }

    private handleMutations(mutations: MutationRecord[]): void
    {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof Element)) {
                    continue;
                }

                this.handler(node);

                for (const element of node.querySelectorAll("*")) {
                    this.handler(element);
                }
            }
        }
    }
}
