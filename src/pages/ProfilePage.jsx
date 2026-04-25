import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import {
  clearStoreForDemo,
  generateDefenseDemoData,
  getStore,
} from '../utils/storage';

function formatDateTime(value) {
  if (!value) return '未生成';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未生成';

  return date.toLocaleString('zh-CN', { hour12: false });
}

export default function ProfilePage() {
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState('');

  const store = getStore();
  const medications = store.medications || [];
  const logs = store.intakeLogs || [];
  const adverseEvents = store.adverseEvents || [];

  const userProfile = useMemo(
    () =>
      store.userProfile || {
        name: '张先生',
        age: 58,
        gender: '男',
        diseases: ['高血压', '2型糖尿病'],
        diagnosisDate: '待补充',
        note: '当前为基础 mock 数据，点击“生成答辩演示数据”可切换完整旅程。',
      },
    [store.userProfile, version]
  );

  const demoMeta = store.demoMeta || {
    mode: 'default',
    generatedAt: '',
    label: '基础数据',
  };

  const isDefenseMode = demoMeta.mode === 'defense';

  const handleGenerateDemo = () => {
    generateDefenseDemoData();
    setVersion((prev) => prev + 1);
    setMessage('答辩演示数据已生成，可前往首页 / AI复诊 / 购药页进行闭环演示。');
  };

  const handleResetDemo = () => {
    clearStoreForDemo();
    setVersion((prev) => prev + 1);
    setMessage('已重置为基础 mock 数据。');
  };

  return (
    <section>
      <PageHeader title="我的" subtitle="比赛演示配置与数据管理" />

      <div className="space-y-3">
        {message ? (
          <article className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {message}
          </article>
        ) : null}

        <article className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-slate-900">慢病档案</p>
          <p className="mt-2 text-xs text-slate-600">
            {userProfile.name} · {userProfile.gender} · {userProfile.age}岁
          </p>
          <p className="mt-1 text-xs text-slate-600">诊断：{(userProfile.diseases || []).join(' + ')}</p>
          <p className="mt-1 text-xs text-slate-600">初诊日期：{userProfile.diagnosisDate || '待补充'}</p>
          <p className="mt-2 text-xs text-slate-500">{userProfile.note}</p>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-slate-900">演示数据状态</p>
          <p className="mt-2 text-xs text-slate-600">
            当前模式：{isDefenseMode ? '答辩演示模式' : '基础数据模式'}
          </p>
          <p className="mt-1 text-xs text-slate-600">数据标签：{demoMeta.label || '基础数据'}</p>
          <p className="mt-1 text-xs text-slate-600">生成时间：{formatDateTime(demoMeta.generatedAt)}</p>
          <p className="mt-1 text-xs text-slate-500">
            药品数 {medications.length} · 服药记录 {logs.length} · 不良反应 {adverseEvents.length}
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
      </div>
    </section>
  );
}
