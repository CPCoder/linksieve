/**
 * Project:   LinkSieve
 * File:      types.ts
 * Date:      2026-09-01
 * Author:    Steffen Haase <shworx.development@gmail.com
 * Copyright: 2026 SHWorX (Steffen Haase)
 */

export type FilterMatchType = "domain" | "url";

export interface FilterRule
{
    id: string;
    value: string;
    matchType: FilterMatchType;
    enabled: boolean;
}

export interface FilterConfiguration
{
    enabled: boolean;
    filters: FilterRule[];
}

export interface StorageData
{
    configuration?: FilterConfiguration;
}