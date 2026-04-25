import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  clearStoreForDemo,
  generateDefenseDemoData,
  updateUserProfile,
} from '../utils/storage'

function formatDateTime(value) {
  if (!value) return '未生成'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未生成'

  return date.toLocaleString('zh-CN', { hour12: false })
}

export default function ProfilePage() {
  const [message, setMessage] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const store = useStoreSnapshot()

  const userProfile = useMemo(
    () => store.userProfile || {
      name: '张先生',
      age: 58,
      gender: '男',
      diseases: ['高血压', '2型糖尿病'],
      diagnosisDate: '待补充',
      note: '',
    },
    [store.userProfile]
  )

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

  const demoMeta = store.demoMeta || {
    mode: 'default',
    generatedAt: '',
    label: '基础数据',
  }

  const isDefenseMode = demoMeta.mode === 'defense'

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

  const handleGenerateDemo = () => {
    generateDefenseDemoData()
    setMessage('答辩演示数据已生成，可前往首页 / 提醒 / AI复诊 / 购药页演示闭环。')
  }

  const handleResetDemo = () => {
    clearStoreForDemo()
    setMessage('已重置为基础 mock 数据。')
  }

  return (
    <section className="space-y-3">
      <PageHeader title="我的" subtitle="用户档案编辑与比赛演示配置" />

      {message ? (
        <article className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </article>
      ) : null}

      <article className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">慢病档案</p>
            <p className="mt-2 text-xs text-slate-600">
              {userProfile.name} · {userProfile.gender} · {userProfile.age}岁
            </p>
            <p className="mt-1 text-xs text-slate-600">诊断：{(userProfile.diseases || []).join(' + ')}</p>
            <p className="mt-1 text-xs text-slate-600">初诊日期：{userProfile.diagnosisDate || '待补充'}</p>
            <p className="mt-2 text-xs text-slate-500">{userProfile.note || '暂无备注。'}</p>
          </div>

          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="rounded-lg border border-medical-200 px-2 py-1 text-xs text-medical-700"
          >
            编辑档案
          </button>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-sm font-semibold text-slate-900">演示数据状态</p>
        <p className="mt-2 text-xs text-slate-600">当前模式：{isDefenseMode ? '答辩演示模式' : '基础数据模式'}</p>
        <p className="mt-1 text-xs text-slate-600">数据标签：{demoMeta.label || '基础数据'}</p>
        <p className="mt-1 text-xs text-slate-600">生成时间：{formatDateTime(demoMeta.generatedAt)}</p>
        <p className="mt-1 text-xs text-slate-500">
          药品数 {(store.medications || []).length} · 提醒规则 {(store.reminderRules || []).length} · 今日实例 {(store.reminderInstances || []).filter((item) => (item.scheduledAt || '').startsWith(new Date().toISOString().slice(0, 10))).length}
        </p>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-sm font-semibold text-slate-900">演示工具</p>
        <p className="mt-2 text-xs text-slate-500">
          一键生成完整用户旅程数据，快速演示“问诊 - 购药 - 用药 - 续方”闭环。
        </p>

        <button
          type="button"
          onClick={handleGenerateDemo}
          className="mt-3 w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-medical-700"
        >
          生成答辩演示数据
        </button>

        <button
          type="button"
          onClick={handleResetDemo}
          className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          重置演示数据
        </button>
      </article>

      {editorOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-sm">
          <form
            onSubmit={handleSaveProfile}
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">编辑慢病档案</p>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
              >
                关闭
              </button>
            </div>

            <div className="space-y-3">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="姓名"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  name="age"
                  type="number"
                  min="1"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="年龄"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
                />

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <input
                name="diseases"
                value={form.diseases}
                onChange={handleChange}
                placeholder="慢病类型，逗号分隔"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
              />

              <input
                name="diagnosisDate"
                type="date"
                value={form.diagnosisDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
              />

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={3}
                placeholder="备注"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
              >
                保存档案
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}
