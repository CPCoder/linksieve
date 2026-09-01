/**
 * Project:   LinkSieve
 * File:      build.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildDirectory = join(root, "build");
const distDirectory = join(root, "dist");

type Browser = "chrome" | "firefox";

async function runTypeScriptBuild(): Promise<void>
{
    await execFileAsync(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["tsc", "-p", "tsconfig.build.json"],
        { cwd: root },
    );
}

async function prepareBrowserDirectory(
    browser: Browser,
): Promise<void>
{
    const outputDirectory = join(distDirectory, browser);

    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });
    await cp(buildDirectory, outputDirectory, { recursive: true });

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

    await rm(buildDirectory, { recursive: true, force: true });
    await rm(distDirectory, { recursive: true, force: true });

    await runTypeScriptBuild();

    if (requestedBrowser === undefined) {
        await prepareBrowserDirectory("chrome");
        await prepareBrowserDirectory("firefox");
        return;
    }

    await prepareBrowserDirectory(requestedBrowser);
}

await build();