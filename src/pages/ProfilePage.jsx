import { useEffect, useMemo, useState } from 'react'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  clearStoreForDemo,
  generateDefenseDemoData,
  getTodayDateKey,
  updateUserProfile,
} from '../utils/storage'
import ProfileAccountCard from '../components/profile/ProfileAccountCard'
import ProfileArchiveCard from '../components/profile/ProfileArchiveCard'
import ProfileListSection from '../components/profile/ProfileListSection'
import ProfileDemoModeCard from '../components/profile/ProfileDemoModeCard'
import ProfileEditSheet from '../components/profile/ProfileEditSheet'
import ProfileReportImportSheet from '../components/profile/ProfileReportImportSheet'

const reportParseHints = [
  '正在识别报告结构与检验指标...',
  '正在提取慢病类型与关键体征...',
  '正在生成复诊建议与时间节点...',
]

const defaultProfile = {
  name: '张先生',
  age: 58,
  gender: '男',
  diseases: ['高血压', '2型糖尿病'],
  diagnosisDate: '待补充',
  note: '',
  bloodPressure: '',
  bloodSugar: '',
  doctorAdvice: '',
  nextVisitDate: '',
}

const healthEntryItems = [
  {
    key: 'health-report',
    title: '健康报告',
    description: '查看近7日慢病指标与复诊建议',
    icon: 'consult',
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-700',
  },
  {
    key: 'intake-export',
    title: '用药记录导出',
    description: '导出服药与提醒历史用于就诊',
    icon: 'plan',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
  },
  {
    key: 'followup-pack',
    title: '复诊资料包',
    description: '自动汇总复诊所需关键信息',
    icon: 'ai',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-700',
  },
  {
    key: 'reminder-setting',
    title: '提醒设置',
    description: '管理闹钟规则与提醒节奏',
    icon: 'reminder',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
  },
  {
    key: 'family-collab',
    title: '家属协同',
    description: '共享服药状态给家属（演示占位）',
    icon: 'profile',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-700',
  },
  {
    key: 'privacy-auth',
    title: '隐私与授权',
    description: '管理数据授权与隐私设置',
    icon: 'alert',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
  },
]

const systemHelpItems = [
  {
    key: 'help',
    title: '使用帮助',
    description: '查看功能说明与常见问题',
    icon: 'consult',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
  },
  {
    key: 'feedback',
    title: '反馈建议',
    description: '提交优化建议或问题反馈',
    icon: 'ai',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
  },
  {
    key: 'about',
    title: '关于慢病用药小管家',
    description: '产品信息与版本说明',
    icon: 'profile',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
  },
]

function buildMockReportResult() {
  const nextVisit = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const year = nextVisit.getFullYear()
  const month = `${nextVisit.getMonth() + 1}`.padStart(2, '0')
  const day = `${nextVisit.getDate()}`.padStart(2, '0')
  const nextVisitDate = `${year}-${month}-${day}`

  return {
    diseases: ['高血压', '2型糖尿病'],
    bloodPressure: '136/84 mmHg',
    bloodSugar: '7.2 mmol/L',
    doctorAdvice: '建议继续规律服药，重点减少晚间漏服；2周后复诊并复测空腹血糖。',
    nextVisitDate,
  }
}

function formatDateTime(value) {
  if (!value) return '未更新'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未更新'
  return date.toLocaleString('zh-CN', { hour12: false })
}

function resolveLatestUpdateTime(store) {
  const timePool = []
  const pushTime = (value) => {
    if (!value) return
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return
    timePool.push(parsed.getTime())
  }

  pushTime(store.demoMeta?.generatedAt)
  ;(store.reminderInstances || []).forEach((item) => {
    pushTime(item.completedAt)
    pushTime(item.lastNotifiedAt)
    pushTime(item.notifiedAt)
  })
  ;(store.intakeLogs || []).forEach((item) => pushTime(item.takenAt))
  ;(store.adverseEvents || []).forEach((item) => pushTime(item.eventTime))

  if (timePool.length === 0) return ''
  const latest = Math.max(...timePool)
  return new Date(latest).toISOString()
}

