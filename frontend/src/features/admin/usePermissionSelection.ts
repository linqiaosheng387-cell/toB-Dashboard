import { useCallback, useMemo, useState } from 'react'

import type { PermissionModule } from './permissionCatalog'

function moduleResourceKeys(module: PermissionModule): string[] {
  return [
    `${module.key}.module`,
    ...module.metrics.map((item) => item.key),
    ...module.charts.map((item) => item.key),
    ...module.fields.map((item) => item.key),
  ]
}

/**
 * 管理账号权限 key 的勾选状态。
 * 语义：key 出现在集合中 = 该资源可见。
 */
export function usePermissionSelection(initialKeys: string[] = []) {
  const [keys, setKeys] = useState<string[]>(initialKeys)

  const selected = useMemo(() => new Set(keys), [keys])

  const isModuleEnabled = useCallback(
    (moduleKey: string) => selected.has(`${moduleKey}.module`),
    [selected]
  )

  const toggleKey = useCallback((key: string, checked: boolean) => {
    setKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return Array.from(next)
    })
  }, [])

  const setModuleEnabled = useCallback(
    (module: PermissionModule, enabled: boolean) => {
      const moduleKeys = moduleResourceKeys(module)
      setKeys((prev) => {
        const next = new Set(prev)
        moduleKeys.forEach((key) => {
          if (enabled) next.add(key)
          else next.delete(key)
        })
        return Array.from(next)
      })
    },
    []
  )

  const applyKeys = useCallback((newKeys: string[]) => {
    setKeys(Array.from(new Set(newKeys)))
  }, [])

  return {
    keys,
    selected,
    isModuleEnabled,
    toggleKey,
    setModuleEnabled,
    applyKeys,
  }
}
