# 权限管理后端（Management Service）

> **一句话本质**：这是一个用 Python + FastAPI 写的"权限管家"，前端登录时来这里问"这个账号能看哪些东西"，管理员改权限也在这里保存；所有权限都落在 MySQL 里，所以**改完下次登录就生效**。

---

## 1. 它在整个系统里负责什么

| 能力 | 说明 |
|---|---|
| 登录认证 | 校验账号密码（密码用 PBKDF2 加盐哈希，**数据库里不存明文**），返回该账号的权限点列表 |
| 账号管理 | 新增 / 编辑 / 封锁 / 删除账号，并为每个账号分配资源权限 |
| 细粒度权限 | 权限精确到每个**模块（module）、指标块（metric）、可视化图（chart）、数据字段（field）**，共 47 个权限点 |
| 权限模板 | 提前配好"一键配置"模板（如全量管理员、财务对账），应用后批量勾选 |
| 资源目录 | 向前端返回四个模块及其内部资源，供编辑器渲染 |

**权限模型**：账号 × 资源 → 是否可见。权限项"存在即启用"，保存时先删后插（replace 语义）。

---

## 2. 目录结构与分层（请求是怎么一层层流动的）

```
backend/management/
├── requirements.txt        # 依赖清单（pip 安装用）
├── .env.example            # 配置模板，复制为 .env 后修改
├── README.md               # 本文件
└── app/
    ├── main.py             # 程序入口：创建应用、CORS、异常处理、注册路由
    ├── core/               # 基础设施层
    │   ├── config.py       # 读取环境变量（数据库地址、CORS、哈希迭代次数）
    │   ├── database.py     # 数据库引擎、会话、Base
    │   └── security.py     # 密码哈希与校验
    ├── models/             # ORM 模型层：表结构的 Python 映射
    ├── schemas/            # 数据契约层：请求/响应的字段校验（Pydantic）
    ├── repositories/       # 数据访问层：只负责和数据库打交道（增删改查）
    ├── services/           # 业务逻辑层：编排 repository，处理规则与报错
    └── api/                # 表现层：HTTP 路由
        ├── router.py       # 汇总各路由
        └── routes/         # 按业务拆分：auth / accounts / templates / catalog
```

**调用方向（自上而下，不反向依赖）**：
`api 路由 → services 业务 → repositories 数据 → models 表`，`schemas` 在边界做数据校验。

---

## 3. 运行前准备（零基础版）

### 3.1 确认 Python 解释器

本机系统 PATH 里的默认 `python` 是精简版（缺依赖），**请使用 Anaconda 解释器**：

```
C:\Users\work\Anaconda4\python.exe
```

先确认它能正常用并已装好依赖：

```powershell
& "C:\Users\work\Anaconda4\python.exe" --version
```

### 3.2 安装依赖（首次运行才需要）

在本目录（`backend/management`）下执行：

```powershell
& "C:\Users\work\Anaconda4\python.exe" -m pip install -r requirements.txt
```

### 3.3 初始化数据库

确保 MySQL 服务已启动，然后执行项目根目录 `SQL/management_permission.sql`。
该脚本会：建库 `fleet_management`、建 5 张表、写入 47 个资源点、2 个内置模板、2 个初始账号及其权限。

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot < "..\..\..\SQL\management_permission.sql"
```

关于该脚本的两点说明：

- **SQL 按 MySQL 5.7 语法编写**：排序规则用 `utf8mb4_general_ci`（不用 8.0 专有的 `utf8mb4_0900_ai_ci`），在 5.7 和 8.0 上都能跑。
- **所有表名带 `tob_` 前缀**（如 `tob_accounts`、`tob_permission_resources`），外键约束名带 `tob_fk_` 前缀，便于和其他项目区分。

> 注意：脚本含 `DROP TABLE IF EXISTS`，重复执行会**清空并重建**权限数据，请勿在生产环境随意重跑。

---

## 4. 配置（可选，默认值已匹配本机）

复制 `.env.example` 为 `.env`，按需修改。所有变量前缀为 `MGMT_`：

| 变量 | 默认值 | 含义 |
|---|---|---|
| `MGMT_DB_HOST` | 127.0.0.1 | 数据库地址 |
| `MGMT_DB_PORT` | 3306 | 数据库端口 |
| `MGMT_DB_USER` | root | 数据库用户 |
| `MGMT_DB_PASSWORD` | root | 数据库密码 |
| `MGMT_DB_NAME` | fleet_management | 数据库名 |
| `MGMT_CORS_ORIGINS` | http://localhost:5173,http://localhost:4173 | 额外放行的前端来源（逗号分隔） |
| `MGMT_PBKDF2_ITERATIONS` | 260000 | 密码哈希迭代次数（越大越安全、越慢） |

**关于 CORS**：除了上面显式配置的来源，后端还内置了一条正则，自动放行所有本地端口
`http://localhost:任意端口` 和 `http://127.0.0.1:任意端口`，因此 Vite/Preview 端口漂移（如 4174、4175）也不会再被浏览器拦截。

