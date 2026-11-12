import { useCallback, useEffect, useState } from 'react'

import {
  Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message,
} from 'antd'

import {
  ApiError,
  managementApi,
  type TemplateDetail,
} from '../../services/managementApi'
import { ModulePermissionPanel } from './ModulePermissionPanel'
import { PERMISSION_MODULES } from './permissionCatalog'
import { usePermissionSelection } from './usePermissionSelection'
import { useI18n } from '../../i18n/LanguageContext'

const { Text } = Typography

interface TemplateManagerModalProps {
  open: boolean
  onClose: () => void
  onChanged: () => void
}

interface TemplateFormProps {
  template: TemplateDetail | null
  onCancel: () => void
  onSaved: () => void
}

function TemplateForm({ template, onCancel, onSaved }: TemplateFormProps) {
  const { t } = useI18n()
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [saving, setSaving] = useState(false)
  const selection = usePermissionSelection(template?.resource_keys ?? [])

  const save = async () => {
    if (!name.trim()) {
      message.warning(t('admin.fillTemplateName'))
      return
    }
    setSaving(true)
    try {
      if (template) {
        await managementApi.updateTemplate(template.id, {
          name: name.trim(),
          description,
          resource_keys: selection.keys,
        })
      } else {
        await managementApi.createTemplate({
          name: name.trim(),
          description,
          resource_keys: selection.keys,
        })
      }
      message.success(t('admin.templateSaved'))
      onSaved()
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="tpl-form">
      <Form layout="vertical">
        <Form.Item label={t('admin.templateName')} required>
          <Input
            value={name}
            placeholder={t('admin.templateNamePlaceholder')}
            onChange={(event) => setName(event.target.value)}
          />
        </Form.Item>
        <Form.Item label={t('admin.templateDesc')}>
          <Input.TextArea
            value={description ?? ''}
            rows={2}
            placeholder={t('admin.templateDescPlaceholder')}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Form.Item>
      </Form>

      <div className="tpl-form-modules">
        {PERMISSION_MODULES.map((module) => (
          <ModulePermissionPanel
            key={module.key}
            module={module}
            enabled={selection.isModuleEnabled(module.key)}
            selected={selection.selected}
            onToggleModule={(enabled) => selection.setModuleEnabled(module, enabled)}
            onToggleKey={selection.toggleKey}
          />
        ))}
      </div>

      <div className="tpl-form-footer">
        <Space>
          <Button onClick={onCancel}>{t('admin.templateBack')}</Button>
          <Button type="primary" loading={saving} onClick={save}>
            {t('admin.saveTemplate')}
          </Button>
        </Space>
      </div>
    </div>
  )
}

export function TemplateManagerModal({
  open,
  onClose,
  onChanged,
}: TemplateManagerModalProps) {
  const { t } = useI18n()
  const [templates, setTemplates] = useState<TemplateDetail[]>([])
  const [editing, setEditing] = useState<TemplateDetail | 'new' | null>(null)
  const [loading, setLoading] = useState(false)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      setTemplates(await managementApi.listTemplates())
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.loadTemplatesFailed'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setEditing(null)
      loadTemplates()
    }
  }, [open, loadTemplates])

  const handleDelete = async (template: TemplateDetail) => {
    try {
      await managementApi.deleteTemplate(template.id)
      message.success(t('admin.templateDeleted'))
      loadTemplates()
      onChanged()
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.deleteFailed'))
    }
  }

  const columns = [
    { title: t('admin.colTemplateName'), dataIndex: 'name' },
    { title: t('admin.colTemplateDesc'), dataIndex: 'description', render: (value: string) => value || '—' },
    {
      title: t('admin.colTemplateKeys'),
      dataIndex: 'resource_keys',
      render: (keys: string[]) => t('admin.items', { count: keys.length }),
    },
    {
      title: t('admin.colTemplateType'),
      dataIndex: 'is_builtin',
      render: (builtin: number) =>
        builtin ? <Tag color="blue">{t('admin.builtin')}</Tag> : <Tag>{t('admin.custom')}</Tag>,
    },
    {
      title: t('common.actions'),
      render: (_: unknown, record: TemplateDetail) => (
        <Space>
          <Button type="link" onClick={() => setEditing(record)}>
            {t('admin.edit')}
          </Button>
          {record.is_builtin ? (
            <Text type="secondary" className="tpl-delete-disabled">
              {t('admin.cannotDelete')}
            </Text>
          ) : (
            <Popconfirm
              title={t('admin.confirmDeleteTemplate')}
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" danger>
                {t('admin.delete')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title={t('admin.templateManagerTitle')}
      open={open}
      width={680}
      onCancel={onClose}
      footer={null}
    >
      {editing === null ? (
        <>
          <div className="tpl-list-head">
            <Text type="secondary">{t('admin.templateListHint')}</Text>
            <Button type="primary" onClick={() => setEditing('new')}>
              {t('admin.newTemplate')}
            </Button>
          </div>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={templates}
            pagination={false}
          />
        </>
      ) : (
        <TemplateForm
          template={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            loadTemplates()
            onChanged()
          }}
        />
      )}
    </Modal>
  )
}
