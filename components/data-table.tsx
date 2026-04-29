"use client"

/**
 * DataTable — Enterprise-grade data grid component
 *
 * Features: column sorting, search, pagination, row selection,
 * bulk actions, column visibility toggle, export (CSV/Excel).
 * Drop-in replacement for manual <table> rendering in any page.
 */

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  Download,
  Columns3,
  Trash2,
  CheckSquare,
  X,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string
  header: string
  /** Render cell content. If omitted, renders row[key] as string */
  cell?: (row: T, index: number) => React.ReactNode
  /** Enable sorting for this column */
  sortable?: boolean
  /** Custom sort comparator */
  sortFn?: (a: T, b: T) => number
  /** Format for export (returns string). Falls back to cell text content */
  exportFn?: (row: T) => string
  /** Hide column by default (user can toggle visibility) */
  hidden?: boolean
  /** Column width class, e.g. "w-[120px]" */
  className?: string
  /** Align: left (default), center, right */
  align?: "left" | "center" | "right"
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  /** Unique key extractor for each row — can be a field name string or a function */
  rowKey: string | ((row: T) => string | number)
  /** Search placeholder */
  searchPlaceholder?: string
  /** Which columns to search over (keys). If omitted, searches all. */
  searchKeys?: string[]
  /** Enable row selection + bulk actions */
  selectable?: boolean
  /** Bulk actions rendered when rows are selected */
  bulkActions?: (selectedRows: T[], clearSelection: () => void) => React.ReactNode
  /** Page sizes to offer. Default: [10, 25, 50, 100] */
  pageSizes?: number[]
  /** Default page size */
  defaultPageSize?: number
  /** Export filename (without extension). If set, shows export button */
  exportFilename?: string
  /** Empty state message */
  emptyMessage?: string
  /** Empty state icon */
  emptyIcon?: React.ReactNode
  /** Loading state */
  loading?: boolean
  /** Additional toolbar actions (rendered after built-in buttons) */
  toolbarActions?: React.ReactNode
  /** Sticky header */
  stickyHeader?: boolean
  /** Row click handler */
  onRowClick?: (row: T) => void
  /** Compact mode (smaller rows) */
  compact?: boolean
}

type SortDir = "asc" | "desc" | null

