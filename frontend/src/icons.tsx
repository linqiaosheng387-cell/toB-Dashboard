import type { CSSProperties, ReactNode } from 'react'

type IconProps = { style?: CSSProperties; className?: string; spin?: boolean }
const make = (glyph: ReactNode) => ({ style, className = '', spin }: IconProps) => <span className={`fake-icon ${spin ? 'spin' : ''} ${className}`} style={style}>{glyph}</span>

export const ArrowDownOutlined = make('↓')
export const ArrowUpOutlined = make('↑')
export const BarChartOutlined = make('▥')
export const CalendarOutlined = make('▣')
export const CheckCircleFilled = make('●')
export const CloseOutlined = make('×')
export const CloudDownloadOutlined = make('⇩')
export const DashboardOutlined = make('▦')
export const DownOutlined = make('⌄')
export const EditOutlined = make('✎')
export const ExclamationCircleFilled = make('!')
export const ExportOutlined = make('⇩')
export const FileExcelOutlined = make('▧')
export const FilterOutlined = make('≡')
export const InfoCircleOutlined = make('i')
export const LineChartOutlined = make('⌁')
export const LockOutlined = make('⌑')
export const LogoutOutlined = make('↪')
export const MenuFoldOutlined = make('≪')
export const MenuUnfoldOutlined = make('≫')
export const MoreOutlined = make('⋯')
export const PlusOutlined = make('+')
export const ReloadOutlined = make('↻')
export const SafetyCertificateOutlined = make('◆')
export const SearchOutlined = make('⌕')
export const SettingOutlined = make('⚙')
export const TeamOutlined = make('♙')
export const UserOutlined = make('●')
export const WalletOutlined = make('▣')
export const WarningFilled = make('!')
export const ThunderboltOutlined = make('⚡')
export const GlobalOutlined = make(
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9s1.3-6.3 3.9-9z" />
  </svg>
)
