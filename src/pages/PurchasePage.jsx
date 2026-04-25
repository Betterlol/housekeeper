import { useState } from 'react';
import MedicalIcon from '../components/MedicalIcon';
import { getPurchaseInsights } from '../utils/insights';
import { getMedications, updateMedicationStock } from '../utils/storage';

export default function PurchasePage() {
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState('');

  const medications = getMedications();
  const purchaseInsights = getPurchaseInsights(medications);

  const lowStockCount = purchaseInsights.filter((item) => item.lowStock).length;
  const duplicateRiskCount = purchaseInsights.filter((item) => item.duplicateRisk).length;

  const handleMockPurchase = (item) => {
    updateMedicationStock(item.id, 30);
    setMessage(`${item.drugName} 已模拟购药 +30${item.stockUnit}，库存已更新。`);
    setVersion((prev) => prev + 1);
  };

  return (
    <section key={version} className="space-y-4">
      <article className="rounded-3xl bg-gradient-to-br from-teal-700 via-emerald-700 to-cyan-700 p-5 text-white shadow-[0_22px_44px_-20px_rgba(13,148,136,0.85)]">
        <p className="text-xs text-teal-100">智能购药助手</p>
        <h1 className="mt-1 text-xl font-semibold">购药预警中心</h1>
        <p className="mt-2 text-xs text-teal-100">优先补货低库存药品，避免重复下单</p>
      </article>

      <div className="grid grid-cols-2 gap-2">
        <article className="rounded-2xl bg-white p-3 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
          <p className="text-xs text-slate-500">库存不足提醒</p>
          <p className="mt-1 text-xl font-semibold text-rose-600">{lowStockCount}</p>
        </article>
        <article className="rounded-2xl bg-white p-3 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
          <p className="text-xs text-slate-500">重复购药风险</p>
          <p className="mt-1 text-xl font-semibold text-amber-600">{duplicateRiskCount}</p>
        </article>
      </div>

      {message ? (
        <article className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </article>
      ) : null}

      <section className="space-y-3">
        {purchaseInsights.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.drugName}</p>
                <p className="mt-1 text-xs text-slate-500">库存 {item.stockQty}{item.stockUnit}</p>
                <p className="mt-1 text-xs text-slate-500">预计可用 {item.remainingDays} 天</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                  item.lowStock
                    ? 'bg-rose-100 text-rose-700'
                    : item.duplicateRisk
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {item.lowStock ? '建议补货' : item.duplicateRisk ? '谨慎下单' : '库存正常'}
              </span>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <MedicalIcon
                  name={item.duplicateRisk ? 'alert' : 'adherence'}
                  className={`mt-0.5 h-4 w-4 ${item.duplicateRisk ? 'text-amber-600' : 'text-emerald-600'}`}
                />
                <p>{item.riskMessage}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleMockPurchase(item)}
              className="mt-3 w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-medical-700"
            >
              模拟购药（+30{item.stockUnit}）
            </button>
          </article>
        ))}
      </section>
    </section>
  );
}
