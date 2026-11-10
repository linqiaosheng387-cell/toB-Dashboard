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
  WalletOutlined, WarningFilled,
} from './icons'
import lagrideLogo from './assets/lagride-logo.png'
import { AnimatedNumber } from './animations'
import './styles.css'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { RangePicker } = DatePicker

type PageKey = 'overview' | 'employees' | 'orders' | 'recharge' | 'admin'
type Role = 'admin' | 'tenant'
type StatusMode = 'ready' | 'loading' | 'empty' | 'noResult' | 'forbidden' | 'error'

const navItems: { key: PageKey; title: string; desc: string; icon: ReactNode }[] = [
  { key: 'overview', title: '数据总览', desc: '公司余额、充值消耗与违规概览', icon: <DashboardOutlined /> },
  { key: 'employees', title: '员工详情', desc: '员工钱包与用车明细', icon: <TeamOutlined /> },
  { key: 'orders', title: '订单明细', desc: '已完单订单与 GMV 查询', icon: <BarChartOutlined /> },
  { key: 'recharge', title: '充值明细', desc: '充值笔数、金额与对账', icon: <WalletOutlined /> },
  { key: 'admin', title: '权限管理', desc: '账号与模块权限控制', icon: <SafetyCertificateOutlined /> },
]

const money = (value: number) => `₦ ${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
const badge = (value: string) => {
  const color: Record<string, string> = { 正常: 'success', 合规: 'success', 已完成: 'success', 已审批: 'success', 低余额: 'warning', 待处理: 'warning', 待审批: 'warning', 处理中: 'processing', 已拒绝: 'error', 失败: 'error', 疑似违规: 'error', 已封锁: 'error', 已停充: 'default' }
  return <Tag color={color[value] || 'default'}>{value}</Tag>
}

const employeeRows = [
  { id: 'EMP-0182', name: '陈可欣', phone: '138 0013 7621', corpAmount: 12480, rechargeThresholdAmount: 5000, personalAmount: 1250, lastMonthSpend: 4260, lastMonthIncome: 6000, currentMonthSpend: 3480, currentMonthIncome: 4200, lastMonthTrips: 6, currentMonthTrips: 5, status: '正常' },
  { id: 'EMP-0248', name: '王志远', phone: '139 9918 0034', corpAmount: 8920, rechargeThresholdAmount: 3000, personalAmount: 820, lastMonthSpend: 2180, lastMonthIncome: 3200, currentMonthSpend: 1760, currentMonthIncome: 2400, lastMonthTrips: 4, currentMonthTrips: 3, status: '正常' },
  { id: 'EMP-0316', name: '周思妍', phone: '136 6602 1188', corpAmount: 420, rechargeThresholdAmount: 500, personalAmount: 180, lastMonthSpend: 1580, lastMonthIncome: 0, currentMonthSpend: 1120, currentMonthIncome: 0, lastMonthTrips: 3, currentMonthTrips: 2, status: '低余额' },
  { id: 'EMP-0407', name: '李昊然', phone: '137 0044 2519', corpAmount: 6840, rechargeThresholdAmount: 3000, personalAmount: 510, lastMonthSpend: 980, lastMonthIncome: 1800, currentMonthSpend: 0, currentMonthIncome: 0, lastMonthTrips: 0, currentMonthTrips: 0, status: '已停充' },
  { id: 'EMP-0542', name: '赵文博', phone: '158 2201 6332', corpAmount: 15600, rechargeThresholdAmount: 8000, personalAmount: 2140, lastMonthSpend: 3420, lastMonthIncome: 4500, currentMonthSpend: 2810, currentMonthIncome: 3600, lastMonthTrips: 7, currentMonthTrips: 6, status: '正常' },
  { id: 'EMP-0619', name: '孙雨晴', phone: '188 3310 1098', corpAmount: 2180, rechargeThresholdAmount: 2000, personalAmount: 320, lastMonthSpend: 1140, lastMonthIncome: 1000, currentMonthSpend: 920, currentMonthIncome: 800, lastMonthTrips: 2, currentMonthTrips: 2, status: '低余额' },
  { id: 'EMP-0721', name: '何嘉豪', phone: '186 0088 3312', corpAmount: 9240, rechargeThresholdAmount: 5000, personalAmount: 760, lastMonthSpend: 2860, lastMonthIncome: 3800, currentMonthSpend: 2230, currentMonthIncome: 3000, lastMonthTrips: 5, currentMonthTrips: 4, status: '正常' },
  { id: 'EMP-0834', name: '林悦', phone: '135 1008 2789', corpAmount: 4680, rechargeThresholdAmount: 3000, personalAmount: 440, lastMonthSpend: 1260, lastMonthIncome: 2200, currentMonthSpend: 980, currentMonthIncome: 1600, lastMonthTrips: 3, currentMonthTrips: 3, status: '正常' },
  { id: 'EMP-0912', name: '郭明宇', phone: '152 0811 6203', corpAmount: 980, rechargeThresholdAmount: 800, personalAmount: 95, lastMonthSpend: 760, lastMonthIncome: 0, currentMonthSpend: 530, currentMonthIncome: 0, lastMonthTrips: 2, currentMonthTrips: 1, status: '低余额' },
  { id: 'EMP-1028', name: '沈宁', phone: '130 5501 7718', corpAmount: 7520, rechargeThresholdAmount: 3000, personalAmount: 640, lastMonthSpend: 1880, lastMonthIncome: 2400, currentMonthSpend: 1460, currentMonthIncome: 1900, lastMonthTrips: 4, currentMonthTrips: 3, status: '正常' },
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

const orderRows = Array.from({ length: 10 }, (_, i) => ({ key: i, id: `OD-20261030-${String(821 - i * 23).padStart(5, '0')}`, employee: `EMP-${String(182 + i * 66).padStart(4, '0')}`, driver: `DRV-${String(902 + i * 41).padStart(4, '0')}`, phone: ['138 0013 7621', '139 9918 0034', '136 6602 1188'][i % 3], amount: money([186, 245.5, 98, 312, 154, 72, 205, 118.5][i % 8]), time: `2026-10-30 ${String(13 - Math.floor(i / 3)).padStart(2, '0')}:${String(42 - i * 3).padStart(2, '0')}`, city: ['拉各斯', '阿布贾', '伊巴丹', '贝宁城'][i % 4], start: '6.5244, 3.3792', end: '6.6018, 3.3515', approval: i === 2 || i === 5 ? '待审批' : '已审批', compliance: i === 2 || i === 5 ? '疑似违规' : '合规', process: i === 2 || i === 5 ? '待处理' : '已完成' }))

const rechargeRows = Array.from({ length: 10 }, (_, i) => ({ key: i, id: `EMP-${String(182 + i * 66).padStart(4, '0')}`, name: ['陈可欣', '王志远', '周思妍', '李昊然', '赵文博'][i % 5], amount: money([2000, 1500, 800, 1200, 3000, 600][i % 6]), time: `2026-10-30 ${String(9 - Math.floor(i / 3)).padStart(2, '0')}:${String(15 - i).padStart(2, '0')}`, status: ['已完成', '处理中', '待处理', '已完成', '已拒绝', '失败'][i % 6], result: ['余额已更新', '等待支付通道', '等待审核', '余额已更新', '超出企业额度', '支付渠道超时'][i % 6] }))

function Kpi({ title, value, numeric, valueFormat, unit = '', change = '', down = false, highlight = false, showRealtime = true, showComparison = true }: { title: string; value?: string; numeric?: number; valueFormat?: (n: number) => string; unit?: string; change?: string; down?: boolean; highlight?: boolean; showRealtime?: boolean; showComparison?: boolean }) {
  return <Card className={`kpi-card ${highlight ? 'highlight' : ''}`} bordered>
    <div className="kpi-title"><Text>{title}</Text><Tooltip title="口径说明"><InfoCircleOutlined /></Tooltip></div>
    <div className="kpi-value">{numeric !== undefined ? <AnimatedNumber value={numeric} format={valueFormat} /> : value}<span>{unit}</span></div>
    {(showComparison || showRealtime) && <div className="kpi-foot">{showComparison && <><span className={down ? 'trend down' : 'trend'}>{down ? <ArrowDownOutlined /> : <ArrowUpOutlined />} {change}</span><Text type="secondary">较上周期</Text></>}{showRealtime && <Tag>实时</Tag>}</div>}
  </Card>
}

function LoadingCards({ count = 4 }: { count?: number }) { return <div className="kpi-grid">{Array.from({ length: count }, (_, i) => <Card className="kpi-card" key={i}><Skeleton active paragraph={{ rows: 1 }} title={{ width: '54%' }} /></Card>)}</div> }

function EmptyPanel({ status }: { status: StatusMode }) {
  if (status === 'forbidden') return <Card className="state-panel"><Result icon={<LockOutlined />} title="暂无访问权限" subTitle="您没有查看此模块的权限，请联系企业管理员开通。" extra={<Button type="primary">返回数据总览</Button>} /></Card>
  if (status === 'error') return <Card className="state-panel"><Result status="error" title="数据请求失败" subTitle="服务器暂时无法响应，请稍后重新加载。" extra={<Button type="primary" icon={<ReloadOutlined />}>重新加载</Button>} /></Card>
  return null
}

function FilterBar() {
  return <Card className="filter-card"><div className="filter-grid admin-filter-grid"><div className="field"><label>按公司筛选</label><Select defaultValue="全部公司" options={[{ value: '全部公司' }, { value: 'Acme Mobility Ltd.' }, { value: 'Lagos Ride Co.' }]} /></div><div className="field search-field admin-search-field"><label>账号搜索</label><Input prefix={<SearchOutlined />} placeholder="输入登录账号" /></div><Space className="filter-actions"><Button type="primary">查询</Button><Button>重置</Button></Space></div></Card>
}

type EmployeeFilters = { period: string; threshold: string; lowBalance: string; keyword: string }
const initialEmployeeFilters: EmployeeFilters = { period: '本月', threshold: '全部阈值', lowBalance: '全部', keyword: '' }

function EmployeeFilterBar({ filters, onChange, onSearch, onReset }: { filters: EmployeeFilters; onChange: (key: keyof EmployeeFilters, value: string) => void; onSearch: () => void; onReset: () => void }) {
  return <Card className="filter-card employee-filter-card"><div className="filter-grid employee-filter-grid">
    <div className="field"><label>统计周期</label><Select value={filters.period} onChange={(value) => onChange('period', value)} options={[{ value: '本月' }, { value: '上月' }]} /></div>
    <div className="field"><label>阈值区间</label><Select value={filters.threshold} onChange={(value) => onChange('threshold', value)} options={[{ value: '全部阈值' }, { value: '低于 ₦ 1,000' }]} /></div>
    <div className="field"><label>低余额员工</label><Select value={filters.lowBalance} onChange={(value) => onChange('lowBalance', value)} options={[{ value: '全部' }, { value: '仅低余额' }]} /></div>
    <div className="field search-field"><label>关键字</label><Input value={filters.keyword} onChange={(event) => onChange('keyword', event.target.value)} prefix={<SearchOutlined />} placeholder="员工 ID / 手机号" /></div>
    <Space className="filter-actions"><Button type="primary" onClick={onSearch}>查询</Button><Button onClick={onReset}>重置</Button></Space>
  </div></Card>
}

type OrderFilters = { mode: '大致' | '详细'; preset: string; dateRange: [Dayjs | null, Dayjs | null]; keyword: string }
const initialOrderFilters: OrderFilters = { mode: '大致', preset: '总体', dateRange: [null, null], keyword: '' }
const orderTimeOptions = ['今天', '昨天', '过去三天', '过去一周', '过去一个月', '总体'].map((value) => ({ value, label: value }))

function matchesSelectedTime(time: string, filters: Pick<OrderFilters, 'mode' | 'preset' | 'dateRange'>) {
  const recordDate = dayjs(time)
  if (filters.mode === '详细') {
    const [start, end] = filters.dateRange
    const rangeStart = start?.startOf('day')
    const rangeEnd = (end ?? start)?.endOf('day')
    return (!rangeStart || !recordDate.isBefore(rangeStart)) && (!rangeEnd || !recordDate.isAfter(rangeEnd))
  }
  const today = dayjs().startOf('day')
  if (filters.preset === '今天') return recordDate.isSame(today, 'day')
  if (filters.preset === '昨天') return recordDate.isSame(today.subtract(1, 'day'), 'day')
  if (filters.preset === '过去三天') return !recordDate.isBefore(today.subtract(2, 'day')) && !recordDate.isAfter(today.endOf('day'))
  if (filters.preset === '过去一周') return !recordDate.isBefore(today.subtract(6, 'day')) && !recordDate.isAfter(today.endOf('day'))
  if (filters.preset === '过去一个月') return !recordDate.isBefore(today.subtract(1, 'month')) && !recordDate.isAfter(today.endOf('day'))
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
  return <Card className="filter-card order-filter-card"><div className="filter-grid order-filter-grid">
    <div className="order-time-controls">
      <div className="field order-mode-field"><label>时间粒度</label><Segmented block options={['大致', '详细']} value={filters.mode} onChange={(value) => onModeChange(value as OrderFilters['mode'])} /></div>
      <div className="field order-period-field"><label>{filters.mode === '大致' ? '时间范围' : '日期范围'}</label>
        {filters.mode === '大致'
          ? <Select value={filters.preset} onChange={onPresetChange} options={orderTimeOptions} />
          : <RangePicker allowEmpty={[false, true]} value={filters.dateRange} onChange={(range) => onDateRangeChange(range)} />}
      </div>
    </div>
    <div className="field search-field order-search-field"><label>手机号 / 订单 / 员工 / 司机 ID</label><Input value={filters.keyword} onChange={(event) => onKeywordChange(event.target.value)} onPressEnter={onSearch} prefix={<SearchOutlined />} placeholder="手机号或相关 ID" /></div>
    <Space className="filter-actions"><Button type="primary" onClick={onSearch}>查询</Button><Button onClick={onReset}>重置</Button></Space>
  </div></Card>
}

type RechargeFilters = OrderFilters & { status: string }
const initialRechargeFilters: RechargeFilters = { ...initialOrderFilters, status: '全部状态' }
const rechargeStatusOptions = ['全部状态', '待处理', '处理中', '已完成', '已拒绝', '失败'].map((value) => ({ value, label: value }))

function RechargeFilterBar({ filters, onChange, onSearch, onReset }: {
  filters: RechargeFilters
  onChange: <K extends keyof RechargeFilters>(key: K, value: RechargeFilters[K]) => void
  onSearch: () => void
  onReset: () => void
}) {
  return <Card className="filter-card order-filter-card"><div className="filter-grid order-filter-grid recharge-filter-grid">
    <div className="order-time-controls">
      <div className="field order-mode-field"><label>时间粒度</label><Segmented block options={['大致', '详细']} value={filters.mode} onChange={(value) => onChange('mode', value as RechargeFilters['mode'])} /></div>
      <div className="field order-period-field"><label>{filters.mode === '大致' ? '时间范围' : '日期范围'}</label>
        {filters.mode === '大致'
          ? <Select value={filters.preset} onChange={(value) => onChange('preset', value)} options={orderTimeOptions} />
          : <RangePicker allowEmpty={[false, true]} value={filters.dateRange} onChange={(range) => onChange('dateRange', range ?? [null, null])} />}
      </div>
    </div>
    <div className="field recharge-status-field"><label>充值状态</label><Select value={filters.status} onChange={(value) => onChange('status', value)} options={rechargeStatusOptions} /></div>
    <div className="field search-field order-search-field"><label>员工 ID / 姓名</label><Input value={filters.keyword} onChange={(event) => onChange('keyword', event.target.value)} onPressEnter={onSearch} prefix={<SearchOutlined />} placeholder="输入员工 ID 或姓名" /></div>
    <Space className="filter-actions"><Button type="primary" onClick={onSearch}>查询</Button><Button onClick={onReset}>重置</Button></Space>
  </div></Card>
}

function PageHeader({ title, sub, actions }: { title: string; sub: string; actions?: ReactNode }) { return <div className="page-header"><div><Title level={2}>{title}</Title><Text type="secondary">{sub}</Text></div><Space wrap>{actions}</Space></div> }

function EmployeePage({ status, setStatus, onExport }: { status: StatusMode; setStatus: (s: StatusMode) => void; onExport: () => void }) {
  const [filters, setFilters] = useState<EmployeeFilters>(initialEmployeeFilters)
  const [appliedFilters, setAppliedFilters] = useState<EmployeeFilters>(initialEmployeeFilters)
  const periodKey = appliedFilters.period === '本月' ? 'currentMonth' : 'lastMonth'
  const spendField = appliedFilters.period === '本月' ? 'currentMonthSpend' : 'lastMonthSpend'
  const incomeField = appliedFilters.period === '本月' ? 'currentMonthIncome' : 'lastMonthIncome'
  const rows = employeeRows.filter((row) => {
    const keyword = appliedFilters.keyword.trim().toLowerCase()
    const matchesKeyword = !keyword || `${row.id} ${row.name} ${row.phone}`.toLowerCase().includes(keyword)
    const matchesThreshold = appliedFilters.threshold !== '低于 ₦ 1,000' || row.rechargeThresholdAmount < 1000
    const matchesLowBalance = appliedFilters.lowBalance !== '仅低余额' || row.corpAmount < 1000
    return matchesKeyword && matchesThreshold && matchesLowBalance
  })
  const columns: ColumnsType<any> = [
    { title: '员工 ID', dataIndex: 'id', width: 110 },
    { title: '姓名', dataIndex: 'name' },
    { title: '手机号', dataIndex: 'phone' },
    { title: '企业钱包余额', dataIndex: 'corp' },
    { title: '员工充值阈值', dataIndex: 'rechargeThreshold' },
    { title: `${appliedFilters.period}支出`, dataIndex: appliedFilters.period === '本月' ? 'currentSpend' : 'spend' },
    { title: `${appliedFilters.period}被充值金额`, dataIndex: appliedFilters.period === '本月' ? 'currentIncome' : 'income' },
    { title: '操作', render: () => <Space><Button type="text" icon={<EditOutlined />} /><Button type="text" icon={<MoreOutlined />} /></Space> },
  ]
  const totalEmployeeWallet = employeeRows.reduce((total, row) => total + row.corpAmount, 0)
  const taxiEmployees = rows.filter((row) => (periodKey === 'currentMonth' ? row.currentMonthTrips : row.lastMonthTrips) > 0).length
  const employeeSpend = rows.reduce((total, row) => total + row[spendField], 0)
  const employeeRecharge = rows.reduce((total, row) => total + row[incomeField], 0)
  const updateFilters = (key: keyof EmployeeFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const applyFilters = () => { setAppliedFilters(filters); setStatus('ready') }
  const resetFilters = () => { setFilters(initialEmployeeFilters); setAppliedFilters(initialEmployeeFilters); setStatus('ready') }

  return <>
    <PageHeader title="员工详情" sub="Acme Mobility Ltd. · 员工钱包与用车明细" actions={<Button className="export-button" onClick={onExport}>导出Excel</Button>} />
    {status === 'forbidden' || status === 'error' ? <EmptyPanel status={status} /> : <>
      <div className="kpi-grid two employee-total-metrics">
        <Kpi title="员工总数" numeric={248} unit="人" change="4.2%" showRealtime={false} />
        <Kpi title="员工企业钱包总额" numeric={totalEmployeeWallet} valueFormat={money} change="6.2%" showRealtime={false} />
      </div>
      <EmployeeFilterBar filters={filters} onChange={updateFilters} onSearch={applyFilters} onReset={resetFilters} />
      {status === 'loading' ? <LoadingCards count={3} /> : <>
        <div className="kpi-grid four employee-filtered-metrics">
          {status === 'empty' ? <>
            <Kpi title="打车员工数" value="—" change="暂无数据" showRealtime={false} />
            <Kpi title="员工支出金额" value="—" change="暂无数据" showRealtime={false} />
            <Kpi title="员工被充值金额" value="—" change="暂无数据" showRealtime={false} />
          </> : <>
            <Kpi title="打车员工数" numeric={taxiEmployees} unit="人" change="6.5%" showRealtime={false} />
            <Kpi title="员工支出金额" numeric={employeeSpend} valueFormat={money} change="3.1%" down showRealtime={false} />
            <Kpi title="员工被充值金额" numeric={employeeRecharge} valueFormat={money} change="4.8%" showRealtime={false} />
          </>}
        </div>
        <Section title="员工数据明细" meta="默认每页 10 条 · 数据更新时间 14:32">
          <Table className="data-table" scroll={{ x: 1120 }} columns={columns} dataSource={status === 'noResult' ? [] : rows} pagination={{ pageSize: 10, size: 'small', showTotal: (total) => `共 ${total} 条` }} locale={{ emptyText: status === 'noResult' || rows.length === 0 ? <Empty description="未找到匹配结果" /> : undefined }} />
        </Section>
      </>}
    </>}
  </>
}

function OrderPage({ status, setStatus, onExport }: { status: StatusMode; setStatus: (s: StatusMode) => void; onExport: () => void }) {
  const [filters, setFilters] = useState<OrderFilters>(initialOrderFilters)
  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(initialOrderFilters)
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
    return matchesSearch && matchesSelectedTime(row.time, appliedFilters)
  })
  const cols: ColumnsType<any> = [{ title: '订单号', dataIndex: 'id', width: 150 }, { title: '员工 ID', dataIndex: 'employee' }, { title: '司机 ID', dataIndex: 'driver' }, { title: '乘客电话', dataIndex: 'phone' }, { title: '订单金额', dataIndex: 'amount' }, { title: '订单创建时间', dataIndex: 'time', width: 145 }, { title: '所在城市', dataIndex: 'city' }, { title: '起点经纬度', dataIndex: 'start' }, { title: '终点经纬度', dataIndex: 'end' }, { title: '审批状态', dataIndex: 'approval', render: badge }, { title: '合规状态', dataIndex: 'compliance', render: badge }, { title: '处理状态', dataIndex: 'process', render: badge }]
  const updateFilters = <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))
  const applyFilters = () => { setAppliedFilters(filters); setStatus('ready') }
  const resetFilters = () => { setFilters(initialOrderFilters); setAppliedFilters(initialOrderFilters); setStatus('ready') }
  const handleRangeChange = (range: [Dayjs | null, Dayjs | null] | null) => updateFilters('dateRange', range ?? [null, null])
  return <>
    <PageHeader title="订单明细" sub="已完单订单与 GMV 查询 · 日期范围最多选择过去两个月" actions={<Button className="export-button" onClick={onExport}>导出Excel</Button>} />
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
        <div className="kpi-grid two"><Kpi title="订单数" numeric={18642} unit="笔" change="11.7%" showComparison={false} showRealtime={false} /><Kpi title="订单金额" numeric={74820.5} valueFormat={money} change="3.1%" down showComparison={false} showRealtime={false} /></div>
        <Section title="主订单表格" meta={`筛选结果 ${rows.length} 笔`}>
          <Table className="data-table" scroll={{ x: 1520 }} columns={cols} dataSource={status === 'noResult' ? [] : rows} pagination={{ pageSize: 10, size: 'small' }} locale={{ emptyText: <Empty description="未找到匹配结果" /> }} />
        </Section>
      </>}
    </>}
  </>
}

function RechargePage({ status, setStatus, onExport }: { status: StatusMode; setStatus: (s: StatusMode) => void; onExport: () => void }) {
  const [filters, setFilters] = useState<RechargeFilters>(initialRechargeFilters)
  const [appliedFilters, setAppliedFilters] = useState<RechargeFilters>(initialRechargeFilters)
  const keyword = appliedFilters.keyword.trim().toLowerCase()
  const rows = rechargeRows.filter((row) => {
    const matchesKeyword = !keyword || row.id.toLowerCase().includes(keyword) || row.name.toLowerCase().includes(keyword)
    const matchesStatus = appliedFilters.status === '全部状态' || row.status === appliedFilters.status
    return matchesKeyword && matchesStatus && matchesSelectedTime(row.time, appliedFilters)
  })
  const cols: ColumnsType<any> = [{ title: '被充值员工 ID', dataIndex: 'id' }, { title: '员工姓名', dataIndex: 'name' }, { title: '充值金额', dataIndex: 'amount' }, { title: '充值时间', dataIndex: 'time' }, { title: '充值状态', dataIndex: 'status', render: badge }, { title: '处理结果', dataIndex: 'result' }]
  const updateFilters = <K extends keyof RechargeFilters>(key: K, value: RechargeFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))
  const applyFilters = () => { setAppliedFilters(filters); setStatus('ready') }
  const resetFilters = () => { setFilters(initialRechargeFilters); setAppliedFilters(initialRechargeFilters); setStatus('ready') }
  return <><PageHeader title="充值明细" sub="按时间范围、员工与充值状态查询" actions={<Button className="export-button" onClick={onExport}>导出Excel</Button>} />{status === 'forbidden' || status === 'error' ? <EmptyPanel status={status} /> : <>
    <RechargeFilterBar filters={filters} onChange={updateFilters} onSearch={applyFilters} onReset={resetFilters} />
    {status === 'loading' ? <LoadingCards count={3} /> : <><div className="kpi-grid four recharge-metrics"><Kpi title="充值总金额" numeric={13600} valueFormat={money} showComparison={false} showRealtime={false} /><Kpi title="充值队列数" numeric={42} unit="笔" showComparison={false} showRealtime={false} /><Kpi title="被充值员工数" numeric={38} unit="人" showComparison={false} showRealtime={false} /></div><Section title="充值记录" meta={`筛选结果 ${rows.length} 笔`}><Table className="data-table" columns={cols} dataSource={status === 'noResult' ? [] : rows} pagination={{ pageSize: 10, size: 'small' }} locale={{ emptyText: <Empty description="未找到匹配结果" /> }} /></Section></>}
  </>}</>
}

function AdminPage({ role, onNewAccount, onEditAccount }: { role: Role; onNewAccount: () => void; onEditAccount: () => void }) {
  if (role !== 'admin') return <><PageHeader title="权限管理" sub="账号与模块权限控制" /><Card className="state-panel"><Result icon={<LockOutlined />} title="暂无访问权限" subTitle="权限管理仅对唯一 Admin 管理员开放。" extra={<Button type="primary">返回数据总览</Button>} /></Card></>
  const rows = [{ key: 1, account: 'admin@acme.com', company: 'Acme Mobility Ltd.', permissions: '数据总览 · 员工详情 · 订单明细 · 充值明细', status: '正常', created: '2026-04-12 10:20', login: '2026-10-30 14:26' }, { key: 2, account: 'finance@acme.com', company: 'Acme Mobility Ltd.', permissions: '数据总览 · 充值明细', status: '正常', created: '2026-06-08 16:43', login: '2026-10-30 13:58' }, { key: 3, account: 'ops@lagosride.com', company: 'Lagos Ride Co.', permissions: '数据总览 · 员工详情 · 订单明细', status: '已封锁', created: '2026-08-19 09:12', login: '2026-10-21 18:02' }, { key: 4, account: 'audit@bluecabs.com', company: 'BlueCabs Nigeria', permissions: '数据总览 · 订单明细', status: '正常', created: '2026-09-02 11:06', login: '2026-10-30 12:47' }]
  return <><PageHeader title="权限管理" sub="仅 Admin 可见 · 管理企业账号与模块权限" actions={<Button type="primary" icon={<PlusOutlined />} onClick={onNewAccount}>新增账号</Button>} /><div className="admin-banner"><Avatar icon={<SafetyCertificateOutlined />} /><div><Text strong>Admin 全局权限</Text><Text type="secondary">可查看全部公司数据、创建账号、分配模块权限、封锁或解封账号。</Text></div></div><FilterBar /><Section title="账号列表" meta="共 4 个账号 · 四个业务模块默认可配置"><Table columns={[{ title: '登录账号', dataIndex: 'account' }, { title: '所属公司', dataIndex: 'company' }, { title: '模块权限摘要', dataIndex: 'permissions' }, { title: '账号状态', dataIndex: 'status', render: badge }, { title: '创建时间', dataIndex: 'created' }, { title: '最近登录时间', dataIndex: 'login' }, { title: '操作', render: (_, row) => <Dropdown menu={{ items: [{ key: 'manage', label: '管理账号', onClick: onEditAccount }, { key: 'permission', label: '调整权限', onClick: onEditAccount }, { key: 'lock', label: row.status === '正常' ? '封锁账号' : '解封账号' }, { key: 'reset', label: '重置密码' }] }}><Button type="text" icon={<MoreOutlined />} /></Dropdown> }]} dataSource={rows} pagination={false} /></Section></>
}

function Section({ title, meta, children }: { title: ReactNode; meta?: string; children: ReactNode }) { return <section className="section"><div className="section-head"><Title level={5}>{title}</Title>{meta && <Text type="secondary">{meta}</Text>}</div><Card className="table-card" bodyStyle={{ padding: 0 }}>{children}</Card></section> }

function Login({ onLogin }: { onLogin: () => void }) { const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const submit = () => { setLoading(true); setError(''); setTimeout(() => { setLoading(false); onLogin() }, 700) }; return <div className="login-page"><div className="login-visual"><div className="login-grid" /><div className="login-glow" /><div className="login-copy"><div className="brand-line"><span className="brand-mark">行</span><span>企业用车数据中心</span></div><h1>让每一笔出行，<br /><em>都清晰可见。</em></h1><p>面向企业客户的用车数据看板，统一查看余额、充值、员工用车与订单消费，让月底对账更轻松。</p></div><svg className="login-chart" viewBox="0 0 430 165"><path className="area" d="M0 128 C53 112 54 105 96 110 S156 70 204 87 S256 43 299 66 S363 24 430 38 V165 H0Z" /><path d="M0 128 C53 112 54 105 96 110 S156 70 204 87 S256 43 299 66 S363 24 430 38" /></svg><div className="login-metrics"><div><strong>18.6k</strong><span>本月订单</span></div><div><strong>₦ 2.4m</strong><span>企业总消费</span></div><div><strong>98.6%</strong><span>订单合规率</span></div></div></div><div className="login-panel"><Card className="login-card"><Title level={2}>欢迎回来</Title><Text type="secondary">登录企业用车数据中心，查看您的用车经营数据。</Text>{error && <div className="login-error"><ExclamationCircleFilled />{error}</div>}<Form layout="vertical" onFinish={submit} style={{ marginTop: 24 }}><Form.Item label="登录账号" name="account" initialValue="admin@acme.com"><Input placeholder="请输入登录账号" /></Form.Item><Form.Item label="密码" name="password" initialValue="password"><Input.Password placeholder="请输入密码" /></Form.Item><Button type="primary" htmlType="submit" block loading={loading}>登录</Button></Form><div className="login-footer">如账号被封锁，请联系系统管理员处理</div></Card></div></div> }

function NavMenu({ page, role, onSelect }: { page: PageKey; role: Role; onSelect: (key: PageKey) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ top: 0, height: 0, ready: false })
  const shownNav = navItems.filter((item) => item.key !== 'admin' || role === 'admin')

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
        label: <div className="nav-label"><strong>{item.title}</strong><small>{item.desc}</small><span className="nav-arrow">↗</span></div>,
      }))}
    />
  </div>
}

function AppShell({ page, setPage, role, setRole, status, setStatus, onExport, onNewAccount, onEditAccount, onLogout }: { page: PageKey; setPage: (p: PageKey) => void; role: Role; setRole: (r: Role) => void; status: StatusMode; setStatus: (s: StatusMode) => void; onExport: () => void; onNewAccount: () => void; onEditAccount: () => void; onLogout: () => void }) {
  const content = page === 'overview' ? <OverviewDashboard onExport={onExport} /> : page === 'employees' ? <EmployeePage status={status} setStatus={setStatus} onExport={onExport} /> : page === 'orders' ? <OrderPage status={status} setStatus={setStatus} onExport={onExport} /> : page === 'recharge' ? <RechargePage status={status} setStatus={setStatus} onExport={onExport} /> : <AdminPage role={role} onNewAccount={onNewAccount} onEditAccount={onEditAccount} />
  return <Layout className="dashboard-layout"><Sider width={280} className="side-nav"><div className="brand"><img src={lagrideLogo} alt="Lagride" className="brand-logo" /></div><div className="nav-caption">工作台 WORKSPACE</div><NavMenu page={page} role={role} onSelect={(key) => { setPage(key); setStatus('ready') }} /><div className="side-account"><Avatar style={{ background: '#dce9fb', color: '#2563eb' }}>林</Avatar><div><strong>{role === 'admin' ? '林乔生 · Admin' : 'finance@acme.com'}</strong><small>{role === 'admin' ? '正常 · 管理员' : '正常 · 企业账号'}</small></div><Dropdown menu={{ items: [{ key: 'role', label: role === 'admin' ? '切换到企业账号' : '切换到 Admin', onClick: () => setRole(role === 'admin' ? 'tenant' : 'admin') }, { key: 'lock', label: '预览账号被封锁', onClick: () => message.warning('演示：账号已封锁，请联系 Admin 解封') }, { type: 'divider' }, { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: onLogout }] }}><Button type="text" icon={<MoreOutlined />} /></Dropdown></div></Sider><Layout><Header className="topbar"><Button type="text" className="company-name">{role === 'admin' ? 'Lagride' : '华为'}</Button><div className="topbar-spacer" /><Space><Badge status="success" text={<span className="updated">数据更新于 2026-10-30 14:32</span>} /><Tag>实时</Tag><Dropdown menu={{ items: [{ key: 'tenant', label: '切换到企业账号', onClick: () => setRole('tenant') }, { key: 'logout', label: '退出登录', onClick: onLogout }] }}><Button className="user-button"><Avatar size={22} style={{ background: '#5682ab' }}>林</Avatar>林乔生<DownOutlined /></Button></Dropdown></Space></Header><Content className="page-content" key={page}>{content}</Content></Layout></Layout>
}

function AccountEditor({ mode, onClose }: { mode: 'new' | 'edit'; onClose: () => void }) {
  const [form] = Form.useForm()
  const saveAccount = () => {
    onClose()
    message.success(mode === 'new' ? '账号已创建' : '账号信息已保存')
  }
  const fields = <Form form={form} layout="vertical" initialValues={{ company: 'Acme Mobility Ltd.', permissions: ['overview', 'employees', 'orders', 'recharge'] }}>
    <Form.Item label="登录账号" name="account"><Input placeholder="例如：finance@acme.com" /></Form.Item>
    <Form.Item label={mode === 'new' ? '初始密码' : '重置密码'} name="password"><Input.Password placeholder="请输入密码" /></Form.Item>
    <Form.Item label="所属公司" name="company"><Select options={[{ value: 'Acme Mobility Ltd.' }, { value: 'Lagos Ride Co.' }, { value: 'BlueCabs Nigeria' }]} /></Form.Item>
    <div className="drawer-section">
      <Text strong>模块权限</Text>
      <Form.Item name="permissions" style={{ marginTop: 12 }}><Checkbox.Group options={[{ label: '数据总览', value: 'overview' }, { label: '员工详情', value: 'employees' }, { label: '订单明细', value: 'orders' }, { label: '充值明细', value: 'recharge' }]} /></Form.Item>
    </div>
    <div className="reserved">指标级权限 <Tag>后续版本预留</Tag><p>用于未来的公司级指标差异化配置，当前版本保持禁用。</p></div>
    {mode === 'edit' && <div className="drawer-section"><Text strong>账号状态</Text><div style={{ marginTop: 12 }}><Checkbox defaultChecked>账号正常，可访问已授权模块</Checkbox></div></div>}
  </Form>

  if (mode === 'new') return <Modal
    title={<div><div>创建账号</div><Text type="secondary" style={{ fontSize: 12 }}>创建新的企业账号并分配模块权限</Text></div>}
    open
    centered
    closable
    maskClosable={false}
    width={520}
    onCancel={onClose}
    onOk={saveAccount}
    okText="创建账号"
    cancelText="取消"
    styles={{ body: { paddingTop: 16, maxHeight: '70vh', overflowY: 'auto' } }}
  >{fields}</Modal>

  return <Drawer
    title={<div><div>管理账号</div><Text type="secondary" style={{ fontSize: 12 }}>编辑账号信息、模块权限与账号状态</Text></div>}
    open
    width={490}
    onClose={onClose}
    footer={<Space><Button onClick={onClose}>取消</Button><Button type="primary" onClick={saveAccount}>保存账号</Button></Space>}
  >{fields}</Drawer>
}

function App() {
  const [loggedIn, setLoggedIn] = useState(true)
  const [page, setPage] = useState<PageKey>('overview')
  const [role, setRole] = useState<Role>('admin')
  const [status, setStatus] = useState<StatusMode>('ready')
  const [accountMode, setAccountMode] = useState<'new' | 'edit' | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />
  return <AntApp>
    <AppShell
      page={page} setPage={setPage}
      role={role} setRole={setRole}
      status={status} setStatus={setStatus}
      onExport={() => setExportOpen(true)}
      onNewAccount={() => setAccountMode('new')}
      onEditAccount={() => setAccountMode('edit')}
      onLogout={() => setLoggedIn(false)}
    />
    {accountMode && <AccountEditor mode={accountMode} onClose={() => setAccountMode(null)} />}
    <Modal title="导出当前数据" open={exportOpen} onCancel={() => setExportOpen(false)} onOk={() => { setExportOpen(false); message.success('导出任务已提交，文件准备完成后会自动下载') }} okText="开始导出" cancelText="取消">
      <Text type="secondary">将当前筛选条件下的数据导出为 Excel 文件。文件名可以自定义。</Text>
      <Form layout="vertical" style={{ marginTop: 16 }}><Form.Item label="文件名"><Input defaultValue="企业用车数据_2026-10-30" /></Form.Item></Form>
      <Text type="secondary" style={{ fontSize: 12 }}>大数据量导出将进入处理队列，完成后自动下载。</Text>
    </Modal>
  </AntApp>
}

export default App
