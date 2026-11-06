import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, DatePicker, Skeleton, Space, Tag, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { overviewDataSource } from './service'
import type { MonthlyOverviewMetrics, OrderComposition, OverviewMonth, OverviewSnapshot, WeekSpend } from './types'
import { ArrowDownOutlined, ArrowUpOutlined } from '../../icons'
import './overview.css'

const { Title, Text } = Typography
const chartColors = ['#1f3a56', '#e5a63b', '#d96876']
const orderLabels = ['已审批订单', '未审批订单', '违规订单']

function money(value: number) {
  return `₦ ${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function monthTitle(month: OverviewMonth) {
  return dayjs(`${month}-01`).format('YYYY年M月')
}

function MetricCard({ title, value, unit = '', accent = false, change, down = false }: { title: string; value: string; unit?: string; accent?: boolean; change?: string; down?: boolean }) {
  return <Card className={`kpi-card overview-metric-card${accent ? ' highlight' : ''}`}>
    <div className="kpi-title"><Text>{title}</Text></div>
    <div className="kpi-value">{value}<span>{unit}</span></div>
    <div className="kpi-foot">
      {change && <span className={down ? 'trend down' : 'trend'}>{down ? <ArrowDownOutlined /> : <ArrowUpOutlined />} {change}</span>}
      {change && <Text type="secondary">较上周期</Text>}
    </div>
  </Card>
}

function WeeklySpendChart({ month, data, loading }: { month: OverviewMonth; data: WeekSpend[]; loading: boolean }) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)
  const values = [1, 2, 3, 4].map((week) => data.find((item) => item.week === week)?.amount ?? 0)
  // Keep the original multi-peak curve; weekly values remain available on the
  // four matching hover targets so the graph stays readable without flattening.
  const points = values.map((amount, index) => ({
    x: [96, 292, 476, 650][index],
    y: [57, 43, 42, 17][index],
    amount,
    week: index + 1,
  }))
  const total = values.reduce((sum, value) => sum + value, 0)
  const hovered = hoveredWeek === null ? null : points[hoveredWeek - 1]

  return <Card className="overview-spend-card">
    <div className="overview-spend-summary">
      <Text type="secondary">{monthTitle(month)}消耗趋势</Text>
      <Title level={5}>{loading ? '—' : money(total)}</Title>
      <Text type="secondary">每周订单消费金额 · {monthTitle(month)}</Text>
    </div>
    <div className="weekly-chart-wrap">
      {hovered && <div className="weekly-chart-tooltip"><strong>第{hovered.week}周</strong><span>{money(hovered.amount)}</span></div>}
      {loading ? <Skeleton active paragraph={false} /> : <svg viewBox="0 0 700 124" className="weekly-chart" role="img" aria-label={`${monthTitle(month)}每周消费趋势`}>
        <defs><linearGradient id="weekly-spend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2f76b2" stopOpacity=".16" /><stop offset="1" stopColor="#2f76b2" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 70 C40 66 54 50 96 57 S150 35 193 45 S250 70 292 43 S350 50 390 28 S436 31 476 42 S525 24 575 33 S628 15 700 21 V90 H0Z" className="weekly-area" />
        <path d="M0 70 C40 66 54 50 96 57 S150 35 193 45 S250 70 292 43 S350 50 390 28 S436 31 476 42 S525 24 575 33 S628 15 700 21" className="weekly-line" />
        {points.map((point) => <g key={point.week} className="weekly-point" onMouseEnter={() => setHoveredWeek(point.week)} onMouseLeave={() => setHoveredWeek(null)} onFocus={() => setHoveredWeek(point.week)} onBlur={() => setHoveredWeek(null)} tabIndex={0} role="button" aria-label={`第${point.week}周，${money(point.amount)}`}>
          <title>{`第${point.week}周：${money(point.amount)}`}</title>
          <circle cx={point.x} cy={point.y} r="19" className="weekly-hit-target" />
          {hoveredWeek === point.week && <circle cx={point.x} cy={point.y} r="4" className="weekly-dot" />}
        </g>)}
        {points.map((point) => <text key={`label-${point.week}`} x={point.x} y="119" textAnchor="middle" className="weekly-axis-label">第{point.week}周</text>)}
      </svg>}
    </div>
  </Card>
}

function OrdersConsumptionChart() {
  return <Card className="chart-card overview-orders-chart">
    <div className="section-head"><div><Title level={5}>订单与消费趋势</Title><Text type="secondary">按周查看订单量与消费金额 · 近 8 周</Text></div><Space><span className="legend blue" />消费金额<span className="legend light" />订单数</Space></div>
    <svg viewBox="0 0 760 180" className="chart-svg" role="img" aria-label="近八周消费趋势"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2f76b2" stopOpacity=".22" /><stop offset="1" stopColor="#2f76b2" stopOpacity="0" /></linearGradient></defs>{[25, 70, 115, 160].map((y) => <line key={y} x1="24" y1={y} x2="742" y2={y} className="grid-line" />)}<path className="area" d="M24 148 C62 138 82 124 116 132 S169 93 205 112 S252 74 286 98 S332 120 366 82 S417 68 450 76 S495 48 531 62 S578 85 610 55 S661 36 699 46 S727 25 742 32 V160 H24 Z" /><path className="chart-line" d="M24 148 C62 138 82 124 116 132 S169 93 205 112 S252 74 286 98 S332 120 366 82 S417 68 450 76 S495 48 531 62 S578 85 610 55 S661 36 699 46 S727 25 742 32" /><path className="chart-line soft" d="M24 137 C62 145 82 129 116 141 S169 110 205 126 S252 110 286 119 S332 136 366 101 S417 92 450 101 S495 78 531 92 S578 115 610 91 S661 71 699 81 S727 68 742 73" />{['第1周', '第3周', '第5周', '第7周', '本周'].map((label, index) => <text key={label} x={[20, 192, 365, 538, 700][index]} y="176" className="axis-label">{label}</text>)}</svg>
  </Card>
}

function OrderCompositionChart({ data }: { data: OrderComposition | null }) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const values = data ? [data.approved, data.pending, data.violations] : [0, 0, 0]
  const total = values.reduce((sum, value) => sum + value, 0)
  const circumference = 2 * Math.PI * 57
  let offset = 0

  return <Card className="chart-card structure-card order-composition-card">
    <div className="section-head"><div><Title level={5}>本月订单审批情况</Title><Text type="secondary">按审批状态与违规识别拆分</Text></div><Tag color="blue">本月</Tag></div>
    <div className="donut-row"><div className="donut"><svg viewBox="0 0 160 160" role="img" aria-label={`本月审批、未审批及违规订单，共${total}笔`}>
      <circle cx="80" cy="80" r="57" fill="none" stroke="#e8edf3" strokeWidth="16" />
      {values.map((value, index) => {
        const length = total ? (value / total) * circumference : 0
        const currentOffset = offset
        offset += length
        return <circle key={orderLabels[index]} cx="80" cy="80" r="57" fill="none" stroke={chartColors[index]} strokeWidth={hoveredSegment === index ? 19 : 16} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-currentOffset} strokeLinecap="butt" transform="rotate(-90 80 80)" className="donut-segment" onMouseEnter={() => setHoveredSegment(index)} onMouseLeave={() => setHoveredSegment(null)} onFocus={() => setHoveredSegment(index)} onBlur={() => setHoveredSegment(null)} tabIndex={0} role="button" aria-label={`${orderLabels[index]} ${value}笔`}><title>{`${orderLabels[index]}：${value.toLocaleString()} 笔`}</title></circle>
      })}
      <text x="80" y="78" textAnchor="middle" className="donut-big">{total.toLocaleString()}</text><text x="80" y="96" textAnchor="middle" className="donut-small">本月订单</text>
    </svg></div><div className="donut-legend">{values.map((value, index) => <div key={orderLabels[index]} className={hoveredSegment === index ? 'active' : ''} onMouseEnter={() => setHoveredSegment(index)} onMouseLeave={() => setHoveredSegment(null)}><i style={{ background: chartColors[index] }} />{orderLabels[index]}<strong>{value.toLocaleString()}</strong></div>)}<small className="order-chart-hint">{hoveredSegment === null ? '悬停图例或圆环查看详情' : `${orderLabels[hoveredSegment]} · ${values[hoveredSegment].toLocaleString()} 笔`}</small></div></div>
  </Card>
}

export function OverviewDashboard({ onExport }: { onExport: () => void }) {
  const currentMonth = dayjs().format('YYYY-MM')
  const previousMonth = dayjs().subtract(1, 'month').format('YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState<OverviewMonth>(previousMonth)
  const [snapshot, setSnapshot] = useState<OverviewSnapshot | null>(null)
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyOverviewMetrics | null>(null)
  const [weeklySpend, setWeeklySpend] = useState<WeekSpend[]>([])
  const [composition, setComposition] = useState<OrderComposition | null>(null)
  const [loading, setLoading] = useState(true)
  const [baseError, setBaseError] = useState(false)
  const [monthError, setMonthError] = useState(false)
  const chartMonth = selectedMonth === currentMonth ? previousMonth : selectedMonth
  const selectedMonthLabel = selectedMonth === currentMonth ? '本月' : dayjs(`${selectedMonth}-01`).format('M月')
  const pickerValue = useMemo(() => dayjs(`${selectedMonth}-01`), [selectedMonth])

  useEffect(() => {
    let active = true
    Promise.all([
      overviewDataSource.getSnapshot(),
      overviewDataSource.getCurrentMonthOrderComposition(),
    ]).then(([snapshotData, compositionData]) => {
      if (!active) return
      setSnapshot(snapshotData)
      setComposition(compositionData)
      setBaseError(false)
    }).catch(() => { if (active) setBaseError(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      overviewDataSource.getMonthlyMetrics(selectedMonth),
      overviewDataSource.getWeeklySpend(chartMonth),
    ]).then(([metricData, spendData]) => {
      if (!active) return
      setMonthlyMetrics(metricData)
      setWeeklySpend(spendData)
      setMonthError(false)
    }).catch(() => { if (active) setMonthError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selectedMonth, chartMonth])

  return <>
    <div className="page-header overview-page-header"><div><Title level={2}>数据总览</Title><Text type="secondary">企业用车余额与运营数据</Text></div><Button className="export-button" onClick={onExport}>导出Excel</Button></div>
    {(baseError || monthError) && <Alert className="overview-data-error" type="error" showIcon message={baseError ? '基础概览数据加载失败，请稍后重试。' : '所选月份的运营指标加载失败，请稍后重试。'} />}
    <div className="overview-fixed-metrics">
      <MetricCard title="企业可分配余额" value={snapshot ? money(snapshot.balances.available) : '—'} accent change="6.9%" />
      <MetricCard title="公司账户剩余余额" value={snapshot ? money(snapshot.balances.company) : '—'} change="12.8%" />
      <MetricCard title="员工数" value={snapshot ? snapshot.employeeCount.toLocaleString() : '—'} unit="人" change="4.2%" />
    </div>
    <div className="overview-month-filter"><div><Text strong>月度运营指标</Text><Text type="secondary">选择月份查看充值、消耗与订单数据</Text></div><div className="overview-month-control"><Text type="secondary">筛选月份</Text><DatePicker picker="month" value={pickerValue} allowClear={false} disabledDate={(date: Dayjs) => date.isAfter(dayjs(), 'month')} onChange={(date) => { if (date) setSelectedMonth(date.format('YYYY-MM')) }} /></div></div>
    <div className="overview-monthly-metrics">
      <MetricCard title={`${selectedMonthLabel}被充值总额`} value={monthlyMetrics ? money(monthlyMetrics.rechargeAmount) : '—'} change={monthlyMetrics ? `${Math.abs(monthlyMetrics.rechargeChangePercent).toFixed(1)}%` : undefined} down={!!monthlyMetrics && monthlyMetrics.rechargeChangePercent < 0} />
      <MetricCard title={`${selectedMonthLabel}消耗总额`} value={monthlyMetrics ? money(monthlyMetrics.spendAmount) : '—'} change={monthlyMetrics ? `${Math.abs(monthlyMetrics.spendChangePercent).toFixed(1)}%` : undefined} down={!!monthlyMetrics && monthlyMetrics.spendChangePercent < 0} />
      <MetricCard title={`${selectedMonthLabel}产生订单数`} value={monthlyMetrics ? monthlyMetrics.orderCount.toLocaleString() : '—'} unit="笔" change={monthlyMetrics ? `${Math.abs(monthlyMetrics.orderChangePercent).toFixed(1)}%` : undefined} down={!!monthlyMetrics && monthlyMetrics.orderChangePercent < 0} />
    </div>
    <WeeklySpendChart month={chartMonth} data={weeklySpend} loading={loading} />
    <div className="overview-charts"><OrdersConsumptionChart /><OrderCompositionChart data={composition} /></div>
  </>
}
