import { useState } from 'react'

import { Form, Input, Modal, message } from 'antd'

import { ApiError, managementApi } from '../../services/managementApi'
import { useI18n } from '../../i18n/LanguageContext'

interface ChangePasswordModalProps {
  open: boolean
  account: string
  onClose: () => void
  onChanged: (newPassword: string) => void
}

interface PasswordFormValues {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/** Admin self-service password change; the old password is verified by the backend. */
export function ChangePasswordModal({
  open,
  account,
  onClose,
  onChanged,
}: ChangePasswordModalProps) {
  const { t } = useI18n()
  const [form] = Form.useForm<PasswordFormValues>()
  const [saving, setSaving] = useState(false)

  const close = () => {
    form.resetFields()
    onClose()
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await managementApi.changePassword(
        account,
        values.oldPassword,
        values.newPassword
      )
      message.success(t('admin.passwordChanged'))
      onChanged(values.newPassword)
      form.resetFields()
    } catch (error) {
      if (error instanceof ApiError) message.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={t('admin.passwordModalTitle')}
      open={open}
      onCancel={close}
      onOk={handleOk}
      confirmLoading={saving}
      okText={t('admin.confirmChange')}
      cancelText={t('common.cancel')}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item label={t('admin.accountField')}>
          <Input value={account} disabled />
        </Form.Item>
        <Form.Item
          label={t('admin.oldPassword')}
          name="oldPassword"
          rules={[{ required: true, message: t('admin.enterOldPassword') }]}
        >
          <Input.Password placeholder={t('admin.enterOldPassword')} />
        </Form.Item>
        <Form.Item
          label={t('admin.newPassword')}
          name="newPassword"
          rules={[{ required: true, min: 8, message: t('admin.newPasswordMin') }]}
        >
          <Input.Password placeholder={t('admin.atLeast8')} />
        </Form.Item>
        <Form.Item
          label={t('admin.confirmNewPassword')}
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: t('admin.enterNewPassword') },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue('newPassword') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('admin.passwordMismatch'))),
            }),
          ]}
        >
          <Input.Password placeholder={t('admin.enterNewPassword')} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
