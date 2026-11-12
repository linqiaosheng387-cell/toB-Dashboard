import { useLayoutEffect, useState } from 'react'
import type { DragEvent } from 'react'
import type { ColumnType, ColumnsType } from 'antd/es/table'
import { useI18n } from '../../i18n/LanguageContext'

type DragState = { dragIndex: number | null; overIndex: number | null }

export function getColumnId<T>(column: ColumnType<T>): string {
  const key = (column as { key?: string | number }).key
  return String(key ?? column.dataIndex ?? column.title)
}

function loadSavedOrder(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/**
 * Makes antd table columns draggable by their header cells. The resulting column
 * order is persisted under `storageKey` in localStorage, so callers can scope the
 * key per account + module (e.g. `column-order:admin:orders`) to keep
 * every account's layout isolated.
 */
export function useReorderableColumns<T>(
  storageKey: string,
  baseColumns: ColumnsType<T>,
): ColumnsType<T> {
  const { t } = useI18n()
  const [savedOrder, setSavedOrder] = useState<string[]>(() => loadSavedOrder(storageKey))
  const [drag, setDrag] = useState<DragState>({ dragIndex: null, overIndex: null })

  // Re-read the stored layout whenever the account/module key changes.
  useLayoutEffect(() => {
    setSavedOrder(loadSavedOrder(storageKey))
    setDrag({ dragIndex: null, overIndex: null })
  }, [storageKey])

  function buildOrderedColumns(): ColumnsType<T> {
    if (savedOrder.length === 0) return baseColumns
    const byId = new Map(baseColumns.map((column) => [getColumnId(column), column]))
    const reordered: ColumnsType<T> = []
    savedOrder.forEach((id) => {
      const column = byId.get(id)
      if (column) {
        reordered.push(column)
        byId.delete(id)
      }
    })
    // Columns absent from the saved order (e.g. newly introduced) append at the
    // end in their original order instead of being dropped.
    byId.forEach((column) => reordered.push(column))
    return reordered
  }

  const ordered = buildOrderedColumns()

  function persist(ids: string[]) {
    setSavedOrder(ids)
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids))
    } catch {
      // Storage unavailable: the in-memory order still applies for this session.
    }
  }

  return ordered.map((column, index) => {
    const previousHeaderCell = column.onHeaderCell
    return {
      ...column,
      onHeaderCell: (currentColumn) => {
        const previous = previousHeaderCell ? previousHeaderCell(currentColumn) : {}
        const className = [
          'reorderable-th',
          drag.dragIndex === index ? 'col-dragging' : '',
          drag.overIndex === index && drag.dragIndex !== index ? 'col-drag-over' : '',
          (previous as { className?: string }).className ?? '',
        ]
          .filter(Boolean)
          .join(' ')

        return {
          ...previous,
          className,
          draggable: true,
          title: t('common.dragHint'),
          onDragStart: (event: DragEvent) => {
            ;(previous as { onDragStart?: (e: DragEvent) => void }).onDragStart?.(event)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', getColumnId(column))
            setDrag({ dragIndex: index, overIndex: index })
          },
          onDragOver: (event: DragEvent) => {
            ;(previous as { onDragOver?: (e: DragEvent) => void }).onDragOver?.(event)
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
            setDrag((current) =>
              current.overIndex === index ? current : { ...current, overIndex: index },
            )
          },
          onDrop: (event: DragEvent) => {
            ;(previous as { onDrop?: (e: DragEvent) => void }).onDrop?.(event)
            event.preventDefault()
            const from = drag.dragIndex
            if (from === null || from === index) {
              setDrag({ dragIndex: null, overIndex: null })
              return
            }
            const nextColumns = [...ordered]
            const [moved] = nextColumns.splice(from, 1)
            nextColumns.splice(index, 0, moved)
            persist(nextColumns.map((item) => getColumnId(item)))
            setDrag({ dragIndex: null, overIndex: null })
          },
          onDragEnd: (event: DragEvent) => {
            ;(previous as { onDragEnd?: (e: DragEvent) => void }).onDragEnd?.(event)
            setDrag({ dragIndex: null, overIndex: null })
          },
        }
      },
    }
  })
}
