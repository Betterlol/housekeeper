export default function ConsultDoctorReportCard({ doctorReport }) {
  return (
    <section className="px-1">
      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
        <p className="text-sm font-semibold text-slate-900">医生可读报告卡片</p>

        <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
          <p>
            <span className="font-medium text-slate-800">患者基本情况：</span>
            {doctorReport.profile.name}，{doctorReport.profile.gender}，{doctorReport.profile.age}岁，慢病诊断
            {(doctorReport.profile.diseases || []).join('、')}。
          </p>
          <p>
            <span className="font-medium text-slate-800">近7日用药依从率：</span>
            {doctorReport.adherence}% ，总体执行
            {doctorReport.adherence >= 90 ? '较稳定' : doctorReport.adherence >= 80 ? '中等' : '偏低'}。
          </p>
          <p>
            <span className="font-medium text-slate-800">漏服风险：</span>
            {doctorReport.missedRisk}，{doctorReport.missedRiskDesc}
          </p>
          <p>
            <span className="font-medium text-slate-800">不良反应：</span>
            {doctorReport.adverseText}
          </p>
          <p>
            <span className="font-medium text-slate-800">续方建议：</span>
            {doctorReport.refillAdvice}
          </p>
          <p>
            <span className="font-medium text-slate-800">医生沟通重点：</span>
          </p>
          {(doctorReport.communicationFocus || []).slice(0, 3).map((item, index) => (
            <p key={item}>{index + 1}. {item}</p>
          ))}
        </div>
      </article>
    </section>
  )
}
