import PageHeader from '../components/PageHeader';
import { clearStoreForDemo, getIntakeLogs, getMedications } from '../utils/storage';

export default function ProfilePage() {
  const medications = getMedications();
  const logs = getIntakeLogs();

  return (
    <section>
      <PageHeader title="我的" subtitle="比赛演示配置与数据管理" />

      <div className="space-y-3">
        <article className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-slate-900">慢病档案摘要</p>
          <p className="mt-2 text-xs text-slate-500">当前药品数：{medications.length}</p>
          <p className="mt-1 text-xs text-slate-500">累计服药记录：{logs.length}</p>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-slate-900">演示工具</p>
          <p className="mt-2 text-xs text-slate-500">可在答辩前一键恢复初始 mock 数据。</p>
          <button
            type="button"
            onClick={() => {
              clearStoreForDemo();
              window.location.reload();
            }}
            className="mt-3 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            重置演示数据
          </button>
        </article>
      </div>
    </section>
  );
}