export default function ProfilePage() {
  const store = useStoreSnapshot()

  const [message, setMessage] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportStep, setReportStep] = useState('upload')
  const [reportFile, setReportFile] = useState(null)
  const [reportResult, setReportResult] = useState(null)
  const [parseHintIndex, setParseHintIndex] = useState(0)

  const userProfile = useMemo(() => store.userProfile || defaultProfile, [store.userProfile])
  const demoMeta = useMemo(
    () => store.demoMeta || { mode: 'default', generatedAt: '', label: '基础数据' },
    [store.demoMeta]
  )
  const isDefenseMode = demoMeta.mode === 'defense'

  const [form, setForm] = useState({
    name: userProfile.name || '',
    age: userProfile.age || 58,
    gender: userProfile.gender || '男',
    diseases: (userProfile.diseases || []).join('，'),
    diagnosisDate: userProfile.diagnosisDate || '',
    note: userProfile.note || '',
  })

  useEffect(() => {
    setForm({
      name: userProfile.name || '',
      age: userProfile.age || 58,
      gender: userProfile.gender || '男',
      diseases: (userProfile.diseases || []).join('，'),
      diagnosisDate: userProfile.diagnosisDate || '',
      note: userProfile.note || '',
    })
  }, [userProfile])

  useEffect(() => {
    if (!reportOpen || reportStep !== 'parsing') return undefined

    let hintIndex = 0
    const hintTimer = setInterval(() => {
      hintIndex = (hintIndex + 1) % reportParseHints.length
      setParseHintIndex(hintIndex)
    }, 700)

    const doneTimer = setTimeout(() => {
      setReportResult(buildMockReportResult())
      setReportStep('result')
    }, 2400)

    return () => {
      clearInterval(hintTimer)
      clearTimeout(doneTimer)
    }
  }, [reportOpen, reportStep])

  const statCounts = useMemo(
    () => ({
      medications: (store.medications || []).length,
      intakeLogs: (store.intakeLogs || []).length,
      adverseEvents: (store.adverseEvents || []).length,
      reminderRules: (store.reminderRules || []).length,
      todayInstances: (store.reminderInstances || []).filter((item) => (item.scheduledAt || '').startsWith(getTodayDateKey())).length,
    }),
    [store]
  )

  const updatedAtText = useMemo(
    () => formatDateTime(resolveLatestUpdateTime(store)),
    [store]
  )

  const demoGeneratedText = useMemo(
    () => formatDateTime(demoMeta.generatedAt),
    [demoMeta.generatedAt]
  )

  const demoStatLine = `药品数 ${statCounts.medications} · 提醒规则/服药记录 ${statCounts.reminderRules}/${statCounts.intakeLogs} · 今日实例/不良反应 ${statCounts.todayInstances}/${statCounts.adverseEvents}`

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = (event) => {
    event.preventDefault()

    updateUserProfile({
      name: form.name.trim() || '张先生',
      age: Number(form.age || 58),
      gender: form.gender,
      diseases: form.diseases
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
      diagnosisDate: form.diagnosisDate,
      note: form.note.trim(),
    })

    setEditorOpen(false)
    setMessage('用户档案已保存，AI复诊报告将自动读取最新档案。')
  }

  const openReportImport = () => {
    setReportOpen(true)
    setReportStep('upload')
    setReportFile(null)
    setReportResult(null)
    setParseHintIndex(0)
  }

  const closeReportImport = () => {
    setReportOpen(false)
    setReportStep('upload')
    setReportFile(null)
    setReportResult(null)
    setParseHintIndex(0)
  }

  const startMockParse = () => {
    if (!reportFile) {
      setMessage('请先上传报告文件。')
      return
    }
    setReportStep('parsing')
    setParseHintIndex(0)
  }

  const confirmReportImport = () => {
    if (!reportResult) return

    updateUserProfile({
      diseases: reportResult.diseases,
      bloodPressure: reportResult.bloodPressure,
      bloodSugar: reportResult.bloodSugar,
      doctorAdvice: reportResult.doctorAdvice,
      nextVisitDate: reportResult.nextVisitDate,
      note: reportResult.doctorAdvice,
    })

    setReportStep('success')
    setMessage('报告已导入并更新用户档案。')

    setTimeout(() => {
      closeReportImport()
    }, 900)
  }

  const handleGenerateDemo = () => {
    generateDefenseDemoData()
    setMessage('答辩演示数据已生成，可前往首页 / 提醒 / AI复诊 / 购药页演示闭环。')
  }

  const handleResetDemo = () => {
    clearStoreForDemo()
    setMessage('已重置为基础 mock 数据。')
  }

  const handlePlaceholderPress = (item) => {
    window.alert(`${item.title} 功能建设中，当前为演示占位入口。`)
  }

  return (
    <section className="space-y-4 pb-2">
      <header className="px-1">
        <h1 className="text-xl font-semibold text-slate-900">个人健康账户</h1>
        <p className="mt-1 text-sm text-slate-500">慢病管理档案、健康数据入口与系统设置</p>
      </header>

      {message ? (
        <article className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </article>
      ) : null}

      <ProfileAccountCard
        userProfile={userProfile}
        updatedAtText={updatedAtText}
      />

      <ProfileArchiveCard
        userProfile={userProfile}
        statCounts={statCounts}
        onEdit={() => setEditorOpen(true)}
        onImport={openReportImport}
      />

      <ProfileListSection
        title="健康数据入口"
        items={healthEntryItems}
        onPress={handlePlaceholderPress}
      />

      <ProfileDemoModeCard
        demoMeta={demoMeta}
        isDefenseMode={isDefenseMode}
        statLine={demoStatLine}
        generatedAtText={demoGeneratedText}
        onGenerate={handleGenerateDemo}
        onReset={handleResetDemo}
      />

      <ProfileListSection
        title="系统与帮助"
        items={systemHelpItems}
        onPress={handlePlaceholderPress}
      />

      <ProfileEditSheet
        open={editorOpen}
        form={form}
        onClose={() => setEditorOpen(false)}
        onChange={handleChange}
        onSubmit={handleSaveProfile}
      />

      <ProfileReportImportSheet
        open={reportOpen}
        reportStep={reportStep}
        reportFile={reportFile}
        reportResult={reportResult}
        parseHint={reportParseHints[parseHintIndex]}
        onClose={closeReportImport}
        onPickFile={setReportFile}
        onStartParse={startMockParse}
        onConfirm={confirmReportImport}
      />
    </section>
  )
}
