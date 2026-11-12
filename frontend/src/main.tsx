import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import 'antd/dist/reset.css'
import './styles.css'
import './overrides.css'
import './animations.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={{ token: { colorPrimary: '#2f76b2', borderRadius: 9, fontFamily: "Poppins, 'Noto Sans SC', 'Microsoft YaHei', sans-serif" }, components: { Button: { controlHeight: 36 }, Card: { borderRadiusLG: 14 }, Table: { headerBg: '#fafbfc' } } }}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
