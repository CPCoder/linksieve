/**
 * Project:   LinkSieve
 * File:      vitest.config.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com>
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: false,
        clearMocks: true,
        restoreMocks: true,
        projects: [
            {
                test: {
                    name: "unit",
                    include: [
                        "tests/**/*.test.ts",
                        "!tests/content/**/*.test.ts",
                    ],
                    environment: "node",
                },
            },
            {
                test: {
                    name: "content",
                    include: ["tests/content/**/*.test.ts"],
                    environment: "jsdom",
                },
            },
        ],
    },
});