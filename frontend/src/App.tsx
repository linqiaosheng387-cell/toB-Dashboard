import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { OverviewDashboard } from './features/overview/OverviewDashboard'
import type { ReactNode } from 'react'
import {
  App as AntApp, Avatar, Badge, Button, Card, Checkbox, DatePicker, Drawer, Dropdown,
  Empty, Form, Input, Layout, Menu, Modal, Progress, Result, Segmented, Select, Skeleton, Space,
  Statistic, Table, Tag, Tooltip, Typography, message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ArrowDownOutlined, ArrowUpOutlined, BarChartOutlined, CalendarOutlined,
  CheckCircleFilled, CloseOutlined, CloudDownloadOutlined, DashboardOutlined,
  DownOutlined, EditOutlined, ExclamationCircleFilled, ExportOutlined,
  FilterOutlined, InfoCircleOutlined, LineChartOutlined, LockOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, MoreOutlined, PlusOutlined, ReloadOutlined,
  SafetyCertificateOutlined, SearchOutlined, SettingOutlined, TeamOutlined, UserOutlined,
  WalletOutlined, WarningFilled, GlobalOutlined,
} from './icons'
import lagrideLogo from './assets/lagride-logo.png'
import { AnimatedNumber } from './animations'
import { useReorderableColumns } from './features/columns/useReorderableColumns'
import { useColumnVisibility } from './features/columns/useColumnVisibility'
import { filterColumnsByPermission } from './features/columns/filterColumnsByPermission'
import { OrderTableToolbar } from './features/order/OrderTableToolbar'
import type { StatusFilterValues } from './features/order/OrderTableToolbar'
import { AccountEditorModal } from './features/admin/AccountEditorModal'
import { ChangePasswordModal } from './features/admin/ChangePasswordModal'
import { PermissionProvider, usePermission } from './features/admin/PermissionContext'
import { PERMISSION_KEYS, PERMISSION_MODULES, resourceLabelKey } from './features/admin/permissionCatalog'
import {
  ApiError,
  managementApi,
  type AccountDetail,
} from './services/managementApi'
import { LOCAL_AUTH_ENABLED, verifyLocalCredential } from './services/localAuth'
import { LanguageProvider, useI18n } from './i18n/LanguageContext'
import './features/admin/admin.css'
import './styles.css'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { RangePicker } = DatePicker

type PageKey = 'overview' | 'employees' | 'orders' | 'recharge' | 'admin'
type Role = 'admin' | 'tenant'
type Session = { account: string; password: string }
type StatusMode = 'ready' | 'loading' | 'empty' | 'noResult' | 'forbidden' | 'error'

const navItems: { key: PageKey; titleKey: string; descKey: string; icon: ReactNode }[] = [
  { key: 'overview', titleKey: 'nav.overview.title', descKey: 'nav.overview.desc', icon: <DashboardOutlined /> },
  { key: 'employees', titleKey: 'nav.employees.title', descKey: 'nav.employees.desc', icon: <TeamOutlined /> },
  { key: 'orders', titleKey: 'nav.orders.title', descKey: 'nav.orders.desc', icon: <BarChartOutlined /> },
  { key: 'recharge', titleKey: 'nav.recharge.title', descKey: 'nav.recharge.desc', icon: <WalletOutlined /> },
  { key: 'admin', titleKey: 'nav.admin.title', descKey: 'nav.admin.desc', icon: <SafetyCertificateOutlined /> },
]

const MODULE_PERMISSION_BY_PAGE: Record<string, string> = {
  overview: PERMISSION_KEYS.overview.module,
  employees: PERMISSION_KEYS.employees.module,
  orders: PERMISSION_KEYS.orders.module,
  recharge: PERMISSION_KEYS.recharge.module,
}