---

## 5. 启动服务

项目的统一启动入口是 **`backend/app.py`**（位于 management 的上一层），它会自动把 `management` 加入模块路径、切换工作目录，并在 **6563 端口**启动。

在 `backend` 目录下执行：

```powershell
& "C:\Users\work\Anaconda4\python.exe" app.py
```

看到下面这行就代表成功：

```
INFO:     Uvicorn running on http://127.0.0.1:6563
```

- 接口在线文档（可直接在网页上点着测）：http://127.0.0.1:6563/docs
- 资源目录：http://127.0.0.1:6563/api/v1/catalog

> 也可以在本目录直接用 uvicorn 启动，但端口请用 6563：
> `& "C:\Users\work\Anaconda4\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 6563`

---

## 6. 内置账号

| 角色 | 登录账号 | 初始密码 | 权限 |
|---|---|---|---|
| 管理员 | `admin` | `12345678` | 全量 47 个权限点 |
| 企业账号 | finance@acme.com | `123456` | 财务对账 19 个权限点（数据总览 + 充值明细） |

密码规则：

- **管理员可在"权限管理 → 修改密码"里改自己的密码**（需先验证原密码，新密码至少 8 位）。
- **管理员可重置其他账号的密码**，重置后默认恢复为 `123456`，对方下次登录生效。
- 管理员账号不能被重置（只能自己改），其他账号不能自行改密。

---

## 7. 接口一览（完整契约见 `port/Management/`）

| 方法 | 路径 | 作用 |
|---|---|---|
| POST | `/api/v1/auth/login` | 登录，返回权限点 |
| POST | `/api/v1/auth/change-password` | 管理员修改自己的密码 |
| GET | `/api/v1/catalog` | 资源目录（按模块分组） |
| GET | `/api/v1/accounts` | 账号列表 |
| GET | `/api/v1/accounts/{id}` | 账号详情 |
| POST | `/api/v1/accounts` | 新建账号 |
| PATCH | `/api/v1/accounts/{id}` | 修改账号（含权限） |
| POST | `/api/v1/accounts/{id}/reset-password` | 重置账号密码（默认 123456） |
| DELETE | `/api/v1/accounts/{id}` | 删除账号 |
| POST | `/api/v1/accounts/{id}/apply-template?template_id=x` | 应用模板 |
| GET | `/api/v1/templates` | 模板列表 |
| POST | `/api/v1/templates` | 新建模板 |
| PATCH | `/api/v1/templates/{id}` | 修改模板 |
| DELETE | `/api/v1/templates/{id}` | 删除模板（内置模板受保护） |

---

## 8. 常见问题（FAQ）

**Q：登录请求在浏览器控制台报 CORS 错误？**
A：先确认后端用的是**最新代码**（已内置本地端口正则）；若仍报错，检查是否有旧的 uvicorn 进程没重启，或把前端来源加进 `MGMT_CORS_ORIGINS`。

**Q：改了代码没生效？**
A：本服务没有开 `--reload`，需要在终端按 `Ctrl+C` 停止后重新执行启动命令。

**Q：提示数据库连接失败？**
A：检查 MySQL 服务是否启动、`.env` 里的地址/账号/密码是否正确、数据库是否已用 SQL 脚本初始化。

**Q：忘记账号密码怎么办？**
A：密码是单向哈希、无法还原。可由管理员在权限管理里重置，或重新执行 SQL 脚本（会清数据）。

**Q：前端怎么知道连哪个后端？**
A：默认连 `http://127.0.0.1:6563/api/v1`；需要改地址时，给前端设置环境变量 `VITE_API_BASE`。
