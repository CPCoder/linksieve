/**
 * Project:   LinkSieve
 * File:      index.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

import {
    addFilter,
    getConfiguration,
    removeFilter,
    setFilteringEnabled,
    updateFilter,
} from "../shared/storage";
import type {
    FilterConfiguration,
    FilterMatchType,
    FilterRule,
} from "../shared/types";
import {
    // getDomain,
    normalizeDomain,
    normalizeUrl,
} from "../shared/url";

const filteringEnabled = document.querySelector<HTMLInputElement>(
    "#filtering-enabled",
);
const filterForm = document.querySelector<HTMLFormElement>(
    "#filter-form",
);
const filterValue = document.querySelector<HTMLInputElement>(
    "#filter-value",
);
const filterMatchType = document.querySelector<HTMLSelectElement>(
    "#filter-match-type",
);
const filterList = document.querySelector<HTMLDivElement>(
    "#filter-list",
);
const formError = document.querySelector<HTMLParagraphElement>(
    "#form-error",
);
const saveMessage = document.querySelector<HTMLParagraphElement>(
    "#save-message",
);

let configuration: FilterConfiguration;

function requireElement<T extends Element>(
    element: T | null,
    selector: string,
): T
{
    if (element === null) {
        throw new Error(`Required element not found: ${selector}`);
    }

    return element;
}

function showFormError(message: string): void
{
    const element = requireElement(
        formError,
        "#form-error",
    );

    element.textContent = message;
    element.hidden = false;
}

function clearFormError(): void
{
    const element = requireElement(
        formError,
        "#form-error",
    );

    element.textContent = "";
    element.hidden = true;
}

function showSaveMessage(): void
{
    const element = requireElement(
        saveMessage,
        "#save-message",
    );

    element.hidden = false;

    window.setTimeout(() => {
        element.hidden = true;
    }, 1500);
}

function createFilterId(): string
{
    return crypto.randomUUID();
}

function validateFilterValue(
    value: string,
    matchType: FilterMatchType,
): string | null
{
    if (matchType === "domain") {
        const normalizedDomain = normalizeDomain(value);

        if (normalizedDomain === null) {
            return null;
        }

        return normalizedDomain;
    }

    return normalizeUrl(value);
}

function createFilter(
    value: string,
    matchType: FilterMatchType,
): FilterRule | null
{
    const normalizedValue = validateFilterValue(
        value,
        matchType,
    );

    if (normalizedValue === null) {
        return null;
    }

    return {
        id: createFilterId(),
        value: normalizedValue,
        matchType,
        enabled: true,
    };
}

function hasDuplicateFilter(
    filter: FilterRule,
): boolean
{
    return configuration.filters.some(
        (existingFilter) =>
            existingFilter.matchType === filter.matchType &&
            existingFilter.value === filter.value,
    );
}

function renderFilter(filter: FilterRule): HTMLDivElement
{
    const item = document.createElement("div");

    item.className = "filter-item";
    item.dataset.filterId = filter.id;

    const enabled = document.createElement("input");

    enabled.type = "checkbox";
    enabled.checked = filter.enabled;
    enabled.setAttribute(
        "aria-label",
        `Enable ${filter.value}`,
    );

    enabled.addEventListener("change", () => {
        void handleFilterEnabledChange(
            filter.id,
            enabled.checked,
        );
    });

    const value = document.createElement("span");

    value.className = "filter-item__value";
    value.textContent = filter.value;
    value.title = filter.value;

    const type = document.createElement("span");

    type.className = "filter-item__type";
    type.textContent = filter.matchType;

    const remove = document.createElement("button");

    remove.type = "button";
    remove.className = "filter-item__remove";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
        void handleRemoveFilter(filter.id);
    });

    item.append(
        enabled,
        value,
        type,
        remove,
    );

    return item;
}

function renderFilters(): void
{
    const list = requireElement(
        filterList,
        "#filter-list",
    );

    list.replaceChildren();

    if (configuration.filters.length === 0) {
        const empty = document.createElement("div");

        empty.className = "empty-state";
        empty.textContent = "No filters configured.";

        list.appendChild(empty);

        return;
    }

    for (const filter of configuration.filters) {
        list.appendChild(renderFilter(filter));
    }
}

function renderConfiguration(): void
{
    const enabled = requireElement(
        filteringEnabled,
        "#filtering-enabled",
    );

    enabled.checked = configuration.enabled;

    renderFilters();
}

async function handleFilteringEnabledChange(
    enabled: boolean,
): Promise<void>
{
    configuration = await setFilteringEnabled(enabled);

    renderConfiguration();
    showSaveMessage();
}

async function handleFilterEnabledChange(
    filterId: string,
    enabled: boolean,
): Promise<void>
{
    configuration = await updateFilter(
        filterId,
        { enabled },
    );

    renderFilters();
    showSaveMessage();
}

async function handleRemoveFilter(
    filterId: string,
): Promise<void>
{
    configuration = await removeFilter(filterId);

    renderFilters();
    showSaveMessage();
}

async function handleSubmit(
    event: SubmitEvent,
): Promise<void>
{
    event.preventDefault();
    clearFormError();

    const value = requireElement(
        filterValue,
        "#filter-value",
    );

    const matchTypeElement = requireElement(
        filterMatchType,
        "#filter-match-type",
    );

    const matchType = matchTypeElement.value as FilterMatchType;

    if (matchType !== "domain" && matchType !== "url") {
        showFormError("Invalid match type.");

        return;
    }

    const filter = createFilter(
        value.value,
        matchType,
    );

    if (filter === null) {
        showFormError(
            matchType === "domain"
            ? "Enter a valid domain."
            : "Enter a valid URL.",
        );

        return;
    }

    if (hasDuplicateFilter(filter)) {
        showFormError("This filter already exists.");

        return;
    }

    configuration = await addFilter(filter);

    value.value = "";

    renderFilters();
    showSaveMessage();
}

async function initialize(): Promise<void>
{
    if (
        filteringEnabled === null ||
        filterForm === null ||
        filterValue === null ||
        filterMatchType === null ||
        filterList === null ||
        formError === null ||
        saveMessage === null
    ) {
        throw new Error("Options page initialization failed.");
    }

    configuration = await getConfiguration();

    renderConfiguration();

    filteringEnabled.addEventListener("change", () => {
        void handleFilteringEnabledChange(
            filteringEnabled.checked,
        );
    });

    filterForm.addEventListener("submit", (event) => {
        void handleSubmit(event);
    });
}

void initialize();