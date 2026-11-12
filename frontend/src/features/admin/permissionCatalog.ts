/**
 * 前端权限资源字典（权威静态目录）。
 * 与后端 SQL/management_permission.sql 中的 47 个 permission_resources 一一对应。
 * 资源 key 命名规范：{模块}.{类型}.{标识}
 */

export type ResourceType = "module" | "metric" | "chart" | "field";
export type ModuleKey = "overview" | "employees" | "orders" | "recharge";

export interface PermissionResource {
  key: string;
  module: ModuleKey;
  type: ResourceType;
  name: string;
}

export interface PermissionModule {
  key: ModuleKey;
  name: string;
  metrics: PermissionResource[];
  charts: PermissionResource[];
  fields: PermissionResource[];
}

/** 扁平资源定义：47 个权限点（4 模块 + 43 资源）。 */
export const ALL_RESOURCES: readonly PermissionResource[] = [
  // 数据总览
  { key: "overview.module", module: "overview", type: "module", name: "数据总览" },
  { key: "overview.metric.available_balance", module: "overview", type: "metric", name: "企业可分配余额" },
  { key: "overview.metric.employee_count", module: "overview", type: "metric", name: "员工数" },
  { key: "overview.metric.recharge_amount", module: "overview", type: "metric", name: "被充值总额" },
  { key: "overview.metric.ride_amount", module: "overview", type: "metric", name: "用车金额" },
  { key: "overview.metric.order_count", module: "overview", type: "metric", name: "产生订单数" },
  { key: "overview.chart.weekly_spend", module: "overview", type: "chart", name: "月度消耗趋势" },
  { key: "overview.chart.orders_consumption", module: "overview", type: "chart", name: "订单与消费趋势" },
  { key: "overview.chart.order_composition", module: "overview", type: "chart", name: "订单审批情况" },

  // 员工详情
  { key: "employees.module", module: "employees", type: "module", name: "员工详情" },
  { key: "employees.metric.total", module: "employees", type: "metric", name: "员工总数" },
  { key: "employees.metric.wallet_total", module: "employees", type: "metric", name: "员工企业钱包总额" },
  { key: "employees.metric.taxi_count", module: "employees", type: "metric", name: "打车员工数" },
  { key: "employees.metric.ride_amount", module: "employees", type: "metric", name: "用车金额" },
  { key: "employees.metric.recharge_amount", module: "employees", type: "metric", name: "员工被充值金额" },
  { key: "employees.field.id", module: "employees", type: "field", name: "员工 ID" },
  { key: "employees.field.name", module: "employees", type: "field", name: "姓名" },
  { key: "employees.field.phone", module: "employees", type: "field", name: "手机号" },
  { key: "employees.field.corp", module: "employees", type: "field", name: "企业钱包余额" },
  { key: "employees.field.recharge_threshold", module: "employees", type: "field", name: "员工充值阈值" },
  { key: "employees.field.spend", module: "employees", type: "field", name: "本月支出" },
  { key: "employees.field.income", module: "employees", type: "field", name: "本月被充值金额" },
  { key: "employees.field.actions", module: "employees", type: "field", name: "操作" },

  // 订单明细
  { key: "orders.module", module: "orders", type: "module", name: "订单明细" },
  { key: "orders.metric.order_count", module: "orders", type: "metric", name: "订单数" },
  { key: "orders.metric.ride_amount", module: "orders", type: "metric", name: "订单金额" },
  { key: "orders.field.id", module: "orders", type: "field", name: "订单号" },
  { key: "orders.field.employee", module: "orders", type: "field", name: "员工 ID" },
  { key: "orders.field.driver", module: "orders", type: "field", name: "司机 ID" },
  { key: "orders.field.phone", module: "orders", type: "field", name: "乘客电话" },
  { key: "orders.field.amount", module: "orders", type: "field", name: "订单金额" },
  { key: "orders.field.time", module: "orders", type: "field", name: "订单创建时间" },
  { key: "orders.field.start_city", module: "orders", type: "field", name: "起点城市" },
  { key: "orders.field.end_city", module: "orders", type: "field", name: "终点城市" },
  { key: "orders.field.approval", module: "orders", type: "field", name: "审批状态" },
  { key: "orders.field.compliance", module: "orders", type: "field", name: "合规状态" },
  { key: "orders.field.process", module: "orders", type: "field", name: "处理状态" },

  // 充值明细
  { key: "recharge.module", module: "recharge", type: "module", name: "充值明细" },
  { key: "recharge.metric.total_amount", module: "recharge", type: "metric", name: "充值总金额" },
  { key: "recharge.metric.queue_count", module: "recharge", type: "metric", name: "充值队列数" },
  { key: "recharge.metric.employee_count", module: "recharge", type: "metric", name: "被充值员工数" },
  { key: "recharge.field.id", module: "recharge", type: "field", name: "被充值员工 ID" },
  { key: "recharge.field.name", module: "recharge", type: "field", name: "员工姓名" },
  { key: "recharge.field.amount", module: "recharge", type: "field", name: "充值金额" },
  { key: "recharge.field.time", module: "recharge", type: "field", name: "充值时间" },
  { key: "recharge.field.status", module: "recharge", type: "field", name: "充值状态" },
  { key: "recharge.field.result", module: "recharge", type: "field", name: "处理结果" },
];

