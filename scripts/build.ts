/**
 * Project:   LinkSieve
 * File:      build.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com>
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = join(root, "dist");

type Browser = "chrome" | "firefox";

const entryPoints = [
    "background/index.ts",
    "content/index.ts",
    "popup/index.ts",
    "options/index.ts",
];

async function bundleSource(): Promise<void>
{
    for (const entryPoint of entryPoints) {
        await esbuild({
            entryPoints: [join(root, "src", entryPoint)],
            bundle: true,
            format: "iife",
            platform: "browser",
            target: "es2022",
            sourcemap: true,
            outfile: join(
                distDirectory,
                "shared-build",
                entryPoint.replace(/\.ts$/, ".js"),
            ),
            logLevel: "info",
        });
    }
}

async function prepareBrowserDirectory(
    browser: Browser,
): Promise<void>
{
    const outputDirectory = join(distDirectory, browser);

    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });

    await cp(
        join(root, "src", "manifest", `${browser}.json`),
        join(outputDirectory, "manifest.json"),
    );

    await cp(
        join(root, "src", "content", "styles.css"),
        join(outputDirectory, "content", "styles.css"),
    );

    await cp(
        join(root, "src", "popup", "index.html"),
        join(outputDirectory, "popup", "index.html"),
    );

    await cp(
        join(root, "src", "popup", "styles.css"),
        join(outputDirectory, "popup", "styles.css"),
    );

    await cp(
        join(root, "src", "options", "index.html"),
        join(outputDirectory, "options", "index.html"),
    );

    await cp(
        join(root, "src", "options", "styles.css"),
        join(outputDirectory, "options", "styles.css"),
    );

    await cp(
        join(root, "public", "icons"),
        join(outputDirectory, "icons"),
        { recursive: true },
    );

    for (const entryPoint of entryPoints) {
        const relativePath = entryPoint.replace(/\.ts$/, ".js");
        const source = join(
            distDirectory,
            "shared-build",
            relativePath,
        );
        const destination = join(outputDirectory, relativePath);

        await mkdir(dirname(destination), { recursive: true });
        await cp(source, destination);
    }
}

async function build(): Promise<void>
{
    const requestedBrowser = process.argv[2];

    if (
        requestedBrowser !== undefined
        && requestedBrowser !== "chrome"
        && requestedBrowser !== "firefox"
    ) {
        throw new Error(`Unsupported browser: ${requestedBrowser}`);
    }

    await rm(distDirectory, { recursive: true, force: true });
    await mkdir(distDirectory, { recursive: true });

    await bundleSource();

    if (requestedBrowser === undefined) {
        await prepareBrowserDirectory("chrome");
        await prepareBrowserDirectory("firefox");
        return;
    }

    await prepareBrowserDirectory(requestedBrowser);

    await rm(join(distDirectory, "shared-build"), {
        recursive: true,
        force: true,
    });
}

await build();
