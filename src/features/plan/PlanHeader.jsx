import PageHero from '../../components/common/PageHero'

export default function PlanHeader({ onImport, onCreate, summary, insight }) {
  return (
    <PageHero
      icon="plan"
      variant="soft"
      eyebrow="长期用药管理"
      title="个人药盒"
      description="把药品计划、库存风险和依从率收束在一个轻量头部里，保持专业、克制，但不再是裸白标题。"
      badges={summary.totalMedications > 0 ? ['支持处方导入', '支持库存预警', '支持提醒联动'] : ['支持处方导入', '支持库存预警']}
      metrics={[
        { label: '长期药物', value: `${summary.totalMedications}种`, tone: 'cyan' },
        { label: '需要关注', value: `${summary.needsAttention}种`, tone: 'amber' },
        { label: '最近7天依从率', value: `${summary.avgAdherence}%`, tone: 'emerald' },
      ]}
      actions={[
        { label: '导入处方', onClick: onImport },
        { label: '添加药品', onClick: onCreate, variant: 'secondary' },
      ]}
      footer={insight}
    />
  )
}
