import { useCallback, useMemo, useState } from 'react'
import type { ColumnType, ColumnsType } from 'antd/es/table'
import { getColumnId } from './useReorderableColumns'

/**
 * Tracks which columns are hidden. The visibility filter is applied on top of
 * whatever column order the caller already has, so reordering and show/hide can
 * be composed together.
 */
export function useColumnVisibility<T>(baseColumns: ColumnsType<T>) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([])

  const columnIds = useMemo(() => baseColumns.map((column) => getColumnId(column)), [baseColumns])

  const toggle = useCallback((id: string, visible: boolean) => {
    setHiddenIds((current) => {
      if (visible) return current.filter((item) => item !== id)
      return current.includes(id) ? current : [...current, id]
    })
  }, [])

  const reset = useCallback(() => setHiddenIds([]), [])

  const visibleColumns = useMemo(
    () => baseColumns.filter((column) => !hiddenIds.includes(getColumnId(column))),
    [baseColumns, hiddenIds],
  )

  return { columnIds, hiddenIds, toggle, reset, visibleColumns }
}

export type { ColumnType }
