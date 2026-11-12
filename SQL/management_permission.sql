-- =====================================================================
-- 企业用车数据看板 · 权限管理（management）数据库初始化脚本
-- DB      : MySQL 5.7（同时兼容 8.0）
-- Charset : utf8mb4 / utf8mb4_general_ci
-- 说明    : 账号 + 细粒度权限（模块/指标块/可视化/数据字段）+ 权限模板
-- 表前缀  : 所有业务表统一加 tob_ 前缀，便于与其他项目区分
-- 可重复执行：先按外键依赖反向删除，再重建
-- =====================================================================

CREATE DATABASE IF NOT EXISTS fleet_management
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;
USE fleet_management;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS tob_account_permission_items;
DROP TABLE IF EXISTS tob_permission_template_items;
DROP TABLE IF EXISTS tob_permission_templates;
DROP TABLE IF EXISTS tob_accounts;
DROP TABLE IF EXISTS tob_permission_resources;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. 权限资源字典：系统中所有可被授权的“点”
--    resource_type: module 模块 / metric 指标块 / chart 可视化 / field 数据字段
-- ---------------------------------------------------------------------
CREATE TABLE tob_permission_resources (
  resource_key   VARCHAR(96)  NOT NULL PRIMARY KEY,
  module_key     VARCHAR(16)  NOT NULL,
  resource_type  ENUM('module','metric','chart','field') NOT NULL,
  resource_name  VARCHAR(64)  NOT NULL,
  sort_order     INT          NOT NULL DEFAULT 0,
  INDEX idx_module (module_key, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 2. 登录账号
-- ---------------------------------------------------------------------
CREATE TABLE tob_accounts (
  id             BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
  account        VARCHAR(128) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  company        VARCHAR(128) NOT NULL,
  status         ENUM('active','blocked') NOT NULL DEFAULT 'active',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at  DATETIME     NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 3. 权限模板（一键配置的“方案”）
-- ---------------------------------------------------------------------
CREATE TABLE tob_permission_templates (
  id            BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(64)  NOT NULL UNIQUE,
  description   VARCHAR(255) NULL,
  is_builtin    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 4. 模板权限项：某模板勾选了哪些资源（存在即启用）
-- ---------------------------------------------------------------------
CREATE TABLE tob_permission_template_items (
  template_id   BIGINT       NOT NULL,
  resource_key  VARCHAR(96)  NOT NULL,
  enabled       TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (template_id, resource_key),
  INDEX idx_tpl (template_id),
  CONSTRAINT tob_fk_tpl_item_template
    FOREIGN KEY (template_id) REFERENCES tob_permission_templates(id) ON DELETE CASCADE,
  CONSTRAINT tob_fk_tpl_item_resource
    FOREIGN KEY (resource_key) REFERENCES tob_permission_resources(resource_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 5. 账号权限项：某账号最终生效的资源（存在且 enabled=1 即可见）
-- ---------------------------------------------------------------------
CREATE TABLE tob_account_permission_items (
  account_id    BIGINT       NOT NULL,
  resource_key  VARCHAR(96)  NOT NULL,
  enabled       TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (account_id, resource_key),
  INDEX idx_account (account_id),
  CONSTRAINT tob_fk_acc_item_account
    FOREIGN KEY (account_id) REFERENCES tob_accounts(id) ON DELETE CASCADE,
  CONSTRAINT tob_fk_acc_item_resource
    FOREIGN KEY (resource_key) REFERENCES tob_permission_resources(resource_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================================
-- 初始化数据：权限资源字典（4 个模块 + 43 个资源 = 47 个权限点）
-- =====================================================================

-- 数据总览 overview（模块 + 5 指标块 + 3 可视化）
INSERT INTO tob_permission_resources (resource_key, module_key, resource_type, resource_name, sort_order) VALUES
('overview.module',                       'overview', 'module', '数据总览',       0),
('overview.metric.available_balance',     'overview', 'metric', '企业可分配余额', 1),
('overview.metric.employee_count',        'overview', 'metric', '员工数',         2),
('overview.metric.recharge_amount',       'overview', 'metric', '被充值总额',     3),
('overview.metric.ride_amount',           'overview', 'metric', '用车金额',       4),
('overview.metric.order_count',           'overview', 'metric', '产生订单数',     5),
('overview.chart.weekly_spend',           'overview', 'chart',  '月度消耗趋势',   6),
('overview.chart.orders_consumption',     'overview', 'chart',  '订单与消费趋势', 7),
('overview.chart.order_composition',      'overview', 'chart',  '订单审批情况',   8);

-- 员工详情 employees（模块 + 5 指标块 + 8 数据字段）
INSERT INTO tob_permission_resources (resource_key, module_key, resource_type, resource_name, sort_order) VALUES
('employees.module',                      'employees', 'module', '员工详情',       0),
('employees.metric.total',                'employees', 'metric', '员工总数',       1),
('employees.metric.wallet_total',         'employees', 'metric', '员工企业钱包总额',2),
('employees.metric.taxi_count',           'employees', 'metric', '打车员工数',     3),
('employees.metric.ride_amount',          'employees', 'metric', '用车金额',       4),
('employees.metric.recharge_amount',      'employees', 'metric', '员工被充值金额', 5),
('employees.field.id',                    'employees', 'field',  '员工 ID',        6),
('employees.field.name',                  'employees', 'field',  '姓名',           7),
('employees.field.phone',                 'employees', 'field',  '手机号',         8),
('employees.field.corp',                  'employees', 'field',  '企业钱包余额',   9),
('employees.field.recharge_threshold',    'employees', 'field',  '员工充值阈值',  10),
('employees.field.spend',                 'employees', 'field',  '本月支出',      11),
('employees.field.income',                'employees', 'field',  '本月被充值金额',12),
('employees.field.actions',               'employees', 'field',  '操作',          13);

-- 订单明细 orders（模块 + 2 指标块 + 12 数据字段）
INSERT INTO tob_permission_resources (resource_key, module_key, resource_type, resource_name, sort_order) VALUES
('orders.module',                         'orders', 'module', '订单明细',      0),
('orders.metric.order_count',             'orders', 'metric', '订单数',        1),
('orders.metric.ride_amount',             'orders', 'metric', '订单金额',      2),
('orders.field.id',                       'orders', 'field',  '订单号',        3),
('orders.field.employee',                 'orders', 'field',  '员工 ID',       4),
('orders.field.driver',                   'orders', 'field',  '司机 ID',       5),
('orders.field.phone',                    'orders', 'field',  '乘客电话',      6),
('orders.field.amount',                   'orders', 'field',  '订单金额',      7),
('orders.field.time',                     'orders', 'field',  '订单创建时间',  8),
('orders.field.start_city',               'orders', 'field',  '起点城市',      9),
('orders.field.end_city',                 'orders', 'field',  '终点城市',     10),
('orders.field.approval',                 'orders', 'field',  '审批状态',     11),
('orders.field.compliance',               'orders', 'field',  '合规状态',     12),
('orders.field.process',                  'orders', 'field',  '处理状态',     13);

-- 充值明细 recharge（模块 + 3 指标块 + 6 数据字段）
INSERT INTO tob_permission_resources (resource_key, module_key, resource_type, resource_name, sort_order) VALUES
('recharge.module',                       'recharge', 'module', '充值明细',      0),
('recharge.metric.total_amount',          'recharge', 'metric', '充值总金额',    1),
('recharge.metric.queue_count',           'recharge', 'metric', '充值队列数',    2),
('recharge.metric.employee_count',        'recharge', 'metric', '被充值员工数',  3),
('recharge.field.id',                     'recharge', 'field',  '被充值员工 ID', 4),
('recharge.field.name',                   'recharge', 'field',  '员工姓名',      5),
('recharge.field.amount',                'recharge', 'field',  '充值金额',      6),
('recharge.field.time',                   'recharge', 'field',  '充值时间',      7),
('recharge.field.status',                 'recharge', 'field',  '充值状态',      8),
('recharge.field.result',                 'recharge', 'field',  '处理结果',      9);

-- =====================================================================
-- 初始化数据：账号
--   admin   管理员，密码 12345678
--   finance 企业账号，默认密码 123456（PBKDF2-SHA256 哈希存储）
-- =====================================================================
INSERT INTO tob_accounts (account, password_hash, company, status, created_at, last_login_at) VALUES
('admin',
 'pbkdf2_sha256$260000$fa177389ba04829c35d882b87788136e$425bc85befe2f3a6ec22e29048bd91995c8dfdc6fb4ed8428f533e38b61893d2',
 'Acme Mobility Ltd.', 'active', '2026-04-12 10:20:00', '2026-10-30 14:26:00'),
('finance@acme.com',
 'pbkdf2_sha256$260000$099cc828bed9bcf51216a9faa1a7652b$e7e0131f415f2410e4453f1bc07ddf8f7d4db2608b3e6545181ab04064f7808b',
 'Acme Mobility Ltd.', 'active', '2026-06-08 16:43:00', '2026-10-30 13:58:00');

-- =====================================================================
-- 初始化数据：内置权限模板
-- =====================================================================
INSERT INTO tob_permission_templates (id, name, description, is_builtin) VALUES
(1, '全量管理员模板', '包含全部四个模块及所有指标、图表、字段', 1),
(2, '财务对账模板',   '仅数据总览与充值明细，面向财务对账场景', 1);

-- 模板 1：全量（全部资源）
INSERT INTO tob_permission_template_items (template_id, resource_key, enabled)
SELECT 1, resource_key, 1 FROM tob_permission_resources;

-- 模板 2：财务对账（overview 与 recharge 两个模块的全部资源）
INSERT INTO tob_permission_template_items (template_id, resource_key, enabled)
SELECT 2, resource_key, 1
FROM tob_permission_resources
WHERE module_key IN ('overview', 'recharge');

-- =====================================================================
-- 初始化数据：账号权限
-- admin   -> 全量；finance -> 数据总览 + 充值明细
-- =====================================================================
INSERT INTO tob_account_permission_items (account_id, resource_key, enabled)
SELECT a.id, r.resource_key, 1
FROM tob_accounts a
CROSS JOIN tob_permission_resources r
WHERE a.account = 'admin';

INSERT INTO tob_account_permission_items (account_id, resource_key, enabled)
SELECT a.id, r.resource_key, 1
FROM tob_accounts a
CROSS JOIN tob_permission_resources r
WHERE a.account = 'finance@acme.com'
  AND r.module_key IN ('overview', 'recharge');
