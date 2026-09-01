/**
 * Project:   LinkSieve
 * File:      vitest.config.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

// @ts-ignore
import { defineConfig } from "vitest/config";

// @ts-ignore
export default defineConfig({
    test: {
        environment: "node",
        globals: false,
        clearMocks: true,
        restoreMocks: true,
        include: ["tests/**/*.test.ts"],
    },
});