/** 静态资源 key 常量，供页面元素做权限判断时引用（编译期可检查拼写）。 */
export const PERMISSION_KEYS = {
  overview: {
    module: "overview.module",
    metric: {
      availableBalance: "overview.metric.available_balance",
      employeeCount: "overview.metric.employee_count",
      rechargeAmount: "overview.metric.recharge_amount",
      rideAmount: "overview.metric.ride_amount",
      orderCount: "overview.metric.order_count",
    },
    chart: {
      weeklySpend: "overview.chart.weekly_spend",
      ordersConsumption: "overview.chart.orders_consumption",
      orderComposition: "overview.chart.order_composition",
    },
  },
  employees: {
    module: "employees.module",
    metric: {
      total: "employees.metric.total",
      walletTotal: "employees.metric.wallet_total",
      taxiCount: "employees.metric.taxi_count",
      rideAmount: "employees.metric.ride_amount",
      rechargeAmount: "employees.metric.recharge_amount",
    },
    field: {
      id: "employees.field.id",
      name: "employees.field.name",
      phone: "employees.field.phone",
      corp: "employees.field.corp",
      rechargeThreshold: "employees.field.recharge_threshold",
      spend: "employees.field.spend",
      income: "employees.field.income",
      actions: "employees.field.actions",
    },
  },
  orders: {
    module: "orders.module",
    metric: {
      orderCount: "orders.metric.order_count",
      rideAmount: "orders.metric.ride_amount",
    },
    field: {
      id: "orders.field.id",
      employee: "orders.field.employee",
      driver: "orders.field.driver",
      phone: "orders.field.phone",
      amount: "orders.field.amount",
      time: "orders.field.time",
      startCity: "orders.field.start_city",
      endCity: "orders.field.end_city",
      approval: "orders.field.approval",
      compliance: "orders.field.compliance",
      process: "orders.field.process",
    },
  },
  recharge: {
    module: "recharge.module",
    metric: {
      totalAmount: "recharge.metric.total_amount",
      queueCount: "recharge.metric.queue_count",
      employeeCount: "recharge.metric.employee_count",
    },
    field: {
      id: "recharge.field.id",
      name: "recharge.field.name",
      amount: "recharge.field.amount",
      time: "recharge.field.time",
      status: "recharge.field.status",
      result: "recharge.field.result",
    },
  },
} as const;

/** 按模块分组的目录，供账号编辑器渲染。 */
export const PERMISSION_MODULES: PermissionModule[] = (() => {
  const buckets = new Map<ModuleKey, PermissionModule>();

  for (const resource of ALL_RESOURCES) {
    if (resource.type === "module") {
      buckets.set(resource.module, {
        key: resource.module,
        name: resource.name,
        metrics: [],
        charts: [],
        fields: [],
      });
    }
  }

  for (const resource of ALL_RESOURCES) {
    const bucket = buckets.get(resource.module);
    if (!bucket || resource.type === "module") continue;
    if (resource.type === "metric") bucket.metrics.push(resource);
    if (resource.type === "chart") bucket.charts.push(resource);
    if (resource.type === "field") bucket.fields.push(resource);
  }

  return Array.from(buckets.values());
})();

/**
 * Resolve the i18n key for a resource's display name.
 * Resource keys use dots ('employees.metric.total') while the dictionary uses
 * the underscore form under the 'perm' group ('perm.employees_metric_total').
 */
export function resourceLabelKey(resourceKey: string): string {
  return `perm.${resourceKey.replace(/\./g, "_")}`;
}
