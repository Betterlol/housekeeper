import { useEffect, useMemo, useRef, useState } from 'react'
import MedicalIcon from '../components/MedicalIcon'
import PageSurface from '../components/common/PageSurface'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import { getPurchaseInsights } from '../utils/insights'
import { markExperienceVisited, updateMedicationStock } from '../utils/storage'

const matchingHints = [
  '正在分析当前用药计划...',
  '正在计算库存可用天数...',
  '正在匹配附近药房库存...',
  '正在生成补货建议...',
]

const orderHints = [
  '正在提交订单...',
  '正在锁定药房库存...',
  '正在生成配送方案...',
]

const riskPillClassMap = {
  low: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  safe: 'bg-emerald-100 text-emerald-700',
}

function getRiskTone(item) {
  if (item.lowStock) return 'low'
  if (item.duplicateRisk) return 'medium'
  return 'safe'
}

export default function PurchasePage() {
  const [message, setMessage] = useState('')
  const [isMatching, setIsMatching] = useState(true)
  const [matchingHintIndex, setMatchingHintIndex] = useState(0)
  const [orderStateMap, setOrderStateMap] = useState({})

  const orderTimersRef = useRef({})

  const store = useStoreSnapshot()
  const purchaseInsights = useMemo(() => getPurchaseInsights(store), [store])

  useEffect(() => {
    markExperienceVisited('purchase')
  }, [])

  const signature = useMemo(() => {
    const meds = (store.medications || [])
      .map((item) => `${item.id}:${item.stockQty}:${item.dose}`)
      .join('|')
    const rules = (store.reminderRules || [])
      .map((item) => `${item.id}:${item.time}:${item.enabled}`)
      .join('|')

    return `${meds}#${rules}`
  }, [store])

  useEffect(() => {
    setIsMatching(true)
    setMatchingHintIndex(0)

    const hintTimer = setInterval(() => {
      setMatchingHintIndex((prev) => (prev + 1) % matchingHints.length)
    }, 420)

    const delay = 800 + Math.floor(Math.random() * 700)
    const doneTimer = setTimeout(() => {
      setIsMatching(false)
      clearInterval(hintTimer)
    }, delay)

    return () => {
      clearInterval(hintTimer)
      clearTimeout(doneTimer)
    }
  }, [signature])

  useEffect(() => () => {
    Object.values(orderTimersRef.current).forEach((timers) => {
      clearInterval(timers.interval)
      clearTimeout(timers.timeout)
      clearTimeout(timers.reset)
    })
  }, [])

  const lowStockCount = purchaseInsights.filter((item) => item.lowStock).length
  const duplicateRiskCount = purchaseInsights.filter((item) => item.duplicateRisk).length

  const handleMockOrder = (item) => {
    const current = orderStateMap[item.id]
    if (current?.phase === 'loading') return

    const currentTimers = orderTimersRef.current[item.id]
    if (currentTimers) {
      clearInterval(currentTimers.interval)
      clearTimeout(currentTimers.timeout)
      clearTimeout(currentTimers.reset)
    }

    let hintIndex = 0
    setOrderStateMap((prev) => ({
      ...prev,
      [item.id]: { phase: 'loading', hintIndex: 0 },
    }))

    const interval = setInterval(() => {
      hintIndex = (hintIndex + 1) % orderHints.length
      setOrderStateMap((prev) => ({
        ...prev,
        [item.id]: { phase: 'loading', hintIndex },
      }))
    }, 280)

    const timeout = setTimeout(() => {
      clearInterval(interval)

      const addQty = item.recommendPurchaseQty > 0 ? item.recommendPurchaseQty : item.unitPerPack
      updateMedicationStock(item.id, addQty)

      setOrderStateMap((prev) => ({
        ...prev,
        [item.id]: { phase: 'success', hintIndex: 0 },
      }))

      setMessage(`${item.drugName} 模拟下单成功，库存已更新（+${addQty}${item.stockUnit}）。`)

      const reset = setTimeout(() => {
        setOrderStateMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'idle', hintIndex: 0 },
        }))
      }, 1200)

      orderTimersRef.current[item.id] = { interval: null, timeout: null, reset }
    }, 1000)

    orderTimersRef.current[item.id] = { interval, timeout, reset: null }
  }

  return (
    <PageSurface variant="purchase" className="space-y-4">
      <article className="rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 p-5 text-white shadow-[0_18px_36px_-24px_rgba(13,148,136,0.56)]">
        <p className="text-xs text-teal-50/85">智能购药助手</p>
        <h1 className="mt-1 text-xl font-semibold">互联网药房补货中心</h1>
        <p className="mt-2 text-xs text-teal-50/85">根据当前用药计划动态匹配补货建议与配送方案</p>
      </article>

      {isMatching ? (
        <article className="rounded-2xl bg-white p-5 text-center shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-medical-200 border-t-medical-600" />
          <p className="mt-3 text-sm font-medium text-slate-700">智能匹配中...</p>
          <p className="mt-1 text-xs text-slate-500">{matchingHints[matchingHintIndex]}</p>
        </article>
      ) : (
        <>
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
            {purchaseInsights.map((item) => {
              const tone = getRiskTone(item)
              const orderState = orderStateMap[item.id] || { phase: 'idle', hintIndex: 0 }

              return (
                <article key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.drugName}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.spec || '未填写规格'}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${riskPillClassMap[tone]}`}>
                      {item.riskLabel}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span key={`${item.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <p>当前库存：{item.stockQty}{item.stockUnit}</p>
                    <p>每日用量：{item.dailyUse.toFixed(2)} {item.stockUnit}/天</p>
                    <p>可用天数：{item.remainingDays} 天</p>
                    <p>推荐补货：{item.recommendPurchase ? `${item.recommendPurchaseQty}${item.stockUnit}` : '暂不建议'}</p>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <p className="text-xl font-semibold text-medical-700">{item.mockPrice} / 盒</p>
                    <p className="mt-1 text-xs text-slate-600">药房库存：{item.pharmacyStock}</p>
                    <p className="mt-1 text-xs text-slate-500">配送信息：{item.deliveryEta}</p>
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

                  {orderState.phase === 'loading' ? (
                    <div className="mt-3 rounded-xl border border-medical-100 bg-medical-50 p-3 text-xs text-medical-700">
                      <div className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-medical-200 border-t-medical-700" />
                        <span>{orderHints[orderState.hintIndex]}</span>
                      </div>
                    </div>
                  ) : null}

                  {orderState.phase === 'success' ? (
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">
                      模拟下单成功
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleMockOrder(item)}
                    disabled={orderState.phase === 'loading'}
                    className="mt-3 w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-medical-700 disabled:opacity-60"
                  >
                    {orderState.phase === 'loading' ? '下单处理中...' : '立即补货'}
                  </button>
                </article>
              )
            })}

            {purchaseInsights.length === 0 ? (
              <article className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
                当前暂无药品，请先在“用药计划”中新增药品或导入处方。
              </article>
            ) : null}
          </section>
        </>
      )}
    </PageSurface>
  )
}
