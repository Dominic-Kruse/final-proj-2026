import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi, type InventoryResponse } from "../api/inventory";
import { transformInventory } from "../utils/transformInventory";
import { applyDecorators, type SortFilter } from "../utils/catalogDecorators";
import { MedicineWithStock } from "../utils/types";

export function usePaginatedCatalog(searchQuery: string, activeFilters: SortFilter[]) {
    const pageSize = 20;
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page on search or filter change
    useEffect(() => { setCurrentPage(1); }, [searchQuery]);
    useEffect(() => { setCurrentPage(1); }, [activeFilters]);

    const pagedQuery = useQuery<InventoryResponse>({
        queryKey: ["inventory", currentPage, pageSize, searchQuery],
        queryFn: () => inventoryApi.getPage({
            page: currentPage,
            limit: pageSize,
            search: searchQuery || undefined,
        }),
        placeholderData: (previousData) => previousData,
        enabled: activeFilters.length === 0, // Only fetch when not filtering
    });

    const allQuery = useQuery<MedicineWithStock[]>({
        queryKey: ["inventory", "all", searchQuery],
        queryFn: () => inventoryApi.getAll(),
        enabled: activeFilters.length > 0,
        staleTime: 30_000,
    });

    // Always fetch all data for total stock counts
    const totalInventoryQuery = useQuery<MedicineWithStock[]>({
        queryKey: ["inventory", "all"],
        queryFn: () => inventoryApi.getAll(),
        staleTime: 30_000,
    });

    const rawInventory = pagedQuery.data?.data ?? [];
    const allInventoryData = allQuery.data ?? [];

    const catalog = useMemo(() => {
        try { return transformInventory(rawInventory); } catch { return []; }
    }, [rawInventory]);

    const allCatalog = useMemo(() => {
        if (activeFilters.length === 0) return catalog;
        try { return transformInventory(allInventoryData); } catch { return []; }
    }, [activeFilters.length, allInventoryData, catalog]);

    const sortedCatalog = useMemo(() =>
        applyDecorators(allCatalog, activeFilters),
        [allCatalog, activeFilters]
    );

    const displayCatalog = useMemo(() => {
        if (activeFilters.length === 0) return sortedCatalog;
        const start = (currentPage - 1) * pageSize;
        return sortedCatalog.slice(start, start + pageSize);
    }, [sortedCatalog, activeFilters.length, currentPage, pageSize]);

    const totalPages = activeFilters.length > 0
        ? Math.max(1, Math.ceil(sortedCatalog.length / pageSize))
        : Math.max(1, pagedQuery.data?.metadata.totalPages ?? 1);

    const safeCurrentPage = activeFilters.length > 0
        ? currentPage
        : (pagedQuery.data?.metadata.currentPage ?? 1);

    const totalCount = activeFilters.length > 0
        ? sortedCatalog.length
        : pagedQuery.data?.metadata.totalCount ?? 0;

    const isLoading = activeFilters.length > 0 ? allQuery.isLoading : pagedQuery.isLoading;
    const isFetching = activeFilters.length > 0 ? allQuery.isFetching : pagedQuery.isFetching;

    // Calculate total stock counts from all data
    const totalStockCounts = useMemo(() => {
        const allData = totalInventoryQuery.data ?? [];
        const fullCatalog = transformInventory(allData);
        return {
            inStock: fullCatalog.filter(p => p.status === "In Stock").length,
            lowStock: fullCatalog.filter(p => p.status === "Low Stock").length,
            outOfStock: fullCatalog.filter(p => p.status === "Out of Stock").length,
        };
    }, [totalInventoryQuery.data]);

    return {
        displayCatalog,
        currentPage,
        setCurrentPage,
        totalPages,
        safeCurrentPage,
        totalCount,
        isLoading,
        isFetching,
        rawInventory: activeFilters.length > 0 ? allInventoryData : rawInventory,
        pageSize,
        totalStockCounts,
    };
}