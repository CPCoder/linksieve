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

    private readonly processedElements = new WeakSet<Element>();

    public constructor(private readonly handler: ElementHandler)
    {
        this.observer = new MutationObserver((mutations) => this.handleMutations(mutations));
    }

    public start(): void
    {
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

                this.processElement(node);

                for (const element of node.querySelectorAll("*")) {
                    this.processElement(element);
                }
            }
        }
    }

    private processElement(element: Element): void
    {
        if (this.processedElements.has(element)) {
            return;
        }

        this.processedElements.add(element);
        this.handler(element);
    }
}