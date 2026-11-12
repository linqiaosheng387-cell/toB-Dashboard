import type { ColumnsType } from 'antd/es/table'

import { getColumnId } from './useReorderableColumns'

/**
 * Remove table columns whose mapped permission resource is not permitted.
 * Columns without an entry in `permKeyById` always remain (structural columns).
 */
export function filterColumnsByPermission<T>(
  columns: ColumnsType<T>,
  can: (resourceKey: string) => boolean,
  permKeyById: Record<string, string>
): ColumnsType<T> {
  return columns.filter((column) => {
    const permKey = permKeyById[getColumnId(column)]
    return permKey === undefined || can(permKey)
  })
}
