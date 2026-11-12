import { useState } from 'react'
import { Badge, Button, Checkbox, Popover, Select, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getColumnId } from '../columns/useReorderableColumns'
import { useI18n } from '../../i18n/LanguageContext'
import { FilterOutlined, SettingOutlined } from '../../icons'
import './orderToolbar.css'

export type StatusFilterValues = {
  approval: string
  compliance: string
  process: string
}

const emptyStatusFilters: StatusFilterValues = { approval: '', compliance: '', process: '' }

const filterFields: { key: keyof StatusFilterValues; labelKey: string }[] = [
  { key: 'approval', labelKey: 'orders.filterApproval' },
  { key: 'compliance', labelKey: 'orders.filterCompliance' },
  { key: 'process', labelKey: 'orders.filterProcess' },
]

type OrderTableToolbarProps = {
  columns: ColumnsType<any>
  hiddenIds: string[]
  onToggleColumn: (id: string, visible: boolean) => void
  onResetColumns: () => void
  statusOptions: Record<keyof StatusFilterValues, string[]>
  appliedFilters: StatusFilterValues
  onApplyFilters: (filters: StatusFilterValues) => void
}

export function OrderTableToolbar({
  columns,
  hiddenIds,
  onToggleColumn,
  onResetColumns,
  statusOptions,
  appliedFilters,
  onApplyFilters,
}: OrderTableToolbarProps) {
  const { t } = useI18n()
  const [columnOpen, setColumnOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [draft, setDraft] = useState<StatusFilterValues>(appliedFilters)
  const filterActive = filterFields.some((field) => appliedFilters[field.key] !== '')

  const openFilter = (open: boolean) => {
    if (open) setDraft(appliedFilters)
    setFilterOpen(open)
  }

  const resetFilters = () => {
    setDraft(emptyStatusFilters)
    onApplyFilters(emptyStatusFilters)
    setFilterOpen(false)
  }

  const columnPanel = <div className="toolbar-panel column-visibility-panel">
    <div className="toolbar-panel-head"><strong>{t('orders.columnDisplay')}</strong><Button type="link" onClick={onResetColumns}>{t('common.reset')}</Button></div>
    <div className="toolbar-panel-list">
      {columns.map((column) => {
        const id = getColumnId(column)
        const label = String(column.title ?? id)
        return <Checkbox
          key={id}
          checked={!hiddenIds.includes(id)}
          onChange={(event) => onToggleColumn(id, event.target.checked)}
        >{label}</Checkbox>
      })}
    </div>
  </div>

  const filterPanel = <div className="toolbar-panel status-filter-panel">
    <div className="toolbar-panel-head"><strong>{t('orders.statusFilter')}</strong></div>
    <div className="toolbar-panel-fields">
      {filterFields.map((field) => (
        <div className="toolbar-panel-field" key={field.key}>
          <label>{t(field.labelKey)}</label>
          <Select
            value={draft[field.key]}
            onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
            options={[
              { value: '', label: t('orders.allOption') },
              ...statusOptions[field.key].map((value) => ({ value, label: t(`status.${value}`) })),
            ]}
          />
        </div>
      ))}
    </div>
    <Space className="toolbar-panel-actions">
      <Button onClick={resetFilters}>{t('common.reset')}</Button>
      <Button type="primary" onClick={() => { onApplyFilters(draft); setFilterOpen(false) }}>{t('common.search')}</Button>
    </Space>
  </div>

  return <div className="order-table-toolbar">
    <Popover
      open={filterOpen}
      onOpenChange={openFilter}
      trigger="click"
      placement="bottomRight"
      content={filterPanel}
      title={null}
    >
      <Badge dot={filterActive} offset={[-5, 5]}>
        <Button className="toolbar-icon-btn" icon={<FilterOutlined />} aria-label={t('orders.statusFilter')} />
      </Badge>
    </Popover>
    <Popover
      open={columnOpen}
      onOpenChange={setColumnOpen}
      trigger="click"
      placement="bottomRight"
      content={columnPanel}
      title={null}
    >
      <Button className="toolbar-icon-btn" icon={<SettingOutlined />} aria-label={t('orders.columnDisplay')} />
    </Popover>
  </div>
}
