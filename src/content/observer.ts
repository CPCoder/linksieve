/**
 * Project:   LinkSieve
 * File:      observer.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

export type ElementHandler = (element: Element) => void;

const OBSERVED_ATTRIBUTES = [
    "href",
    "aria-label",
];

const ELEMENT_NODE = 1;

function isElement(
    node: Node,
): node is Element
{
    return node.nodeType === ELEMENT_NODE;
}

export class ContentObserver
{
    private readonly observer: MutationObserver;

    public constructor(private readonly handler: ElementHandler)
    {
        this.observer = new MutationObserver(
            (mutations) => this.handleMutations(mutations),
        );
    }

    public start(): void
    {
        if (document.body === null) {
            return;
        }

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: OBSERVED_ATTRIBUTES,
        });
    }

    public stop(): void
    {
        this.observer.disconnect();
    }

    private handleMutations(mutations: MutationRecord[]): void
    {
        const elements = new Set<Element>();

        for (const mutation of mutations) {
            if (mutation.type === "attributes") {
                if (isElement(mutation.target)) {
                    elements.add(mutation.target);
                }

                continue;
            }

            for (const node of mutation.addedNodes) {
                if (!isElement(node)) {
                    continue;
                }

                elements.add(node);

                for (const element of node.querySelectorAll("*")) {
                    elements.add(element);
                }
            }

            if (mutation.removedNodes.length > 0) {
                if (isElement(mutation.target)) {
                    elements.add(mutation.target);
                }
            }
        }

        for (const element of elements) {
            this.handler(element);
        }
    }
}