// ─── Export Helpers (client-side) ──────────────────────────────────────────

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function exportToCSV<T>(
  columns: DataTableColumn<T>[],
  rows: T[],
  filename: string = "export",
) {
  const visibleCols = columns.filter((c) => !c.hidden)
  const bom = "\uFEFF"
  const headerLine = visibleCols.map((c) => escapeCSV(c.header)).join(",")
  const dataLines = rows.map((row) =>
    visibleCols
      .map((col) => {
        if (col.exportFn) return escapeCSV(col.exportFn(row))
        const val = (row as Record<string, unknown>)[col.key]
        return escapeCSV(val)
      })
      .join(","),
  )
  const content = bom + [headerLine, ...dataLines].join("\r\n")
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = "Buscar...",
  searchKeys,
  selectable = false,
  bulkActions,
  pageSizes = [10, 25, 50, 100],
  defaultPageSize = 25,
  exportFilename,
  emptyMessage = "No hay datos para mostrar",
  emptyIcon,
  loading = false,
  toolbarActions,
  stickyHeader = false,
  onRowClick,
  compact = false,
}: DataTableProps<T>) {
  // Normalise rowKey: accept both a field-name string and a function
  const getKey = React.useCallback(
    (row: T): string | number =>
      typeof rowKey === "function"
        ? rowKey(row)
        : (row as Record<string, unknown>)[rowKey] as string | number,
    [rowKey],
  )

  const [search, setSearch] = React.useState("")
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDir>(null)
  const [pageSize, setPageSize] = React.useState(defaultPageSize)
  const [page, setPage] = React.useState(0)
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string | number>>(new Set())
  const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(
    new Set(columns.filter((c) => c.hidden).map((c) => c.key)),
  )

  // Reset page on data/search/sort change
  React.useEffect(() => { setPage(0) }, [search, sortKey, sortDir, data.length])

  // ── Visible columns ──
  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key))

  // ── Search ──
  const searchedData = React.useMemo(() => {
    if (!search.trim()) return data
    const term = search.toLowerCase()
    const keys = searchKeys ?? columns.map((c) => c.key)
    return data.filter((row) =>
      keys.some((k) => {
        const val = (row as Record<string, unknown>)[k]
        return val != null && String(val).toLowerCase().includes(term)
      }),
    )
  }, [data, search, searchKeys, columns])

  // ── Sort ──
  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDir) return searchedData
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return searchedData

    return [...searchedData].sort((a, b) => {
      let cmp: number
      if (col.sortFn) {
        cmp = col.sortFn(a, b)
      } else {
        const va = (a as Record<string, unknown>)[sortKey]
        const vb = (b as Record<string, unknown>)[sortKey]
        if (va == null && vb == null) cmp = 0
        else if (va == null) cmp = -1
        else if (vb == null) cmp = 1
        else if (typeof va === "number" && typeof vb === "number") cmp = va - vb
        else cmp = String(va).localeCompare(String(vb), "es-AR", { numeric: true })
      }
      return sortDir === "desc" ? -cmp : cmp
    })
  }, [searchedData, sortKey, sortDir, columns])

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize)

  // ── Selection ──
  const allPageKeys = pagedData.map(getKey)
  const allSelected = allPageKeys.length > 0 && allPageKeys.every((k) => selectedKeys.has(k))
  const someSelected = allPageKeys.some((k) => selectedKeys.has(k))

  function toggleSelectAll() {
    if (allSelected) {
      const next = new Set(selectedKeys)
      allPageKeys.forEach((k) => next.delete(k))
      setSelectedKeys(next)
    } else {
      const next = new Set(selectedKeys)
      allPageKeys.forEach((k) => next.add(k))
      setSelectedKeys(next)
    }
  }

  function toggleSelect(key: string | number) {
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelectedKeys(next)
  }

  function clearSelection() {
    setSelectedKeys(new Set())
  }

  const selectedRows = data.filter((row) => selectedKeys.has(getKey(row)))

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc")
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null) }
      else setSortDir("asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function toggleColumn(key: string) {
    const next = new Set(hiddenCols)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setHiddenCols(next)
  }

  // ── Render ──
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Results count */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {sortedData.length} resultado{sortedData.length !== 1 ? "s" : ""}
          </span>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Columns3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Columnas</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={!hiddenCols.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          {exportFilename && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => exportToCSV(visibleColumns, sortedData, exportFilename)}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          )}

          {toolbarActions}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectable && selectedKeys.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 animate-in slide-in-from-top-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {selectedKeys.size} seleccionado{selectedKeys.size !== 1 ? "s" : ""}
          </span>
          {bulkActions?.(selectedRows, clearSelection)}
          <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={clearSelection}>
            <X className="h-3.5 w-3.5 mr-1" /> Deseleccionar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader className={stickyHeader ? "sticky top-0 bg-card z-10" : ""}>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected ? true : undefined}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleccionar todo"
                  />
                </TableHead>
              )}
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.className,
                    col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className={cn(
                    "flex items-center gap-1",
                    col.align === "right" && "justify-end",
                    col.align === "center" && "justify-center",
                  )}>
                    {col.header}
                    {col.sortable && (
                      sortKey === col.key ? (
                        sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
                          : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                      )
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {selectable && <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>}
                  {visibleColumns.map((col) => (
                    <TableCell key={col.key}>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pagedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="text-center py-12"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {emptyIcon}
                    <p>{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((row, i) => {
                const key = getKey(row)
                const isSelected = selectedKeys.has(key)
                return (
                  <TableRow
                    key={key}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(onRowClick && "cursor-pointer")}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(key)}
                          aria-label={`Seleccionar fila ${key}`}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          compact && "py-1.5",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className,
                        )}
                      >
                        {col.cell
                          ? col.cell(row, page * pageSize + i)
                          : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sortedData.length > pageSizes[0] && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Filas por página:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0) }}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedData.length)} de {sortedData.length}
            </span>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage(Math.max(0, page - 1)) }}
                  className={page === 0 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number
                if (totalPages <= 5) p = i
                else if (page < 3) p = i
                else if (page > totalPages - 4) p = totalPages - 5 + i
                else p = page - 2 + i
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => { e.preventDefault(); setPage(p) }}
                    >
                      {p + 1}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage(Math.min(totalPages - 1, page + 1)) }}
                  className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
