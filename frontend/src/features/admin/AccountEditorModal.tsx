import { useCallback, useEffect, useState } from 'react'

import {
  Button, Drawer, Form, Input, Modal, Select, Space, Spin, Typography, message,
} from 'antd'

import {
  ApiError,
  managementApi,
  type AccountDetail,
  type TemplateDetail,
} from '../../services/managementApi'
import { ModulePermissionPanel } from './ModulePermissionPanel'
import { PERMISSION_MODULES } from './permissionCatalog'
import { TemplateManagerModal } from './TemplateManagerModal'
import { TemplateQuickApply } from './TemplateQuickApply'
import { usePermissionSelection } from './usePermissionSelection'
import { useI18n } from '../../i18n/LanguageContext'

const { Text } = Typography

const COMPANY_OPTIONS = [
  'Acme Mobility Ltd.',
  'Lagos Ride Co.',
  'BlueCabs Nigeria',
]

export interface AccountEditorModalProps {
  mode: 'new' | 'edit'
  accountId?: number
  onClose: () => void
  onSaved: () => void
}

export function AccountEditorModal({
  mode,
  accountId,
  onClose,
  onSaved,
}: AccountEditorModalProps) {
  const { t } = useI18n()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState(COMPANY_OPTIONS[0])
  const [templates, setTemplates] = useState<TemplateDetail[]>([])
  const [tplManagerOpen, setTplManagerOpen] = useState(false)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const selection = usePermissionSelection([])

  const loadTemplates = useCallback(async () => {
    try {
      setTemplates(await managementApi.listTemplates())
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.loadTemplatesFailed'))
    }
  }, [])

  const loadAccount = useCallback(async () => {
    if (mode !== 'edit' || accountId === undefined) return
    setLoading(true)
    try {
      const detail: AccountDetail = await managementApi.getAccount(accountId)
      setAccount(detail.account)
      setCompany(detail.company)
      selection.applyKeys(detail.resource_keys)
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.loadAccountFailed'))
    } finally {
      setLoading(false)
    }
  }, [mode, accountId])

  useEffect(() => {
    loadTemplates()
    loadAccount()
  }, [loadTemplates, loadAccount])

  const applyTemplate = (template: TemplateDetail) => {
    selection.applyKeys(template.resource_keys)
    message.success(t('admin.appliedTemplate', { name: template.name }))
  }

  const save = async () => {
    if (mode === 'new' && (!account.trim() || !password)) {
      message.warning(t('admin.fillAccountPassword'))
      return
    }
    setSaving(true)
    try {
      if (mode === 'new') {
        await managementApi.createAccount({
          account: account.trim(),
          password,
          company,
          resource_keys: selection.keys,
        })
        message.success(t('admin.accountCreated'))
      } else if (accountId !== undefined) {
        await managementApi.updateAccount(accountId, {
          company,
          resource_keys: selection.keys,
          ...(password ? { password } : {}),
        })
        message.success(t('admin.accountSaved'))
      }
      onSaved()
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : t('admin.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const body = loading ? (
    <div className="account-editor-loading">
      <Spin />
    </div>
  ) : (
    <Form layout="vertical">
      <Form.Item label={t('admin.loginAccount')} required>
        <Input
          value={account}
          disabled={mode === 'edit'}
          placeholder={t('admin.accountPlaceholder')}
          onChange={(event) => setAccount(event.target.value)}
        />
      </Form.Item>
      <Form.Item label={mode === 'new' ? t('admin.initialPassword') : t('admin.resetPasswordField')}>
        <Input.Password
          value={password}
          placeholder={mode === 'new' ? t('admin.passwordPlaceholder') : t('admin.keepPassword')}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Form.Item>
      <Form.Item label={t('admin.company')}>
        <Select
          value={company}
          options={COMPANY_OPTIONS.map((value) => ({ value }))}
          onChange={setCompany}
        />
      </Form.Item>

      <div className="permission-editor-head">
        <Text strong>{t('admin.resourcePermission')}</Text>
        <TemplateQuickApply
          templates={templates}
          onApply={applyTemplate}
          onManage={() => setTplManagerOpen(true)}
        />
      </div>
      <Text type="secondary" className="permission-editor-hint">
        {t('admin.resourceHint')}
      </Text>

      <div className="permission-editor-modules">
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

      <TemplateManagerModal
        open={tplManagerOpen}
        onClose={() => setTplManagerOpen(false)}
        onChanged={loadTemplates}
      />
    </Form>
  )

  if (mode === 'new') {
    return (
      <Modal
        title={t('admin.createTitle')}
        open
        centered
        width={560}
        maskClosable={false}
        onCancel={onClose}
        onOk={save}
        okText={t('admin.createButton')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        styles={{ body: { paddingTop: 16, maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {body}
      </Modal>
    )
  }

  return (
    <Drawer
      title={t('admin.editTitle')}
      open
      width={520}
      onClose={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" loading={saving} onClick={save}>
            {t('admin.saveButton')}
          </Button>
        </Space>
      }
    >
      {body}
    </Drawer>
  )
}
