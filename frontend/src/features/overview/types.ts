export type OverviewMonth = string

export type WeekSpend = {
  week: 1 | 2 | 3 | 4
  amount: number
}

export type MonthlyOverviewMetrics = {
  rechargeAmount: number
  spendAmount: number
  orderCount: number
  rechargeChangePercent: number
  spendChangePercent: number
  orderChangePercent: number
}

export type OrderComposition = {
  approved: number
  pending: number
  violations: number
}

export type OverviewSnapshot = {
  balances: { available: number; company: number }
  employeeCount: number
}

export interface OverviewDataSource {
  /** Stable headline values that do not change with the selected month. */
  getSnapshot(): Promise<OverviewSnapshot>
  getMonthlyMetrics(month: OverviewMonth): Promise<MonthlyOverviewMetrics>
  getWeeklySpend(month: OverviewMonth): Promise<WeekSpend[]>
  /** Always describes the live calendar month, independent of the selected summary month. */
  getCurrentMonthOrderComposition(): Promise<OrderComposition>
}
