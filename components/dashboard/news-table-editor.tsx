"use client"

import { useState, useRef, useCallback } from "react"
import * as XLSX from "xlsx"
import {
    Table,
    Plus,
    Trash2,
    Upload,
    FileSpreadsheet,
    GripVertical,
    X,
    Check,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// =================================================================================
// TYPES
// =================================================================================

export interface TableData {
    id: string
    title?: string
    headers: string[]
    rows: string[][]
}

interface NewsTableEditorProps {
    tables: TableData[]
    onChange: (tables: TableData[]) => void
}

// =================================================================================
// HELPER FUNCTIONS
// =================================================================================

const generateId = () => Math.random().toString(36).substr(2, 9)

// Parse Excel file to TableData
const parseExcelFile = (file: File): Promise<TableData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })

                // Get first sheet
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]

                // Convert to array of arrays
                const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
                    header: 1,
                    defval: ""
                })

                if (jsonData.length === 0) {
                    reject(new Error("Файл пустой"))
                    return
                }

                // First row as headers
                const headers = (jsonData[0] || []).map(h => String(h))
                const rows = jsonData.slice(1).map(row =>
                    row.map(cell => String(cell))
                )

                resolve({
                    id: generateId(),
                    title: sheetName !== "Sheet1" ? sheetName : undefined,
                    headers,
                    rows,
                })
            } catch (error) {
                reject(new Error("Ошибка парсинга Excel файла"))
            }
        }

        reader.onerror = () => reject(new Error("Ошибка чтения файла"))
        reader.readAsArrayBuffer(file)
    })
}

// Convert TableData to HTML string
export const tableToHtml = (table: TableData): string => {
    const title = table.title ? `<h4 class="news-table-title">${table.title}</h4>` : ""

    const headerCells = table.headers
        .map(h => `<th>${h}</th>`)
        .join("")

    const bodyRows = table.rows
        .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`)
        .join("")

    return `${title}<div class="news-table-wrapper"><table class="news-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`
}

// =================================================================================
// TABLE CELL EDITOR
// =================================================================================

function CellEditor({
    value,
    onChange,
    onBlur,
    className,
}: {
    value: string
    onChange: (value: string) => void
    onBlur?: () => void
    className?: string
}) {
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn("h-8 text-sm", className)}
        />
    )
}

// =================================================================================
// TABLE EDITOR COMPONENT
// =================================================================================

function TableEditor({
    table,
    onUpdate,
    onDelete,
}: {
    table: TableData
    onUpdate: (table: TableData) => void
    onDelete: () => void
}) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const updateHeader = (index: number, value: string) => {
        const newHeaders = [...table.headers]
        newHeaders[index] = value
        onUpdate({ ...table, headers: newHeaders })
    }

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = table.rows.map((row, ri) =>
            ri === rowIndex
                ? row.map((cell, ci) => (ci === colIndex ? value : cell))
                : row
        )
        onUpdate({ ...table, rows: newRows })
    }

    const addRow = () => {
        const newRow = table.headers.map(() => "")
        onUpdate({ ...table, rows: [...table.rows, newRow] })
    }

    const deleteRow = (rowIndex: number) => {
        onUpdate({ ...table, rows: table.rows.filter((_, i) => i !== rowIndex) })
    }

    const addColumn = () => {
        onUpdate({
            ...table,
            headers: [...table.headers, `Столбец ${table.headers.length + 1}`],
            rows: table.rows.map(row => [...row, ""]),
        })
    }

    const deleteColumn = (colIndex: number) => {
        if (table.headers.length <= 1) return
        onUpdate({
            ...table,
            headers: table.headers.filter((_, i) => i !== colIndex),
            rows: table.rows.map(row => row.filter((_, i) => i !== colIndex)),
        })
    }

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-[#3CE8D1]" />
                    <Input
                        value={table.title || ""}
                        onChange={(e) => onUpdate({ ...table, title: e.target.value })}
                        placeholder="Название таблицы (опционально)"
                        className="h-7 w-48 text-sm"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="h-7 w-7"
                    >
                        {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onDelete}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Table content */}
            {!isCollapsed && (
                <div className="p-3">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            {/* Headers */}
                            <thead>
                                <tr>
                                    <th className="w-8"></th>
                                    {table.headers.map((header, colIndex) => (
                                        <th key={colIndex} className="p-1">
                                            <div className="flex items-center gap-1">
                                                <CellEditor
                                                    value={header}
                                                    onChange={(v) => updateHeader(colIndex, v)}
                                                    className="font-medium bg-[#3CE8D1]/10 border-[#3CE8D1]/30"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => deleteColumn(colIndex)}
                                                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                                    disabled={table.headers.length <= 1}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="w-10">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={addColumn}
                                            className="h-6 w-6 text-[#3CE8D1]"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </th>
                                </tr>
                            </thead>

                            {/* Rows */}
                            <tbody>
                                {table.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td className="p-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => deleteRow(rowIndex)}
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </td>
                                        {row.map((cell, colIndex) => (
                                            <td key={colIndex} className="p-1">
                                                <CellEditor
                                                    value={cell}
                                                    onChange={(v) => updateCell(rowIndex, colIndex, v)}
                                                />
                                            </td>
                                        ))}
                                        <td></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add row button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={addRow}
                        className="mt-2 w-full text-[#3CE8D1] hover:text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить строку
                    </Button>
                </div>
            )}
        </div>
    )
}

// =================================================================================
// MAIN NEWS TABLE EDITOR
// =================================================================================

export function NewsTableEditor({ tables, onChange }: NewsTableEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        setError(null)

        try {
            const tableData = await parseExcelFile(file)
            onChange([...tables, tableData])
        } catch (err: any) {
            setError(err.message || "Ошибка импорта")
        } finally {
            setIsImporting(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }, [tables, onChange])

    const createEmptyTable = () => {
        const newTable: TableData = {
            id: generateId(),
            headers: ["Столбец 1", "Столбец 2", "Столбец 3"],
            rows: [["", "", ""]],
        }
        onChange([...tables, newTable])
    }

    const updateTable = (id: string, updatedTable: TableData) => {
        onChange(tables.map(t => t.id === id ? updatedTable : t))
    }

    const deleteTable = (id: string) => {
        onChange(tables.filter(t => t.id !== id))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Таблицы</Label>
                <div className="flex items-center gap-2">
                    {/* Import Excel */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                    >
                        <Upload className="h-4 w-4 mr-1" />
                        Импорт Excel
                    </Button>

                    {/* Create empty */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={createEmptyTable}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Создать таблицу
                    </Button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                </div>
            )}

            {/* Tables list */}
            {tables.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Нет таблиц</p>
                    <p className="text-xs">Импортируйте Excel или создайте таблицу вручную</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tables.map((table) => (
                        <TableEditor
                            key={table.id}
                            table={table}
                            onUpdate={(updated) => updateTable(table.id, updated)}
                            onDelete={() => deleteTable(table.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default NewsTableEditor
