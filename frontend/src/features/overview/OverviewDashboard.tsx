import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Alert, Button, Card, DatePicker, Skeleton, Space, Tag, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { overviewDataSource } from './service'
import type { MonthlyOverviewMetrics, OrderComposition, OverviewMonth, OverviewSnapshot, WeekSpend } from './types'
import { AnimatedNumber } from '../../animations'
import { ArrowDownOutlined, ArrowUpOutlined } from '../../icons'
import { usePermission } from '../admin/PermissionContext'
import { PERMISSION_KEYS } from '../admin/permissionCatalog'
import { useI18n } from '../../i18n/LanguageContext'
import './overview.css'

const { Title, Text } = Typography
const chartColors = ['#1f3a56', '#e5a63b', '#d96876']
/** Order composition labels in fixed segment order: approved, pending, violation. */
const COMPOSITION_LABEL_KEYS = ['overview.approvedOrders', 'overview.pendingOrders', 'overview.violationOrders']

function money(value: number) {
  return `₦ ${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Localized month heading: Chinese uses explicit year/month, English uses month name + year. */
function formatMonthTitle(month: OverviewMonth, language: string) {
  return dayjs(`${month}-01`).format(language === 'zh' ? 'YYYY年M月' : 'MMMM YYYY')
}

function MetricCard({ title, value, numeric, valueFormat, unit = '', accent = false, change, down = false }: { title: string; value?: string; numeric?: number; valueFormat?: (n: number) => string; unit?: string; accent?: boolean; change?: string; down?: boolean }) {
  const { t } = useI18n()
  return <Card className={`kpi-card overview-metric-card${accent ? ' highlight' : ''}`}>
    <div className="kpi-title"><Text>{title}</Text></div>
    <div className="kpi-value">{numeric !== undefined ? <AnimatedNumber value={numeric} format={valueFormat} /> : value}<span>{unit}</span></div>
    <div className="kpi-foot">
      {change && <span className={down ? 'trend down' : 'trend'}>{down ? <ArrowDownOutlined /> : <ArrowUpOutlined />} {change}</span>}
      {change && <Text type="secondary">{t('common.comparison')}</Text>}
    </div>
  </Card>
}

function WeeklySpendChart({ month, data, loading }: { month: OverviewMonth; data: WeekSpend[]; loading: boolean }) {
  const { t, language } = useI18n()
  const monthLabel = formatMonthTitle(month, language)
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)
  const lineRef = useRef<SVGPathElement>(null)
  const [lineLen, setLineLen] = useState(0)
  useLayoutEffect(() => {
    if (!loading && lineRef.current) setLineLen(lineRef.current.getTotalLength())
  }, [loading])
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
      <Text type="secondary">{t('overview.spendTrend', { month: monthLabel })}</Text>
      <Title level={5}>{loading ? '—' : <AnimatedNumber value={total} format={money} />}</Title>
      <Text type="secondary">{t('overview.weeklySpendHint', { month: monthLabel })}</Text>
    </div>
    <div className="weekly-chart-wrap">
      {hovered && <div className="weekly-chart-tooltip"><strong>{t('overview.weekN', { n: hovered.week })}</strong><span>{money(hovered.amount)}</span></div>}
      {loading ? <Skeleton active paragraph={false} /> : <svg viewBox="0 0 700 124" className="weekly-chart" role="img" aria-label={`${monthLabel} ${t('overview.weeklySpendHint', { month: '' })}`}>
        <defs><linearGradient id="weekly-spend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2f76b2" stopOpacity=".16" /><stop offset="1" stopColor="#2f76b2" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 70 C40 66 54 50 96 57 S150 35 193 45 S250 70 292 43 S350 50 390 28 S436 31 476 42 S525 24 575 33 S628 15 700 21 V90 H0Z" className="weekly-area draw-area" />
        <path ref={lineRef} d="M0 70 C40 66 54 50 96 57 S150 35 193 45 S250 70 292 43 S350 50 390 28 S436 31 476 42 S525 24 575 33 S628 15 700 21" className="weekly-line draw-line" style={{ '--path-len': lineLen } as CSSProperties} />
        {points.map((point) => <g key={point.week} className="weekly-point" onMouseEnter={() => setHoveredWeek(point.week)} onMouseLeave={() => setHoveredWeek(null)} onFocus={() => setHoveredWeek(point.week)} onBlur={() => setHoveredWeek(null)} tabIndex={0} role="button" aria-label={`${t('overview.weekN', { n: point.week })}, ${money(point.amount)}`}>
          <title>{`${t('overview.weekN', { n: point.week })}: ${money(point.amount)}`}</title>
          <circle cx={point.x} cy={point.y} r="19" className="weekly-hit-target" />
          {hoveredWeek === point.week && <circle cx={point.x} cy={point.y} r="4" className="weekly-dot" />}
        </g>)}
        {points.map((point) => <text key={`label-${point.week}`} x={point.x} y="119" textAnchor="middle" className="weekly-axis-label">{t('overview.weekN', { n: point.week })}</text>)}
      </svg>}
    </div>
  </Card>
}

function OrdersConsumptionChart() {
  const { t } = useI18n()
  const mainRef = useRef<SVGPathElement>(null)
  const softRef = useRef<SVGPathElement>(null)
  const [mainLen, setMainLen] = useState(0)
  const [softLen, setSoftLen] = useState(0)
  useLayoutEffect(() => {
    if (mainRef.current) setMainLen(mainRef.current.getTotalLength())
    if (softRef.current) setSoftLen(softRef.current.getTotalLength())
  }, [])

  return <Card className="chart-card overview-orders-chart">
    <div className="section-head"><div><Title level={5}>{t('overview.ordersConsumption')}</Title><Text type="secondary">{t('overview.ordersConsumptionHint')}</Text></div><Space><span className="legend blue" />{t('overview.spendLegend')}<span className="legend light" />{t('overview.countLegend')}</Space></div>
    <svg viewBox="0 0 760 180" className="chart-svg" role="img" aria-label={t('overview.ordersConsumption')}><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2f76b2" stopOpacity=".22" /><stop offset="1" stopColor="#2f76b2" stopOpacity="0" /></linearGradient></defs>{[25, 70, 115, 160].map((y) => <line key={y} x1="24" y1={y} x2="742" y2={y} className="grid-line" />)}<path className="area draw-area" d="M24 148 C62 138 82 124 116 132 S169 93 205 112 S252 74 286 98 S332 120 366 82 S417 68 450 76 S495 48 531 62 S578 85 610 55 S661 36 699 46 S727 25 742 32 V160 H24 Z" /><path ref={mainRef} className="chart-line draw-line" style={{ '--path-len': mainLen } as CSSProperties} d="M24 148 C62 138 82 124 116 132 S169 93 205 112 S252 74 286 98 S332 120 366 82 S417 68 450 76 S495 48 531 62 S578 85 610 55 S661 36 699 46 S727 25 742 32" /><path ref={softRef} className="chart-line soft draw-line" style={{ '--path-len': softLen } as CSSProperties} d="M24 137 C62 145 82 129 116 141 S169 110 205 126 S252 110 286 119 S332 136 366 101 S417 92 450 101 S495 78 531 92 S578 115 610 91 S661 71 699 81 S727 68 742 73" />{[1, 3, 5, 7].map((week, index) => <text key={week} x={[20, 192, 365, 538][index]} y="176" className="axis-label">{t('overview.weekN', { n: week })}</text>)}<text x="700" y="176" className="axis-label">{t('overview.thisWeek')}</text></svg>
  </Card>
}

function OrderCompositionChart({ data }: { data: OrderComposition | null }) {
  const { t } = useI18n()
  const labels = COMPOSITION_LABEL_KEYS.map((key) => t(key))
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const values = data ? [data.approved, data.pending, data.violations] : [0, 0, 0]
  const total = values.reduce((sum, value) => sum + value, 0)
  const circumference = 2 * Math.PI * 57
  let offset = 0

  return <Card className="chart-card structure-card order-composition-card">
    <div className="section-head"><div><Title level={5}>{t('overview.composition')}</Title><Text type="secondary">{t('overview.compositionHint')}</Text></div><Tag color="blue">{t('overview.thisMonth')}</Tag></div>
    <div className="donut-row"><div className="donut"><svg viewBox="0 0 160 160" role="img" aria-label={`${t('overview.composition')}, ${total}`}>
      <circle cx="80" cy="80" r="57" fill="none" stroke="#e8edf3" strokeWidth="16" className="donut-track" />
      {values.map((value, index) => {
        const length = total ? (value / total) * circumference : 0
        const currentOffset = offset
        offset += length
        return <circle key={labels[index]} cx="80" cy="80" r="57" fill="none" stroke={chartColors[index]} strokeWidth={hoveredSegment === index ? 19 : 16} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-currentOffset} strokeLinecap="butt" transform="rotate(-90 80 80)" className="donut-segment" style={{ '--seg-len': length, '--seg-off': -currentOffset, '--seg-circ': circumference, '--i': index } as CSSProperties} onMouseEnter={() => setHoveredSegment(index)} onMouseLeave={() => setHoveredSegment(null)} onFocus={() => setHoveredSegment(index)} onBlur={() => setHoveredSegment(null)} tabIndex={0} role="button" aria-label={`${labels[index]} ${value}`}><title>{`${labels[index]}: ${value.toLocaleString()}`}</title></circle>
      })}
      <text x="80" y="78" textAnchor="middle" className="donut-big"><AnimatedNumber value={total} /></text><text x="80" y="96" textAnchor="middle" className="donut-small">{t('overview.thisMonthOrders')}</text>
    </svg></div><div className="donut-legend">{values.map((value, index) => <div key={labels[index]} style={{ '--i': index } as CSSProperties} className={hoveredSegment === index ? 'active' : ''} onMouseEnter={() => setHoveredSegment(index)} onMouseLeave={() => setHoveredSegment(null)}><i style={{ background: chartColors[index] }} />{labels[index]}<strong><AnimatedNumber value={value} /></strong></div>)}<small className="order-chart-hint">{hoveredSegment === null ? t('overview.compositionHoverHint') : `${labels[hoveredSegment]} · ${values[hoveredSegment].toLocaleString()}`}</small></div></div>
  </Card>
}

export function OverviewDashboard({ onExport }: { onExport: () => void }) {
  const { can } = usePermission()
  const { t, language } = useI18n()
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
  const selectedMonthLabel = selectedMonth === currentMonth
    ? t('overview.thisMonth')
    : formatMonthTitle(selectedMonth, language)
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
    <div className="page-header overview-page-header"><div><Title level={2}>{t('overview.title')}</Title><Text type="secondary">{t('overview.sub')}</Text></div><Button className="export-button" onClick={onExport}>{t('common.export')}</Button></div>
    {(baseError || monthError) && <Alert className="overview-data-error" type="error" showIcon message={baseError ? t('overview.baseError') : t('overview.monthError')} />}
    <div className="overview-fixed-metrics">
      {can(PERMISSION_KEYS.overview.metric.availableBalance) && (
        <MetricCard title={t('overview.availableBalance')} value="—" numeric={snapshot?.balances.available} valueFormat={money} accent change="6.9%" />
      )}
      {can(PERMISSION_KEYS.overview.metric.employeeCount) && (
        <MetricCard title={t('overview.employeeCount')} value="—" numeric={snapshot?.employeeCount} unit={language === 'zh' ? '人' : ''} change="4.2%" />
      )}
    </div>
    <div className="overview-month-filter"><div><Text strong>{t('overview.monthlyCaption')}</Text><Text type="secondary">{t('overview.monthlyHint')}</Text></div><div className="overview-month-control"><Text type="secondary">{t('overview.filterMonth')}</Text><DatePicker picker="month" value={pickerValue} allowClear={false} disabledDate={(date: Dayjs) => date.isAfter(dayjs(), 'month')} onChange={(date) => { if (date) setSelectedMonth(date.format('YYYY-MM')) }} /></div></div>
    <div className="overview-monthly-metrics">
      {can(PERMISSION_KEYS.overview.metric.rechargeAmount) && (
        <MetricCard title={t('overview.rechargeTotal', { month: selectedMonthLabel })} value="—" numeric={monthlyMetrics?.rechargeAmount} valueFormat={money} change={monthlyMetrics ? `${Math.abs(monthlyMetrics.rechargeChangePercent).toFixed(1)}%` : undefined} down={!!monthlyMetrics && monthlyMetrics.rechargeChangePercent < 0} />
      )}
      {can(PERMISSION_KEYS.overview.metric.rideAmount) && (
        <MetricCard title={t('overview.rideAmount', { month: selectedMonthLabel })} value="—" numeric={monthlyMetrics?.spendAmount} valueFormat={money} change={monthlyMetrics ? `${Math.abs(monthlyMetrics.spendChangePercent).toFixed(1)}%` : undefined} down={!!monthlyMetrics && monthlyMetrics.spendChangePercent < 0} />
      )}
      {can(PERMISSION_KEYS.overview.metric.orderCount) && (
        <MetricCard title={t('overview.orderCount', { month: selectedMonthLabel })} value="—" numeric={monthlyMetrics?.orderCount} unit={language === 'zh' ? '笔' : ''} change={monthlyMetrics ? `${Math.abs(monthlyMetrics.orderChangePercent).toFixed(1)}%` : undefined} down={!!monthlyMetrics && monthlyMetrics.orderChangePercent < 0} />
      )}
    </div>
    {can(PERMISSION_KEYS.overview.chart.weeklySpend) && (
      <WeeklySpendChart month={chartMonth} data={weeklySpend} loading={loading} />
    )}
    <div className="overview-charts">
      {can(PERMISSION_KEYS.overview.chart.ordersConsumption) && <OrdersConsumptionChart />}
      {can(PERMISSION_KEYS.overview.chart.orderComposition) && <OrderCompositionChart data={composition} />}
    </div>
  </>
}
