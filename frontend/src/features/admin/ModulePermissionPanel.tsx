import { Button, Checkbox, Popover, Space, Typography } from 'antd'
import type { PermissionResource, PermissionModule } from './permissionCatalog'
import { resourceLabelKey } from './permissionCatalog'
import { useI18n } from '../../i18n/LanguageContext'

const { Text } = Typography

interface ModulePermissionPanelProps {
  module: PermissionModule
  enabled: boolean
  selected: Set<string>
  onToggleModule: (enabled: boolean) => void
  onToggleKey: (key: string, checked: boolean) => void
}

interface ResourceGroupProps {
  title: string
  resources: PermissionResource[]
  selected: Set<string>
  onToggleKey: (key: string, checked: boolean) => void
}

function ResourceGroup({ title, resources, selected, onToggleKey }: ResourceGroupProps) {
  const { t } = useI18n()
  if (resources.length === 0) return null
  const allChecked = resources.every((item) => selected.has(item.key))
  const toggleAll = (checked: boolean) =>
    resources.forEach((item) => onToggleKey(item.key, checked))

  return (
    <div className="perm-group">
      <div className="perm-group-head">
        <Text strong>{title}</Text>
        <Checkbox
          checked={allChecked}
          indeterminate={!allChecked && resources.some((item) => selected.has(item.key))}
          onChange={(event) => toggleAll(event.target.checked)}
        >
          {t('admin.selectAll')}
        </Checkbox>
      </div>
      <div className="perm-group-body">
        {resources.map((item) => (
          <Checkbox
            key={item.key}
            checked={selected.has(item.key)}
            onChange={(event) => onToggleKey(item.key, event.target.checked)}
          >
            {t(resourceLabelKey(item.key))}
          </Checkbox>
        ))}
      </div>
    </div>
  )
}

export function ModulePermissionPanel({
  module,
  enabled,
  selected,
  onToggleModule,
  onToggleKey,
}: ModulePermissionPanelProps) {
  const { t } = useI18n()
  const enabledCount =
    module.metrics.filter((item) => selected.has(item.key)).length +
    module.charts.filter((item) => selected.has(item.key)).length +
    module.fields.filter((item) => selected.has(item.key)).length
  const totalCount =
    module.metrics.length + module.charts.length + module.fields.length

  const configContent = (
    <div className="perm-popover">
      <ResourceGroup
        title={t('admin.groupMetrics')}
        resources={module.metrics}
        selected={selected}
        onToggleKey={onToggleKey}
      />
      <ResourceGroup
        title={t('admin.groupCharts')}
        resources={module.charts}
        selected={selected}
        onToggleKey={onToggleKey}
      />
      <ResourceGroup
        title={t('admin.groupFields')}
        resources={module.fields}
        selected={selected}
        onToggleKey={onToggleKey}
      />
    </div>
  )

  return (
    <div className={`module-perm-row${enabled ? ' is-enabled' : ''}`}>
      <Checkbox
        checked={enabled}
        onChange={(event) => onToggleModule(event.target.checked)}
      >
        <Text strong>{t(resourceLabelKey(`${module.key}.module`))}</Text>
      </Checkbox>
      <Space>
        <Text type="secondary" className="module-perm-count">
          {enabled ? `${enabledCount}/${totalCount}` : t('admin.notEnabled')}
        </Text>
        {enabled ? (
          <Popover
            content={configContent}
            title={t('admin.resourcePopover', { name: t(resourceLabelKey(`${module.key}.module`)) })}
            trigger="click"
            placement="leftTop"
          >
            <Button size="small">{t('admin.configure')}</Button>
          </Popover>
        ) : (
          <Button size="small" disabled>
            {t('admin.configure')}
          </Button>
        )}
      </Space>
    </div>
  )
}
