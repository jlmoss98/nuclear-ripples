import type { StrategicControls } from '../model'

export interface Option<T extends string | number> {
  value: T
  label: string
  note?: string
}

export interface ControlDefinition<K extends keyof StrategicControls = keyof StrategicControls> {
  key: K
  label: string
  question: string
  options: Option<StrategicControls[K]>[]
  visibleWhen?: (controls: StrategicControls) => boolean
  followUp?: boolean
  note?: string
}

export const CONTROL_GROUPS: Array<{ title: string; controls: ControlDefinition[] }> = [
  {
    title: 'Crisis conditions',
    controls: [
      { key: 'taiwanCrisis', label: 'Taiwan Strait', question: 'What is happening across the Strait?', options: [
        { value: 'none', label: 'No active crisis' }, { value: 'blockade', label: 'Blockade' }, { value: 'open-conflict', label: 'Open conflict' },
      ] },
      {
        key: 'taiwanConflictOutcome',
        label: 'Open-conflict outcome',
        question: 'How does the conflict develop?',
        options: [
          { value: 'off-ramp', label: 'Face-saving off-ramp' },
          { value: 'decisive-setback', label: 'Defeat or CCP-legitimacy threat' },
        ],
        visibleWhen: ({ taiwanCrisis }) => taiwanCrisis === 'open-conflict',
        followUp: true,
      },
      {
        key: 'chinaLowYieldOptions',
        label: 'Chinese low-yield nuclear options',
        question: 'Are lower-yield options available in this scenario?',
        options: [
          { value: 'not-specified', label: 'Not specified' },
          { value: 'available', label: 'Available' },
        ],
        visibleWhen: ({ taiwanCrisis }) => taiwanCrisis === 'open-conflict',
        followUp: true,
        note: 'Informational only · changes explanation, not scores or proliferation pressure.',
      },
      { key: 'koreanCrisis', label: 'Korean Peninsula', question: 'How severe is the peninsula crisis?', options: [
        { value: 'none', label: 'No active crisis' }, { value: 'limited', label: 'Limited clash' }, { value: 'major', label: 'Major conflict' },
      ] },
    ],
  },
  {
    title: 'U.S. alliance posture',
    controls: [
      { key: 'assurance', label: 'Extended deterrence', question: 'How credible is U.S. assurance?', options: [
        { value: 'strengthened', label: 'Strengthened' }, { value: 'baseline', label: 'July 2026' }, { value: 'questioned', label: 'Questioned' }, { value: 'withdrawn', label: 'Withdrawn' },
      ] },
      { key: 'conventionalPresence', label: 'Conventional presence', question: 'How has U.S. conventional presence changed?', options: [
        { value: 'reduced', label: 'Reduced' }, { value: 'baseline', label: 'July 2026' }, { value: 'expanded', label: 'Expanded' },
      ] },
    ],
  },
  {
    title: 'Regional capabilities',
    controls: [
      { key: 'rokMissileDefense', label: 'South Korean missile defense', question: 'How far has missile defense expanded?', options: [
        { value: 0, label: 'July 2026' }, { value: 1, label: 'Level 1' }, { value: 2, label: 'Level 2' },
      ] },
      { key: 'japanCounterstrike', label: 'Japanese counterstrike', question: 'How far has counterstrike capability expanded?', options: [
        { value: 0, label: 'July 2026' }, { value: 1, label: 'Level 1' }, { value: 2, label: 'Level 2' },
      ] },
      { key: 'japanRokCooperation', label: 'Japan–ROK cooperation', question: 'How closely are Japan and South Korea coordinating?', options: [
        { value: 'degraded', label: 'Degraded' }, { value: 'baseline', label: 'July 2026' }, { value: 'integrated', label: 'Integrated' },
      ] },
    ],
  },
  {
    title: 'Doctrine and politics',
    controls: [
      { key: 'chinaDoctrine', label: 'Chinese nuclear doctrine', question: 'What doctrine is modeled?', options: [
        { value: 'baseline', label: 'July 2026' }, { value: 'launch-on-warning', label: 'Launch on warning' }, { value: 'first-use-ambiguity', label: 'First-use ambiguity' },
      ] },
      { key: 'aseanCohesion', label: 'ASEAN nuclear-free zone', question: 'How cohesive is the regional nuclear-free zone?', options: [
        { value: 'intact', label: 'Intact' }, { value: 'weakened', label: 'Weakened' }, { value: 'broken', label: 'Broken' },
      ] },
      { key: 'rokDomestic', label: 'South Korean governing party', question: 'What is the governing-party position?', options: [
        { value: 'none', label: 'No formal shift' }, { value: 'review', label: 'Review' }, { value: 'support', label: 'Supports arsenal' },
      ] },
      { key: 'japanDomestic', label: 'Japanese governing party', question: 'What is the governing-party position?', options: [
        { value: 'none', label: 'No formal shift' }, { value: 'review', label: 'Review' }, { value: 'support', label: 'Supports arsenal' },
      ] },
    ],
  },
]
