/**
 * Project:   LinkSieve
 * File:      observer.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

export type MutationHandler = (mutations: MutationRecord[]) => void;

export class ContentObserver
{
    private readonly observer: MutationObserver;

    public constructor(handler: MutationHandler)
    {
        this.observer = new MutationObserver(handler);
    }

    public start(): void
    {
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    public stop(): void
    {
        this.observer.disconnect();
    }
}