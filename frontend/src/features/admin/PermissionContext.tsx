import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { managementApi } from '../../services/managementApi'
import { LOCAL_AUTH_ENABLED, isLocalAdmin } from '../../services/localAuth'
import { ALL_RESOURCES } from './permissionCatalog'

interface PermissionContextValue {
  loaded: boolean
  allowedKeys: Set<string>
  can: (resourceKey: string) => boolean
}

const PermissionContext = createContext<PermissionContextValue>({
  loaded: false,
  allowedKeys: new Set<string>(),
  can: () => true,
})

interface PermissionProviderProps {
  account: string
  password: string
  children: ReactNode
}

/**
 * 登录后从后端加载该账号的生效权限；账号切换时重新拉取。
 * 未加载完成前默认放行，避免内容先隐藏再出现的闪烁。
 */
export function PermissionProvider({
  account,
  password,
  children,
}: PermissionProviderProps) {
  const [allowedKeys, setAllowedKeys] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)

    // 临时本地模式：写死的管理员直接拥有全部 47 个权限，不请求后端
    if (LOCAL_AUTH_ENABLED && isLocalAdmin(account)) {
      setAllowedKeys(new Set(ALL_RESOURCES.map((resource) => resource.key)))
      setLoaded(true)
      return () => {
        cancelled = true
      }
    }

    managementApi
      .login(account, password)
      .then((grant) => {
        if (!cancelled) {
          setAllowedKeys(new Set(grant.resource_keys))
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllowedKeys(new Set())
          setLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [account, password])

  const can = useCallback(
    (resourceKey: string) => !loaded || allowedKeys.has(resourceKey),
    [loaded, allowedKeys]
  )

  const value = useMemo(
    () => ({ loaded, allowedKeys, can }),
    [loaded, allowedKeys, can]
  )

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermission(): PermissionContextValue {
  return useContext(PermissionContext)
}
