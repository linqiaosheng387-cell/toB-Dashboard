import type { OverviewDataSource, OverviewMonth, OverviewSnapshot, OrderComposition, WeekSpend } from './types'

const snapshot: OverviewSnapshot = {
  balances: { available: 38600, company: 128460 },
  employeeCount: 248,
}

const monthFixtures: Record<string, { metrics: { rechargeAmount: number; spendAmount: number; orderCount: number; rechargeChangePercent: number; spendChangePercent: number; orderChangePercent: number }; weeklySpend: WeekSpend[] }> = {
  '2026-09': {
    metrics: { rechargeAmount: 78200, spendAmount: 66480, orderCount: 16104, rechargeChangePercent: 8.4, spendChangePercent: -3.1, orderChangePercent: 11.7 },
    weeklySpend: [{ week: 1, amount: 14520 }, { week: 2, amount: 15650 }, { week: 3, amount: 17400 }, { week: 4, amount: 18910 }],
  },
  '2026-10': {
    metrics: { rechargeAmount: 86200, spendAmount: 74820.5, orderCount: 18642, rechargeChangePercent: 8.4, spendChangePercent: -3.1, orderChangePercent: 11.7 },
    weeklySpend: [{ week: 1, amount: 16420 }, { week: 2, amount: 17280 }, { week: 3, amount: 18540 }, { week: 4, amount: 22580.5 }],
  },
  '2026-11': {
    metrics: { rechargeAmount: 24800, spendAmount: 21360, orderCount: 6350, rechargeChangePercent: 8.4, spendChangePercent: -3.1, orderChangePercent: 11.7 },
    weeklySpend: [{ week: 1, amount: 21360 }, { week: 2, amount: 0 }, { week: 3, amount: 0 }, { week: 4, amount: 0 }],
  },
}

function getMonthFixture(month: OverviewMonth) {
  const fixture = monthFixtures[month]
  if (fixture) return fixture

  const seed = Number(month.replace('-', '')) || 202601
  const rechargeAmount = 70000 + (seed % 13) * 1250
  const spendAmount = rechargeAmount * 0.86
  const orderCount = Math.round(spendAmount / 4.1)
  const shares = [0.22, 0.24, 0.25, 0.29]
  return {
    metrics: { rechargeAmount, spendAmount, orderCount, rechargeChangePercent: 8.4, spendChangePercent: -3.1, orderChangePercent: 11.7 },
    weeklySpend: shares.map((share, index) => ({ week: (index + 1) as 1 | 2 | 3 | 4, amount: Math.round(spendAmount * share) })),
  }
}

/**
 * Local demo adapter for the API contract. Replace the method bodies with HTTP
 * requests when the backend is ready; the overview UI depends only on this interface.
 */
export const overviewDataSource: OverviewDataSource = {
  async getSnapshot() {
    return snapshot
  },
  async getMonthlyMetrics(month) {
    return getMonthFixture(month).metrics
  },
  async getWeeklySpend(month) {
    return getMonthFixture(month).weeklySpend
  },
  async getCurrentMonthOrderComposition(): Promise<OrderComposition> {
    // Mock only. The production endpoint should return the live current-month counts.
    return { approved: 5934, pending: 348, violations: 68 }
  },
}
