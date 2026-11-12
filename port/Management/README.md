# 权限管理服务（Management）接口契约

> **一句话本质**：这个服务只回答两类问题——"有哪些账号 / 模板，它们各自能看哪些资源"，以及"登录后这个账号能看哪些资源"。所有权限都用一串全局唯一的 **资源 key（resource_key）** 表示。

- 服务名称：Fleet Management API
- 技术栈：FastAPI + SQLAlchemy + MySQL（SQL 按 5.7 语法编写，5.7/8.0 均可运行）
- 默认地址：`http://127.0.0.1:6563`
- 接口统一前缀：`/api/v1`
- 数据格式：请求与响应均为 `application/json; charset=utf-8`
- 机器可读契约：见同目录 `management.openapi.json`（标准 OpenAPI 3.1，可导入 Apifox / Swagger UI）
- 在线调试：服务启动后访问 `http://127.0.0.1:6563/docs`
- 数据库表统一带 `tob_` 前缀（如 `tob_accounts`），与其他项目隔离

---

## 1. 资源 key 命名规范

格式：`{模块}.{类型}.{标识}`，全部小写、用点分隔。

| 类型 type | 含义 | 示例 |
|---|---|---|
| `module` | 整个模块（侧边栏入口） | `overview.module` |
| `metric` | 指标块（KPI 卡片） | `overview.metric.ride_amount` |
| `chart` | 可视化图表 | `overview.chart.weekly_spend` |
| `field` | 表格数据字段（列） | `orders.field.approval` |

四个模块 key：`overview`（数据总览）、`employees`（员工详情）、`orders`（订单明细）、`recharge`（充值明细）。
全系统共 **47 个权限点**（4 个模块 + 43 个资源）。

**语义约定**：某账号的权限列表里"出现"某个 key = 该资源可见；未出现 = 不可见。后端会自动过滤掉不存在的 key，不会报错。

---

## 2. 端点总览

| 分组 | 方法 | 路径 | 用途 |
|---|---|---|---|
| 认证 | POST | `/auth/login` | 登录，返回该账号生效的全部资源 key |
| 认证 | POST | `/auth/change-password` | 管理员修改自己的密码（需验证原密码） |
| 目录 | GET | `/catalog` | 获取按模块、类型分组的资源字典 |
| 账号 | GET | `/accounts` | 账号列表（含各自权限） |
| 账号 | GET | `/accounts/{id}` | 单个账号详情 |
| 账号 | POST | `/accounts` | 新建账号并设置权限 |
| 账号 | PATCH | `/accounts/{id}` | 修改资料 / 状态 / 权限 |
| 账号 | POST | `/accounts/{id}/reset-password` | 重置账号密码，默认恢复为 123456 |
| 账号 | DELETE | `/accounts/{id}` | 删除账号 |
| 账号 | POST | `/accounts/{id}/apply-template` | 把某模板一键应用到账号 |
| 模板 | GET | `/templates` | 模板列表 |
| 模板 | GET | `/templates/{id}` | 单个模板详情 |
| 模板 | POST | `/templates` | 新建模板（提前保存的方案） |
| 模板 | PATCH | `/templates/{id}` | 修改模板 |
| 模板 | DELETE | `/templates/{id}` | 删除模板（内置模板不可删） |

---

## 3. 认证

### POST /api/v1/auth/login

请求体：
```json
{ "account": "admin", "password": "12345678" }
```

成功响应 `200`：
```json
{
  "account": "admin",
  "company": "Acme Mobility Ltd.",
  "status": "active",
  "resource_keys": ["overview.module", "overview.metric.ride_amount", "...共 47 个"]
}
```

错误：账号或密码错误 → `401`；账号被封锁 → `403`。

### POST /api/v1/auth/change-password

仅管理员账号（`admin`）可调用，需先验证原密码，新密码至少 8 位：
```json
{ "account": "admin", "old_password": "12345678", "new_password": "newpass123" }
```
成功 `200` 返回账号详情；原密码错误或账号不存在 → `400`；非管理员账号 → `403`。

---

## 4. 资源目录

### GET /api/v1/catalog

返回数组，每个元素是一个模块，资源已按指标 / 图表 / 字段分组：
```json
[
  {
    "module_key": "overview",
    "module_name": "数据总览",
    "metrics": [
      { "resource_key": "overview.metric.ride_amount", "module_key": "overview",
        "resource_type": "metric", "resource_name": "用车金额", "sort_order": 4 }
    ],
    "charts": [],
    "fields": []
  }
]
```

---

## 5. 账号管理

### GET /api/v1/accounts / GET /api/v1/accounts/{id}

返回 `AccountDetail`：
```json
{
  "id": 1,
  "account": "admin",
  "company": "Acme Mobility Ltd.",
  "status": "active",
  "created_at": "2026-04-12T10:20:00",
  "last_login_at": "2026-10-30T14:26:00",
  "resource_keys": ["overview.module", "..."]
}
```

### POST /api/v1/accounts

请求体（`resource_keys` 为该账号勾选的全部资源）：
```json
{
  "account": "newuser@acme.com",
  "password": "123456",
  "company": "Acme Mobility Ltd.",
  "resource_keys": ["overview.module", "overview.metric.employee_count"]
}
```
成功 `201` 返回账号详情；账号名重复 → `409`。

### PATCH /api/v1/accounts/{id}

所有字段均可选，只传需要修改的部分。传 `resource_keys` 时为**整体替换**该账号权限：
```json
{ "status": "blocked", "resource_keys": ["overview.module"] }
```

### POST /api/v1/accounts/{id}/reset-password

把目标账号密码重置为指定值，或在不传时恢复为默认密码 `123456`：
```json
{ "new_password": null }
```
成功 `200` 返回账号详情；目标是管理员账号 → `400`（管理员只能自行改密）。

### POST /api/v1/accounts/{id}/apply-template?template_id=2

无请求体。把模板 2 的资源集合复制到该账号，返回更新后的账号详情。模板不存在 → `404`。

### DELETE /api/v1/accounts/{id}

成功返回 `204`（无响应体）；账号不存在 → `404`。

---

## 6. 权限模板（一键配置）

### POST /api/v1/templates
```json
{
  "name": "运营模板",
  "description": "可选，方案说明",
  "resource_keys": ["overview.module", "recharge.module"]
}
```
成功 `201` 返回模板详情；名称重复 → `409`。

### PATCH /api/v1/templates/{id}

字段均可选，整体替换语义与账号一致。内置模板同样可以修改内容。

### DELETE /api/v1/templates/{id}

自定义模板可删（`204`）；内置模板（`is_builtin=1`）删除返回 `400`。

---

## 7. 统一错误格式

所有业务错误均返回如下结构，HTTP 状态码与 `detail` 对应：
```json
{ "detail": "账号 admin 已存在" }
```

| 状态码 | 触发场景 |
|---|---|
| 400 | 业务规则不允许（如删除内置模板） |
| 401 | 账号或密码错误 |
| 403 | 账号被封锁 |
| 404 | 账号 / 模板 / 资源不存在 |
| 409 | 唯一约束冲突（账号名、模板名重复） |
| 422 | 请求体字段校验失败（Pydantic 标准格式） |

---

## 8. 网关 / 路由配置建议

前端通过反向网关访问时，建议把 `/api/v1/` 前缀转发到本服务，避免跨域并便于统一鉴权。Nginx 示例：

```nginx
location /api/v1/ {
    proxy_pass http://127.0.0.1:6563;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

本地开发已开启 CORS，默认放行 `http://localhost:5173` 与 `http://localhost:4173`，可通过环境变量 `MGMT_CORS_ORIGINS` 调整。