const money = (value: number) => `₦ ${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

/** Status code -> Ant Design Tag color; display text is translated via StatusTag. */
const STATUS_COLOR: Record<string, string> = {
  normal: 'success', compliant: 'success', completed: 'success', approved: 'success', active: 'success',
  low_balance: 'warning', pending: 'warning', processing: 'processing',
  rejected: 'error', failed: 'error', violation: 'error', blocked: 'error',
  stopped: 'default',
}

function StatusTag({ code }: { code: string }) {
  const { t } = useI18n()
  return <Tag color={STATUS_COLOR[code] || 'default'}>{t(`status.${code}`)}</Tag>
}
const renderStatusTag = (code: string) => <StatusTag code={code} />

const employeeRows = [
  { id: 'EMP-0182', name: '陈可欣', phone: '138 0013 7621', corpAmount: 12480, rechargeThresholdAmount: 5000, personalAmount: 1250, lastMonthSpend: 4260, lastMonthIncome: 6000, currentMonthSpend: 3480, currentMonthIncome: 4200, lastMonthTrips: 6, currentMonthTrips: 5, status: 'normal' },
  { id: 'EMP-0248', name: '王志远', phone: '139 9918 0034', corpAmount: 8920, rechargeThresholdAmount: 3000, personalAmount: 820, lastMonthSpend: 2180, lastMonthIncome: 3200, currentMonthSpend: 1760, currentMonthIncome: 2400, lastMonthTrips: 4, currentMonthTrips: 3, status: 'normal' },
  { id: 'EMP-0316', name: '周思妍', phone: '136 6602 1188', corpAmount: 420, rechargeThresholdAmount: 500, personalAmount: 180, lastMonthSpend: 1580, lastMonthIncome: 0, currentMonthSpend: 1120, currentMonthIncome: 0, lastMonthTrips: 3, currentMonthTrips: 2, status: 'low_balance' },
  { id: 'EMP-0407', name: '李昊然', phone: '137 0044 2519', corpAmount: 6840, rechargeThresholdAmount: 3000, personalAmount: 510, lastMonthSpend: 980, lastMonthIncome: 1800, currentMonthSpend: 0, currentMonthIncome: 0, lastMonthTrips: 0, currentMonthTrips: 0, status: 'stopped' },
  { id: 'EMP-0542', name: '赵文博', phone: '158 2201 6332', corpAmount: 15600, rechargeThresholdAmount: 8000, personalAmount: 2140, lastMonthSpend: 3420, lastMonthIncome: 4500, currentMonthSpend: 2810, currentMonthIncome: 3600, lastMonthTrips: 7, currentMonthTrips: 6, status: 'normal' },
  { id: 'EMP-0619', name: '孙雨晴', phone: '188 3310 1098', corpAmount: 2180, rechargeThresholdAmount: 2000, personalAmount: 320, lastMonthSpend: 1140, lastMonthIncome: 1000, currentMonthSpend: 920, currentMonthIncome: 800, lastMonthTrips: 2, currentMonthTrips: 2, status: 'low_balance' },
  { id: 'EMP-0721', name: '何嘉豪', phone: '186 0088 3312', corpAmount: 9240, rechargeThresholdAmount: 5000, personalAmount: 760, lastMonthSpend: 2860, lastMonthIncome: 3800, currentMonthSpend: 2230, currentMonthIncome: 3000, lastMonthTrips: 5, currentMonthTrips: 4, status: 'normal' },
  { id: 'EMP-0834', name: '林悦', phone: '135 1008 2789', corpAmount: 4680, rechargeThresholdAmount: 3000, personalAmount: 440, lastMonthSpend: 1260, lastMonthIncome: 2200, currentMonthSpend: 980, currentMonthIncome: 1600, lastMonthTrips: 3, currentMonthTrips: 3, status: 'normal' },
  { id: 'EMP-0912', name: '郭明宇', phone: '152 0811 6203', corpAmount: 980, rechargeThresholdAmount: 800, personalAmount: 95, lastMonthSpend: 760, lastMonthIncome: 0, currentMonthSpend: 530, currentMonthIncome: 0, lastMonthTrips: 2, currentMonthTrips: 1, status: 'low_balance' },
  { id: 'EMP-1028', name: '沈宁', phone: '130 5501 7718', corpAmount: 7520, rechargeThresholdAmount: 3000, personalAmount: 640, lastMonthSpend: 1880, lastMonthIncome: 2400, currentMonthSpend: 1460, currentMonthIncome: 1900, lastMonthTrips: 4, currentMonthTrips: 3, status: 'normal' },
].map((row, key) => ({
  ...row,
  key,
  corp: money(row.corpAmount),
  rechargeThreshold: money(row.rechargeThresholdAmount),
  personal: money(row.personalAmount),
  spend: money(row.lastMonthSpend),
  income: money(row.lastMonthIncome),
  currentSpend: money(row.currentMonthSpend),
  currentIncome: money(row.currentMonthIncome),
}))

const orderRows = Array.from({ length: 10 }, (_, i) => ({ key: i, id: `OD-20261030-${String(821 - i * 23).padStart(5, '0')}`, employee: `EMP-${String(182 + i * 66).padStart(4, '0')}`, driver: `DRV-${String(902 + i * 41).padStart(4, '0')}`, phone: ['138 0013 7621', '139 9918 0034', '136 6602 1188'][i % 3], amount: money([186, 245.5, 98, 312, 154, 72, 205, 118.5][i % 8]), time: `2026-10-30 ${String(13 - Math.floor(i / 3)).padStart(2, '0')}:${String(42 - i * 3).padStart(2, '0')}`, startCity: ['lagos', 'abuja', 'ibadan', 'benin_city'][i % 4], endCity: ['lagos', 'abuja', 'ibadan', 'benin_city'][(i + 1) % 4], approval: i === 2 || i === 5 ? 'pending' : 'approved', compliance: i === 2 || i === 5 ? 'violation' : 'compliant', process: i === 2 || i === 5 ? 'pending' : 'completed' }))

const rechargeRows = Array.from({ length: 10 }, (_, i) => ({ key: i, id: `EMP-${String(182 + i * 66).padStart(4, '0')}`, name: ['陈可欣', '王志远', '周思妍', '李昊然', '赵文博'][i % 5], amount: money([2000, 1500, 800, 1200, 3000, 600][i % 6]), time: `2026-10-30 ${String(9 - Math.floor(i / 3)).padStart(2, '0')}:${String(15 - i).padStart(2, '0')}`, status: ['completed', 'processing', 'pending', 'completed', 'rejected', 'failed'][i % 6], result: ['balance_updated', 'awaiting_gateway', 'awaiting_review', 'balance_updated', 'quota_exceeded', 'gateway_timeout'][i % 6] }))

function Kpi({ title, value, numeric, valueFormat, unit = '', change = '', down = false, highlight = false, showRealtime = true, showComparison = true }: { title: string; value?: string; numeric?: number; valueFormat?: (n: number) => string; unit?: string; change?: string; down?: boolean; highlight?: boolean; showRealtime?: boolean; showComparison?: boolean }) {
  const { t } = useI18n()
  return <Card className={`kpi-card ${highlight ? 'highlight' : ''}`} bordered>
    <div className="kpi-title"><Text>{title}</Text><Tooltip title={t('common.definition')}><InfoCircleOutlined /></Tooltip></div>
    <div className="kpi-value">{numeric !== undefined ? <AnimatedNumber value={numeric} format={valueFormat} /> : value}<span>{unit}</span></div>
    {(showComparison || showRealtime) && <div className="kpi-foot">{showComparison && <><span className={down ? 'trend down' : 'trend'}>{down ? <ArrowDownOutlined /> : <ArrowUpOutlined />} {change}</span><Text type="secondary">{t('common.comparison')}</Text></>}{showRealtime && <Tag>{t('common.realtime')}</Tag>}</div>}
  </Card>
}

function LoadingCards({ count = 4 }: { count?: number }) { return <div className="kpi-grid">{Array.from({ length: count }, (_, i) => <Card className="kpi-card" key={i}><Skeleton active paragraph={{ rows: 1 }} title={{ width: '54%' }} /></Card>)}</div> }

function EmptyPanel({ status }: { status: StatusMode }) {
  const { t } = useI18n()
  if (status === 'forbidden') return <Card className="state-panel"><Result icon={<LockOutlined />} title={t('admin.forbiddenTitle')} subTitle={t('admin.forbiddenSub')} extra={<Button type="primary">{t('common.backOverview')}</Button>} /></Card>
  if (status === 'error') return <Card className="state-panel"><Result status="error" title={t('admin.errorTitle')} subTitle={t('admin.errorSub')} extra={<Button type="primary" icon={<ReloadOutlined />}>{t('common.reload')}</Button>} /></Card>
  return null
}

function NoAccessPanel() {
  const { t } = useI18n()
  return <Card className="state-panel"><Result icon={<LockOutlined />} title={t('admin.forbiddenTitle')} subTitle={t('admin.shellNoAccessSub')} /></Card>
}

function FilterBar() {
  const { t } = useI18n()
  return <Card className="filter-card"><div className="filter-grid admin-filter-grid"><div className="field"><label>{t('admin.colCompany')}</label><Select defaultValue="all" options={[{ value: 'all', label: t('common.all') }, { value: 'Acme Mobility Ltd.' }, { value: 'Lagos Ride Co.' }]} /></div><div className="field search-field admin-search-field"><label>{t('admin.colAccount')}</label><Input prefix={<SearchOutlined />} placeholder={t('admin.loginAccount')} /></div><Space className="filter-actions"><Button type="primary">{t('common.query')}</Button><Button>{t('common.reset')}</Button></Space></div></Card>
}

type EmployeeFilters = { period: string; threshold: string; lowBalance: string; keyword: string }
const initialEmployeeFilters: EmployeeFilters = { period: 'this_month', threshold: 'all', lowBalance: 'all', keyword: '' }

function EmployeeFilterBar({ filters, onChange, onSearch, onReset }: { filters: EmployeeFilters; onChange: (key: keyof EmployeeFilters, value: string) => void; onSearch: () => void; onReset: () => void }) {
  const { t } = useI18n()
  return <Card className="filter-card employee-filter-card"><div className="filter-grid employee-filter-grid">
    <div className="field"><label>{t('employees.period')}</label><Select value={filters.period} onChange={(value) => onChange('period', value)} options={[{ value: 'this_month', label: t('time.this_month') }, { value: 'prev_month', label: t('time.prev_month') }]} /></div>
    <div className="field"><label>{t('employees.threshold')}</label><Select value={filters.threshold} onChange={(value) => onChange('threshold', value)} options={[{ value: 'all', label: t('employees.allThreshold') }, { value: 'below_1000', label: t('employees.belowThreshold') }]} /></div>
    <div className="field"><label>{t('employees.lowBalance')}</label><Select value={filters.lowBalance} onChange={(value) => onChange('lowBalance', value)} options={[{ value: 'all', label: t('common.all') }, { value: 'low_only', label: t('employees.onlyLowBalance') }]} /></div>
    <div className="field search-field"><label>{t('employees.keyword')}</label><Input value={filters.keyword} onChange={(event) => onChange('keyword', event.target.value)} prefix={<SearchOutlined />} placeholder={t('employees.keywordPlaceholder')} /></div>
    <Space className="filter-actions"><Button type="primary" onClick={onSearch}>{t('common.query')}</Button><Button onClick={onReset}>{t('common.reset')}</Button></Space>
  </div></Card>
}

type OrderFilters = { mode: 'quick' | 'detailed'; preset: string; dateRange: [Dayjs | null, Dayjs | null]; keyword: string }
const initialOrderFilters: OrderFilters = { mode: 'quick', preset: 'all', dateRange: [null, null], keyword: '' }
/** Stable time-range codes; visible labels are translated inside the filter components. */
const ORDER_TIME_KEYS = ['today', 'yesterday', 'last_3_days', 'last_week', 'last_month', 'all']

function matchesSelectedTime(time: string, filters: Pick<OrderFilters, 'mode' | 'preset' | 'dateRange'>) {
  const recordDate = dayjs(time)
  if (filters.mode === 'detailed') {
    const [start, end] = filters.dateRange
    const rangeStart = start?.startOf('day')
    const rangeEnd = (end ?? start)?.endOf('day')
    return (!rangeStart || !recordDate.isBefore(rangeStart)) && (!rangeEnd || !recordDate.isAfter(rangeEnd))
  }
  const today = dayjs().startOf('day')
  if (filters.preset === 'today') return recordDate.isSame(today, 'day')
  if (filters.preset === 'yesterday') return recordDate.isSame(today.subtract(1, 'day'), 'day')
  if (filters.preset === 'last_3_days') return !recordDate.isBefore(today.subtract(2, 'day')) && !recordDate.isAfter(today.endOf('day'))
  if (filters.preset === 'last_week') return !recordDate.isBefore(today.subtract(6, 'day')) && !recordDate.isAfter(today.endOf('day'))
  if (filters.preset === 'last_month') return !recordDate.isBefore(today.subtract(1, 'month')) && !recordDate.isAfter(today.endOf('day'))
  return true
}

function OrderFilterBar({ filters, onModeChange, onPresetChange, onDateRangeChange, onKeywordChange, onSearch, onReset }: {
  filters: OrderFilters
  onModeChange: (mode: OrderFilters['mode']) => void
  onPresetChange: (preset: string) => void
  onDateRangeChange: (range: [Dayjs | null, Dayjs | null] | null) => void
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onReset: () => void
}) {
  const { t } = useI18n()
  const timeOptions = ORDER_TIME_KEYS.map((code) => ({ value: code, label: t(`time.${code}`) }))
  return <Card className="filter-card order-filter-card"><div className="filter-grid order-filter-grid">
    <div className="order-time-controls">
      <div className="field order-mode-field"><label>{t('orders.timeGranularity')}</label><Segmented block options={[{ value: 'quick', label: t('time.quick') }, { value: 'detailed', label: t('time.detailed') }]} value={filters.mode} onChange={(value) => onModeChange(value as OrderFilters['mode'])} /></div>
      <div className="field order-period-field"><label>{filters.mode === 'quick' ? t('time.timeRange') : t('time.dateRange')}</label>
        {filters.mode === 'quick'
          ? <Select value={filters.preset} onChange={onPresetChange} options={timeOptions} />
          : <RangePicker allowEmpty={[false, true]} value={filters.dateRange} onChange={(range) => onDateRangeChange(range)} />}
      </div>
    </div>
    <div className="field search-field order-search-field"><label>{t('orders.searchLabel')}</label><Input value={filters.keyword} onChange={(event) => onKeywordChange(event.target.value)} onPressEnter={onSearch} prefix={<SearchOutlined />} placeholder={t('orders.searchPlaceholder')} /></div>
    <Space className="filter-actions"><Button type="primary" onClick={onSearch}>{t('common.query')}</Button><Button onClick={onReset}>{t('common.reset')}</Button></Space>
  </div></Card>
}

type RechargeFilters = OrderFilters & { status: string }
const initialRechargeFilters: RechargeFilters = { ...initialOrderFilters, status: 'all' }
const RECHARGE_STATUS_KEYS = ['pending', 'processing', 'completed', 'rejected', 'failed']

function RechargeFilterBar({ filters, onChange, onSearch, onReset }: {
  filters: RechargeFilters
  onChange: <K extends keyof RechargeFilters>(key: K, value: RechargeFilters[K]) => void
  onSearch: () => void
  onReset: () => void
}) {
  const { t } = useI18n()
  const timeOptions = ORDER_TIME_KEYS.map((code) => ({ value: code, label: t(`time.${code}`) }))
  const statusOptions = [
    { value: 'all', label: t('recharge.allStatus') },
    ...RECHARGE_STATUS_KEYS.map((code) => ({ value: code, label: t(`status.${code}`) })),
  ]
  return <Card className="filter-card order-filter-card"><div className="filter-grid order-filter-grid recharge-filter-grid">
    <div className="order-time-controls">
      <div className="field order-mode-field"><label>{t('orders.timeGranularity')}</label><Segmented block options={[{ value: 'quick', label: t('time.quick') }, { value: 'detailed', label: t('time.detailed') }]} value={filters.mode} onChange={(value) => onChange('mode', value as RechargeFilters['mode'])} /></div>
      <div className="field order-period-field"><label>{filters.mode === 'quick' ? t('time.timeRange') : t('time.dateRange')}</label>
        {filters.mode === 'quick'
          ? <Select value={filters.preset} onChange={(value) => onChange('preset', value)} options={timeOptions} />
          : <RangePicker allowEmpty={[false, true]} value={filters.dateRange} onChange={(range) => onChange('dateRange', range ?? [null, null])} />}
      </div>
    </div>
    <div className="field recharge-status-field"><label>{t('recharge.status')}</label><Select value={filters.status} onChange={(value) => onChange('status', value)} options={statusOptions} /></div>
    <div className="field search-field order-search-field"><label>{t('recharge.searchLabel')}</label><Input value={filters.keyword} onChange={(event) => onChange('keyword', event.target.value)} onPressEnter={onSearch} prefix={<SearchOutlined />} placeholder={t('recharge.searchPlaceholder')} /></div>
    <Space className="filter-actions"><Button type="primary" onClick={onSearch}>{t('common.query')}</Button><Button onClick={onReset}>{t('common.reset')}</Button></Space>
  </div></Card>
}

function PageHeader({ title, sub, actions }: { title: string; sub: string; actions?: ReactNode }) { return <div className="page-header"><div><Title level={2}>{title}</Title><Text type="secondary">{sub}</Text></div><Space wrap>{actions}</Space></div> }

function EmployeePage({ status, setStatus, onExport, accountKey }: { status: StatusMode; setStatus: (s: StatusMode) => void; onExport: () => void; accountKey: string }) {
  const { can } = usePermission()
  const { t, language } = useI18n()
  const personUnit = language === 'zh' ? '人' : ''
  const [filters, setFilters] = useState<EmployeeFilters>(initialEmployeeFilters)
  const [appliedFilters, setAppliedFilters] = useState<EmployeeFilters>(initialEmployeeFilters)
  const isCurrentMonth = appliedFilters.period === 'this_month'
  const periodKey = isCurrentMonth ? 'currentMonth' : 'lastMonth'
  const spendField = isCurrentMonth ? 'currentMonthSpend' : 'lastMonthSpend'
  const incomeField = isCurrentMonth ? 'currentMonthIncome' : 'lastMonthIncome'
  const periodLabel = t(isCurrentMonth ? 'time.this_month' : 'time.prev_month')
  const rows = employeeRows.filter((row) => {
    const keyword = appliedFilters.keyword.trim().toLowerCase()
    const matchesKeyword = !keyword || `${row.id} ${row.name} ${row.phone}`.toLowerCase().includes(keyword)
    const matchesThreshold = appliedFilters.threshold !== 'below_1000' || row.rechargeThresholdAmount < 1000
    const matchesLowBalance = appliedFilters.lowBalance !== 'low_only' || row.corpAmount < 1000
    return matchesKeyword && matchesThreshold && matchesLowBalance
  })
  const baseColumns: ColumnsType<any> = [
    { key: 'id', title: t('employees.colId'), dataIndex: 'id', width: 110 },
    { key: 'name', title: t('employees.colName'), dataIndex: 'name' },
    { key: 'phone', title: t('employees.colPhone'), dataIndex: 'phone' },
    { key: 'corp', title: t('employees.colCorp'), dataIndex: 'corp' },
    { key: 'rechargeThreshold', title: t('employees.colThreshold'), dataIndex: 'rechargeThreshold' },
    { key: 'spend', title: t('employees.colSpend', { period: periodLabel }), dataIndex: isCurrentMonth ? 'currentSpend' : 'spend' },
    { key: 'income', title: t('employees.colIncome', { period: periodLabel }), dataIndex: isCurrentMonth ? 'currentIncome' : 'income' },
    { key: 'actions', title: t('employees.colActions'), render: () => <Space><Button type="text" icon={<EditOutlined />} /><Button type="text" icon={<MoreOutlined />} /></Space> },
  ]
  const employeePermKeyById: Record<string, string> = {
    id: PERMISSION_KEYS.employees.field.id,
    name: PERMISSION_KEYS.employees.field.name,
    phone: PERMISSION_KEYS.employees.field.phone,
    corp: PERMISSION_KEYS.employees.field.corp,
    rechargeThreshold: PERMISSION_KEYS.employees.field.rechargeThreshold,
    spend: PERMISSION_KEYS.employees.field.spend,
    income: PERMISSION_KEYS.employees.field.income,
    actions: PERMISSION_KEYS.employees.field.actions,
  }
  const permittedColumns = filterColumnsByPermission(baseColumns, can, employeePermKeyById)
  const columns = useReorderableColumns(`column-order:${accountKey}:employees`, permittedColumns)
  const totalEmployeeWallet = employeeRows.reduce((total, row) => total + row.corpAmount, 0)
  const taxiEmployees = rows.filter((row) => (periodKey === 'currentMonth' ? row.currentMonthTrips : row.lastMonthTrips) > 0).length
  const employeeSpend = rows.reduce((total, row) => total + row[spendField], 0)
  const employeeRecharge = rows.reduce((total, row) => total + row[incomeField], 0)
  const updateFilters = (key: keyof EmployeeFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const applyFilters = () => { setAppliedFilters(filters); setStatus('ready') }
  const resetFilters = () => { setFilters(initialEmployeeFilters); setAppliedFilters(initialEmployeeFilters); setStatus('ready') }

  return <>
    <PageHeader title={t('employees.title')} sub={t('employees.sub')} actions={<Button className="export-button" onClick={onExport}>{t('common.export')}</Button>} />
    {status === 'forbidden' || status === 'error' ? <EmptyPanel status={status} /> : <>
      <div className="kpi-grid two employee-total-metrics">
        {can(PERMISSION_KEYS.employees.metric.total) && (
          <Kpi title={t('employees.total')} numeric={248} unit={personUnit} change="4.2%" showRealtime={false} />
        )}
        {can(PERMISSION_KEYS.employees.metric.walletTotal) && (
          <Kpi title={t('employees.walletTotal')} numeric={totalEmployeeWallet} valueFormat={money} change="6.2%" showRealtime={false} />
        )}
      </div>
      <EmployeeFilterBar filters={filters} onChange={updateFilters} onSearch={applyFilters} onReset={resetFilters} />
      {status === 'loading' ? <LoadingCards count={3} /> : <>
        <div className="kpi-grid four employee-filtered-metrics">
          {status === 'empty' ? <>
            {can(PERMISSION_KEYS.employees.metric.taxiCount) && <Kpi title={t('employees.taxiCount')} value="—" change={t('common.noData')} showRealtime={false} />}
            {can(PERMISSION_KEYS.employees.metric.rideAmount) && <Kpi title={t('employees.rideAmount')} value="—" change={t('common.noData')} showRealtime={false} />}
            {can(PERMISSION_KEYS.employees.metric.rechargeAmount) && <Kpi title={t('employees.rechargeAmount')} value="—" change={t('common.noData')} showRealtime={false} />}
          </> : <>
            {can(PERMISSION_KEYS.employees.metric.taxiCount) && <Kpi title={t('employees.taxiCount')} numeric={taxiEmployees} unit={personUnit} change="6.5%" showRealtime={false} />}
            {can(PERMISSION_KEYS.employees.metric.rideAmount) && <Kpi title={t('employees.rideAmount')} numeric={employeeSpend} valueFormat={money} change="3.1%" down showRealtime={false} />}
            {can(PERMISSION_KEYS.employees.metric.rechargeAmount) && <Kpi title={t('employees.rechargeAmount')} numeric={employeeRecharge} valueFormat={money} change="4.8%" showRealtime={false} />}
          </>}
        </div>
        <Section title={t('employees.detailTitle')} meta={t('employees.detailMeta')}>
          <Table className="data-table" scroll={{ x: 1120 }} columns={columns} dataSource={status === 'noResult' ? [] : rows} pagination={{ pageSize: 10, size: 'small', showTotal: (total) => t('common.totalItems', { total }) }} locale={{ emptyText: status === 'noResult' || rows.length === 0 ? <Empty description={t('common.noMatch')} /> : undefined }} />
        </Section>
      </>}
    </>}
  </>
}

function OrderPage({ status, setStatus, onExport, accountKey }: { status: StatusMode; setStatus: (s: StatusMode) => void; onExport: () => void; accountKey: string }) {
  const { can } = usePermission()
  const { t, language } = useI18n()
  const orderUnit = language === 'zh' ? '笔' : ''
  const [filters, setFilters] = useState<OrderFilters>(initialOrderFilters)
  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(initialOrderFilters)
  const [statusFilters, setStatusFilters] = useState<StatusFilterValues>({ approval: '', compliance: '', process: '' })
  const keyword = appliedFilters.keyword.trim().toLowerCase()
  const phoneTerm = keyword.replace(/\D/g, '')
  const phoneMatches = phoneTerm.length >= 3 ? orderRows.filter((row) => row.phone.replace(/\D/g, '').includes(phoneTerm)) : []
  const phoneMatchKeys = new Set(phoneMatches.map((row) => row.key))
  const rows = orderRows.filter((row) => {
    const matchesSearch = !keyword || (phoneMatches.length > 0
      ? phoneMatchKeys.has(row.key)
      : row.id.toLowerCase().includes(keyword)
        || row.employee.toLowerCase().includes(keyword)
        || row.driver.toLowerCase().includes(keyword)
        || (phoneTerm.length > 0 && row.phone.replace(/\D/g, '').includes(phoneTerm)))
    const matchesStatus = (statusFilters.approval === '' || row.approval === statusFilters.approval)
      && (statusFilters.compliance === '' || row.compliance === statusFilters.compliance)
      && (statusFilters.process === '' || row.process === statusFilters.process)
    return matchesSearch && matchesStatus && matchesSelectedTime(row.time, appliedFilters)
  })
  const renderCity = (code: string) => t(`city.${code}`)
  const baseCols: ColumnsType<any> = [
    { key: 'id', title: t('orders.colId'), dataIndex: 'id', width: 150 },
    { key: 'employee', title: t('orders.colEmployee'), dataIndex: 'employee' },
    { key: 'driver', title: t('orders.colDriver'), dataIndex: 'driver' },
    { key: 'phone', title: t('orders.colPhone'), dataIndex: 'phone' },
    { key: 'amount', title: t('orders.colAmount'), dataIndex: 'amount' },
    { key: 'time', title: t('orders.colTime'), dataIndex: 'time', width: 145 },
    { key: 'startCity', title: t('orders.colStartCity'), dataIndex: 'startCity', render: renderCity },
    { key: 'endCity', title: t('orders.colEndCity'), dataIndex: 'endCity', render: renderCity },
    { key: 'approval', title: t('orders.colApproval'), dataIndex: 'approval', render: renderStatusTag },
    { key: 'compliance', title: t('orders.colCompliance'), dataIndex: 'compliance', render: renderStatusTag },
    { key: 'process', title: t('orders.colProcess'), dataIndex: 'process', render: renderStatusTag },
  ]
  const orderPermKeyById: Record<string, string> = {
    id: PERMISSION_KEYS.orders.field.id,
    employee: PERMISSION_KEYS.orders.field.employee,
    driver: PERMISSION_KEYS.orders.field.driver,
    phone: PERMISSION_KEYS.orders.field.phone,
    amount: PERMISSION_KEYS.orders.field.amount,
    time: PERMISSION_KEYS.orders.field.time,
    startCity: PERMISSION_KEYS.orders.field.startCity,
    endCity: PERMISSION_KEYS.orders.field.endCity,
    approval: PERMISSION_KEYS.orders.field.approval,
    compliance: PERMISSION_KEYS.orders.field.compliance,
    process: PERMISSION_KEYS.orders.field.process,
  }
  const permittedCols = filterColumnsByPermission(baseCols, can, orderPermKeyById)
  const orderedCols = useReorderableColumns(`column-order:${accountKey}:orders`, permittedCols)
  const { hiddenIds, toggle: toggleColumn, reset: resetColumns, visibleColumns: cols } = useColumnVisibility(orderedCols)
  const statusOptions = {
    approval: [...new Set(orderRows.map((row) => row.approval))],
    compliance: [...new Set(orderRows.map((row) => row.compliance))],
    process: [...new Set(orderRows.map((row) => row.process))],
  }
  const updateFilters = <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))
  const applyFilters = () => { setAppliedFilters(filters); setStatus('ready') }
  const resetFilters = () => { setFilters(initialOrderFilters); setAppliedFilters(initialOrderFilters); setStatus('ready') }
  const handleRangeChange = (range: [Dayjs | null, Dayjs | null] | null) => updateFilters('dateRange', range ?? [null, null])
  return <>
    <PageHeader title={t('orders.title')} sub={t('orders.sub')} actions={<Button className="export-button" onClick={onExport}>{t('common.export')}</Button>} />
    {status === 'forbidden' || status === 'error' ? <EmptyPanel status={status} /> : <>
      <OrderFilterBar
        filters={filters}
        onModeChange={(mode) => updateFilters('mode', mode)}
        onPresetChange={(preset) => updateFilters('preset', preset)}
        onDateRangeChange={handleRangeChange}
        onKeywordChange={(value) => updateFilters('keyword', value)}
        onSearch={applyFilters}
        onReset={resetFilters}
      />
      {status === 'loading' ? <LoadingCards count={2} /> : <>
        <div className="kpi-grid two">
          {can(PERMISSION_KEYS.orders.metric.orderCount) && <Kpi title={t('orders.orderCount')} numeric={18642} unit={orderUnit} change="11.7%" showComparison={false} showRealtime={false} />}
          {can(PERMISSION_KEYS.orders.metric.rideAmount) && <Kpi title={t('orders.rideAmount')} numeric={74820.5} valueFormat={money} change="3.1%" down showComparison={false} showRealtime={false} />}
        </div>
        <OrderTableToolbar
          columns={orderedCols}
          hiddenIds={hiddenIds}
          onToggleColumn={toggleColumn}
          onResetColumns={resetColumns}
          statusOptions={statusOptions}
          appliedFilters={statusFilters}
          onApplyFilters={setStatusFilters}
        />
        <Section title={t('orders.mainTable')} meta={t('orders.filteredCount', { count: rows.length })}>
          <Table className="data-table" scroll={{ x: 1520 }} columns={cols} dataSource={status === 'noResult' ? [] : rows} pagination={{ pageSize: 10, size: 'small' }} locale={{ emptyText: <Empty description={t('common.noMatch')} /> }} />
        </Section>
      </>}
    </>}
  </>
}

function RechargePage({ status, setStatus, onExport, accountKey }: { status: StatusMode; setStatus: (s: StatusMode) => void; onExport: () => void; accountKey: string }) {
  const { can } = usePermission()
  const { t, language } = useI18n()
  const orderUnit = language === 'zh' ? '笔' : ''
  const personUnit = language === 'zh' ? '人' : ''
  const [filters, setFilters] = useState<RechargeFilters>(initialRechargeFilters)
  const [appliedFilters, setAppliedFilters] = useState<RechargeFilters>(initialRechargeFilters)
  const keyword = appliedFilters.keyword.trim().toLowerCase()
  const rows = rechargeRows.filter((row) => {
    const matchesKeyword = !keyword || row.id.toLowerCase().includes(keyword) || row.name.toLowerCase().includes(keyword)
    const matchesStatus = appliedFilters.status === 'all' || row.status === appliedFilters.status
    return matchesKeyword && matchesStatus && matchesSelectedTime(row.time, appliedFilters)
  })
  const baseCols: ColumnsType<any> = [
    { key: 'id', title: t('recharge.colId'), dataIndex: 'id' },
    { key: 'name', title: t('recharge.colName'), dataIndex: 'name' },
    { key: 'amount', title: t('recharge.colAmount'), dataIndex: 'amount' },
    { key: 'time', title: t('recharge.colTime'), dataIndex: 'time' },
    { key: 'status', title: t('recharge.colStatus'), dataIndex: 'status', render: renderStatusTag },
    { key: 'result', title: t('recharge.colResult'), dataIndex: 'result', render: (code: string) => t(`status.${code}`) },
  ]
  const rechargePermKeyById: Record<string, string> = {
    id: PERMISSION_KEYS.recharge.field.id,
    name: PERMISSION_KEYS.recharge.field.name,
    amount: PERMISSION_KEYS.recharge.field.amount,
    time: PERMISSION_KEYS.recharge.field.time,
    status: PERMISSION_KEYS.recharge.field.status,
    result: PERMISSION_KEYS.recharge.field.result,
  }
  const permittedCols = filterColumnsByPermission(baseCols, can, rechargePermKeyById)
  const cols = useReorderableColumns(`column-order:${accountKey}:recharge`, permittedCols)
  const updateFilters = <K extends keyof RechargeFilters>(key: K, value: RechargeFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))
  const applyFilters = () => { setAppliedFilters(filters); setStatus('ready') }
  const resetFilters = () => { setFilters(initialRechargeFilters); setAppliedFilters(initialRechargeFilters); setStatus('ready') }
  return <><PageHeader title={t('recharge.title')} sub={t('recharge.sub')} actions={<Button className="export-button" onClick={onExport}>{t('common.export')}</Button>} />{status === 'forbidden' || status === 'error' ? <EmptyPanel status={status} /> : <>
    <RechargeFilterBar filters={filters} onChange={updateFilters} onSearch={applyFilters} onReset={resetFilters} />
    {status === 'loading' ? <LoadingCards count={3} /> : <><div className="kpi-grid four recharge-metrics">
  {can(PERMISSION_KEYS.recharge.metric.totalAmount) && <Kpi title={t('recharge.totalAmount')} numeric={13600} valueFormat={money} showComparison={false} showRealtime={false} />}
  {can(PERMISSION_KEYS.recharge.metric.queueCount) && <Kpi title={t('recharge.queueCount')} numeric={42} unit={orderUnit} showComparison={false} showRealtime={false} />}
  {can(PERMISSION_KEYS.recharge.metric.employeeCount) && <Kpi title={t('recharge.employeeCount')} numeric={38} unit={personUnit} showComparison={false} showRealtime={false} />}
</div><Section title={t('recharge.recordTitle')} meta={t('recharge.filteredCount', { count: rows.length })}><Table className="data-table" columns={cols} dataSource={status === 'noResult' ? [] : rows} pagination={{ pageSize: 10, size: 'small' }} locale={{ emptyText: <Empty description={t('common.noMatch')} /> }} /></Section></>}
  </>}</>
}

function AdminPage({ account, role, refreshTick, onNewAccount, onEditAccount, onPasswordChanged }: { account: string; role: Role; refreshTick: number; onNewAccount: () => void; onEditAccount: (accountId: number) => void; onPasswordChanged: (newPassword: string) => void }) {
  const { t } = useI18n()
  const [accounts, setAccounts] = useState<AccountDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    try {
      setAccounts(await managementApi.listAccounts())
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.loadAccountsFailed'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role === 'admin') loadAccounts()
  }, [role, refreshTick, loadAccounts])

  if (role !== 'admin') return <><PageHeader title={t('admin.title')} sub={t('nav.admin.desc')} /><Card className="state-panel"><Result icon={<LockOutlined />} title={t('admin.noAccessTitle')} subTitle={t('admin.noAccessSub')} extra={<Button type="primary">{t('common.backOverview')}</Button>} /></Card></>

  const toggleStatus = async (record: AccountDetail) => {
    const next = record.status === 'active' ? 'blocked' : 'active'
    try {
      await managementApi.updateAccount(record.id, { status: next })
      message.success(next === 'blocked' ? t('admin.accountBlocked') : t('admin.accountUnblocked'))
      loadAccounts()
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.operationFailed'))
    }
  }

  const removeAccount = async (record: AccountDetail) => {
    try {
      await managementApi.deleteAccount(record.id)
      message.success(t('admin.accountDeleted'))
      loadAccounts()
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.deleteFailed'))
    }
  }

  const resetAccountPassword = (record: AccountDetail) => {
    Modal.confirm({
      title: t('admin.resetConfirmTitle', { account: record.account }),
      content: t('admin.resetConfirmContent'),
      okText: t('admin.confirmReset'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await managementApi.resetPassword(record.id)
          message.success(t('admin.resetSuccess'))
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : t('admin.resetFailed'))
        }
      },
    })
  }

  const permissionSummary = (keys: string[]) => {
    const names = PERMISSION_MODULES.filter((module) =>
      keys.includes(`${module.key}.module`)
    ).map((module) => t(resourceLabelKey(`${module.key}.module`)))
    return names.length ? names.join(' · ') : '—'
  }

  const formatTime = (value: string | null) =>
    value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—'

  const columns = [
    { title: t('admin.colAccount'), dataIndex: 'account' },
    { title: t('admin.colCompany'), dataIndex: 'company' },
    {
      title: t('admin.colSummary'),
      dataIndex: 'resource_keys',
      render: permissionSummary,
    },
    {
      title: t('admin.colStatus'),
      dataIndex: 'status',
      render: (value: string) =>
        value === 'active'
          ? <Badge status="success" text={t('status.active')} />
          : <Badge status="error" text={t('status.blocked')} />,
    },
    {
      title: t('admin.colCreated'),
      dataIndex: 'created_at',
      render: formatTime,
    },
    {
      title: t('admin.colLastLogin'),
      dataIndex: 'last_login_at',
      render: formatTime,
    },
    {
      title: t('common.actions'),
      render: (_: unknown, record: AccountDetail) => (
        <Dropdown menu={{ items: [
          { key: 'manage', label: t('admin.manageAccount'), onClick: () => onEditAccount(record.id) },
          { key: 'lock', label: record.status === 'active' ? t('admin.lockAccount') : t('admin.unlockAccount'), onClick: () => toggleStatus(record) },
          { key: 'reset', label: t('admin.resetPassword'), onClick: () => resetAccountPassword(record) },
          { type: 'divider' },
          { key: 'delete', label: t('admin.deleteAccount'), danger: true, onClick: () => removeAccount(record) },
        ] }}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return <>
    <PageHeader title={t('admin.title')} sub={t('admin.sub')} actions={<Space>
      <Button icon={<LockOutlined />} onClick={() => setChangePasswordOpen(true)}>{t('admin.changePassword')}</Button>
      <Button type="primary" icon={<PlusOutlined />} onClick={onNewAccount}>{t('admin.newAccount')}</Button>
    </Space>} />
    <div className="admin-banner"><Avatar icon={<SafetyCertificateOutlined />} /><div><Text strong>{t('admin.bannerTitle')}</Text><Text type="secondary">{t('admin.bannerHint')}</Text></div></div>
    <Section title={t('admin.accountList')} meta={t('admin.accountListMeta', { count: accounts.length })}>
      <Table rowKey="id" columns={columns} dataSource={accounts} loading={loading} pagination={false} />
    </Section>
    <ChangePasswordModal
      open={changePasswordOpen}
      account={account}
      onClose={() => setChangePasswordOpen(false)}
      onChanged={onPasswordChanged}
    />
  </>
}

function Section({ title, meta, children }: { title: ReactNode; meta?: string; children: ReactNode }) { return <section className="section"><div className="section-head"><Title level={5}>{title}</Title>{meta && <Text type="secondary">{meta}</Text>}</div><Card className="table-card" bodyStyle={{ padding: 0 }}>{children}</Card></section> }

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)

  const submit = async (values: { account: string; password: string }) => {
    setLoading(true)
    try {
      // 短暂延迟，保留登录按钮的 loading 反馈感
      await new Promise((resolve) => setTimeout(resolve, 400))
      if (LOCAL_AUTH_ENABLED) {
        // 临时本地校验：仅认写死的 admin / 12345678
        if (verifyLocalCredential(values.account, values.password)) {
          onLogin({ account: values.account, password: values.password })
        } else {
          message.error(t('login.credentialError'))
        }
      } else {
        // 数据库就绪后恢复的真实后端登录
        await managementApi.login(values.account, values.password)
        onLogin({ account: values.account, password: values.password })
      }
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('login.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return <div className="login-page"><div className="login-visual"><div className="login-grid" /><div className="login-glow" /><div className="login-copy"><div className="brand-line"><span className="brand-mark">行</span><span>{t('login.brand')}</span></div><h1>{t('login.hero1')}<br /><em>{t('login.hero2')}</em></h1><p>{t('login.desc')}</p></div><svg className="login-chart" viewBox="0 0 430 165"><path className="area" d="M0 128 C53 112 54 105 96 110 S156 70 204 87 S256 43 299 66 S363 24 430 38 V165 H0Z" /><path d="M0 128 C53 112 54 105 96 110 S156 70 204 87 S256 43 299 66 S363 24 430 38" /></svg><div className="login-metrics"><div><strong>18.6k</strong><span>{t('login.metric1')}</span></div><div><strong>₦ 2.4m</strong><span>{t('login.metric2')}</span></div><div><strong>98.6%</strong><span>{t('login.metric3')}</span></div></div></div><div className="login-panel"><Card className="login-card"><Title level={2}>{t('login.welcome')}</Title><Text type="secondary">{t('login.sub')}</Text><Form layout="vertical" onFinish={submit} style={{ marginTop: 24 }}><Form.Item label={t('login.account')} name="account" initialValue="admin" rules={[{ required: true, message: t('login.enterAccount') }]}><Input placeholder={t('login.enterAccount')} /></Form.Item><Form.Item label={t('login.password')} name="password" initialValue="12345678" rules={[{ required: true, message: t('login.enterPassword') }]}><Input.Password placeholder={t('login.enterPassword')} /></Form.Item><Button type="primary" htmlType="submit" block loading={loading}>{t('login.button')}</Button></Form><div className="login-footer">{t('login.footer')}</div></Card></div></div>
}

function NavMenu({ page, role, onSelect }: { page: PageKey; role: Role; onSelect: (key: PageKey) => void }) {
  const { can } = usePermission()
  const { t } = useI18n()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ top: 0, height: 0, ready: false })
  const shownNav = navItems.filter((item) => {
    if (item.key === 'admin') return role === 'admin'
    const moduleKey = MODULE_PERMISSION_BY_PAGE[item.key]
    return moduleKey === undefined || can(moduleKey)
  })

  const measure = useCallback(() => {
    const wrap = wrapRef.current
    const selected = wrap?.querySelector('.ant-menu-item-selected') as HTMLElement | null
    if (!wrap || !selected) return
    const wrapRect = wrap.getBoundingClientRect()
    const itemRect = selected.getBoundingClientRect()
    setIndicator({ top: itemRect.top - wrapRect.top, height: itemRect.height, ready: true })
  }, [])

  useLayoutEffect(() => { measure() }, [measure, page, role])
  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  return <div className="nav-menu-wrap" ref={wrapRef}>
    <div
      className={`nav-indicator${indicator.ready ? ' ready' : ''}`}
      style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height }}
    />
    <Menu
      mode="inline"
      selectedKeys={[page]}
      onClick={({ key }) => onSelect(key as PageKey)}
      items={shownNav.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: <div className="nav-label"><strong>{t(item.titleKey)}</strong><small>{t(item.descKey)}</small><span className="nav-arrow">↗</span></div>,
      }))}
    />
  </div>
}

function AppShell({ account, page, setPage, role, status, setStatus, refreshTick, onExport, onNewAccount, onEditAccount, onPasswordChanged, onLogout }: { account: string; page: PageKey; setPage: (p: PageKey) => void; role: Role; status: StatusMode; setStatus: (s: StatusMode) => void; refreshTick: number; onExport: () => void; onNewAccount: () => void; onEditAccount: (accountId: number) => void; onPasswordChanged: (newPassword: string) => void; onLogout: () => void }) {
  const { can, loaded } = usePermission()
  const { t, toggleLanguage } = useI18n()
  const avatarChar = account.charAt(0).toUpperCase()
  const moduleKey = MODULE_PERMISSION_BY_PAGE[page]
  const pageAllowed = page === 'admin' ? role === 'admin' : moduleKey === undefined || can(moduleKey)

  useEffect(() => {
    if (loaded && !pageAllowed) {
      setPage('overview')
      setStatus('ready')
    }
  }, [loaded, pageAllowed, setPage, setStatus])

  const pageContent = page === 'overview' ? <OverviewDashboard onExport={onExport} /> : page === 'employees' ? <EmployeePage status={status} setStatus={setStatus} onExport={onExport} accountKey={account} /> : page === 'orders' ? <OrderPage status={status} setStatus={setStatus} onExport={onExport} accountKey={account} /> : page === 'recharge' ? <RechargePage status={status} setStatus={setStatus} onExport={onExport} accountKey={account} /> : <AdminPage account={account} role={role} refreshTick={refreshTick} onNewAccount={onNewAccount} onEditAccount={onEditAccount} onPasswordChanged={onPasswordChanged} />
  const content = pageAllowed ? pageContent : <NoAccessPanel />
  return <Layout className="dashboard-layout"><Sider width={280} className="side-nav"><div className="brand"><img src={lagrideLogo} alt="Lagride" className="brand-logo" /></div><div className="nav-caption">{t('nav.workspace')}</div><NavMenu page={page} role={role} onSelect={(key) => { setPage(key); setStatus('ready') }} /><div className="side-account"><Avatar style={{ background: '#dce9fb', color: '#2563eb' }}>{avatarChar}</Avatar><div><strong>{account}</strong><small>{role === 'admin' ? t('nav.roleAdmin') : t('nav.roleTenant')}</small></div><Tooltip title="退出登录"><Button type="text" icon={<LogoutOutlined />} onClick={onLogout} /></Tooltip></div></Sider><Layout><Header className="topbar"><Button type="text" className="company-name">{role === 'admin' ? 'Lagride' : '华为'}</Button><div className="topbar-spacer" /><Space><Badge status="success" text={<span className="updated">{t('common.updatedAt', { time: '2026-10-30 14:32' })}</span>} /><Tag>{t('common.realtime')}</Tag><Tooltip title={t('common.switchLang')}><Button className="lang-button" onClick={toggleLanguage}><GlobalOutlined /><span>{t('common.langCode')}</span></Button></Tooltip><Dropdown menu={{ items: [{ key: 'logout', label: t('common.logout'), icon: <LogoutOutlined />, onClick: onLogout }] }}><Button className="user-button"><Avatar size={22} style={{ background: '#5682ab' }}>{avatarChar}</Avatar>{account}<DownOutlined /></Button></Dropdown></Space></Header><Content className="page-content" key={page}>{content}</Content></Layout></Layout>
}

function App() {
  return <LanguageProvider><AppRoot /></LanguageProvider>
}

function AppRoot() {
  const { t } = useI18n()
  const [session, setSession] = useState<Session | null>(null)
  const [page, setPage] = useState<PageKey>('overview')
  const [status, setStatus] = useState<StatusMode>('ready')
  const [editor, setEditor] = useState<{ mode: 'new' | 'edit'; accountId?: number } | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)

  if (!session) return <Login onLogin={setSession} />

  const role: Role = session.account === 'admin' ? 'admin' : 'tenant'
  return <AntApp>
    <PermissionProvider account={session.account} password={session.password}>
    <AppShell
      account={session.account}
      page={page} setPage={setPage}
      role={role}
      status={status} setStatus={setStatus}
      refreshTick={refreshTick}
      onExport={() => setExportOpen(true)}
      onNewAccount={() => setEditor({ mode: 'new' })}
      onEditAccount={(accountId: number) => setEditor({ mode: 'edit', accountId })}
      onPasswordChanged={(newPassword: string) => setSession({ ...session, password: newPassword })}
      onLogout={() => setSession(null)}
    />
    {editor && (
      <AccountEditorModal
        mode={editor.mode}
        accountId={editor.accountId}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null)
          setRefreshTick((value) => value + 1)
        }}
      />
    )}
    <Modal title={t('exportModal.title')} open={exportOpen} onCancel={() => setExportOpen(false)} onOk={() => { setExportOpen(false); message.success(t('exportModal.success')) }} okText={t('exportModal.start')} cancelText={t('common.cancel')}>
      <Text type="secondary">{t('exportModal.content')}</Text>
      <Form layout="vertical" style={{ marginTop: 16 }}><Form.Item label={t('exportModal.fileName')}><Input defaultValue="企业用车数据_2026-10-30" /></Form.Item></Form>
      <Text type="secondary" style={{ fontSize: 12 }}>{t('exportModal.queueHint')}</Text>
    </Modal>
    </PermissionProvider>
  </AntApp>
}

export default App
