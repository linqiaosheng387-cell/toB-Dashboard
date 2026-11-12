import { Button, Dropdown } from 'antd'

import { ThunderboltOutlined } from '../../icons'
import type { TemplateDetail } from '../../services/managementApi'
import { useI18n } from '../../i18n/LanguageContext'

interface TemplateQuickApplyProps {
  templates: TemplateDetail[]
  onApply: (template: TemplateDetail) => void
  onManage: () => void
}

export function TemplateQuickApply({
  templates,
  onApply,
  onManage,
}: TemplateQuickApplyProps) {
  const { t } = useI18n()
  const menuItems = [
    ...templates.map((template) => ({
      key: String(template.id),
      label: t('admin.templateItem', { name: template.name, count: template.resource_keys.length }),
      onClick: () => onApply(template),
    })),
    { type: 'divider' as const },
    { key: 'manage', label: t('admin.manageTemplate'), onClick: onManage },
  ]

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button icon={<ThunderboltOutlined />}>{t('admin.quickApply')}</Button>
    </Dropdown>
  )
}
