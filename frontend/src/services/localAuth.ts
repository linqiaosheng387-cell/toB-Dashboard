/**
 * 【临时方案】数据库尚未创建前，在前端写死管理员账号，登录与权限均在本地完成，不依赖后端。
 *
 * 数据库与后端连接就绪后：
 *   1. 把 LOCAL_AUTH_ENABLED 改为 false（或直接删除本文件）；
 *   2. Login 与 PermissionProvider 即会自动恢复为 managementApi 的真实后端校验。
 */

export const LOCAL_AUTH_ENABLED = true

export interface LocalCredential {
  account: string
  password: string
}

/** 写死的管理员账号：admin / 12345678。 */
export const LOCAL_ADMIN: LocalCredential = {
  account: 'admin',
  password: '12345678',
}

/** 本地校验账号密码；当前仅内置写死的管理员账号。 */
export function verifyLocalCredential(
  account: string,
  password: string
): boolean {
  return (
    account === LOCAL_ADMIN.account && password === LOCAL_ADMIN.password
  )
}

/** 是否为本地写死的管理员账号。 */
export function isLocalAdmin(account: string): boolean {
  return account === LOCAL_ADMIN.account
}
