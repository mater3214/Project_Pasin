export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Hero' | 'Radiant';

export interface RankInfo {
  tier: RankTier;
  label: string;
  labelTh: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  icon: string;
  minPoints: number;
  maxPoints: number; // -1 for Radiant (unlimited)
  progress: number;  // 0-100 progress to next tier
}

const RANK_TIERS: { tier: RankTier; label: string; labelTh: string; min: number; max: number; color: string; bgColor: string; borderColor: string; glowColor: string; icon: string }[] = [
  { tier: 'Bronze',   label: 'Bronze',   labelTh: 'บรอนซ์',     min: 0,     max: 100,   color: '#CD7F32', bgColor: 'rgba(205,127,50,0.15)',  borderColor: 'rgba(205,127,50,0.4)', glowColor: 'rgba(205,127,50,0.3)',  icon: '🥉' },
  { tier: 'Silver',   label: 'Silver',   labelTh: 'ซิลเวอร์',   min: 101,   max: 500,   color: '#A8A9AD', bgColor: 'rgba(168,169,173,0.15)', borderColor: 'rgba(168,169,173,0.4)', glowColor: 'rgba(168,169,173,0.3)', icon: '🥈' },
  { tier: 'Gold',     label: 'Gold',     labelTh: 'โกลด์',       min: 501,   max: 1000,  color: '#FFD700', bgColor: 'rgba(255,215,0,0.15)',   borderColor: 'rgba(255,215,0,0.4)',  glowColor: 'rgba(255,215,0,0.3)',   icon: '🥇' },
  { tier: 'Platinum', label: 'Platinum', labelTh: 'แพลตินัม',   min: 1001,  max: 2500,  color: '#3B82F6', bgColor: 'rgba(59,130,246,0.15)',  borderColor: 'rgba(59,130,246,0.4)', glowColor: 'rgba(59,130,246,0.3)',  icon: '💠' },
  { tier: 'Diamond',  label: 'Diamond',  labelTh: 'ไดมอนด์',    min: 2501,  max: 5000,  color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.15)',  borderColor: 'rgba(139,92,246,0.4)', glowColor: 'rgba(139,92,246,0.3)',  icon: '💎' },
  { tier: 'Hero',     label: 'Hero',     labelTh: 'ฮีโร่',       min: 5001,  max: 10000, color: '#F97316', bgColor: 'rgba(249,115,22,0.15)',  borderColor: 'rgba(249,115,22,0.4)', glowColor: 'rgba(249,115,22,0.3)',  icon: '🦸' },
  { tier: 'Radiant',  label: 'Radiant',  labelTh: 'เรเดียนท์',  min: 10001, max: -1,    color: '#FBBF24', bgColor: 'rgba(251,191,36,0.15)',  borderColor: 'rgba(251,191,36,0.4)', glowColor: 'rgba(251,191,36,0.4)',  icon: '✨' },
];

export function getRankInfo(points: number): RankInfo {
  let matched = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (points >= t.min) matched = t;
  }

  const nextTier = RANK_TIERS[RANK_TIERS.indexOf(matched) + 1];
  let progress = 100;
  if (nextTier) {
    const range = nextTier.min - matched.min;
    const current = points - matched.min;
    progress = Math.min(100, Math.round((current / range) * 100));
  }

  return {
    tier: matched.tier,
    label: matched.label,
    labelTh: matched.labelTh,
    color: matched.color,
    bgColor: matched.bgColor,
    borderColor: matched.borderColor,
    glowColor: matched.glowColor,
    icon: matched.icon,
    minPoints: matched.min,
    maxPoints: matched.max,
    progress,
  };
}

export function getNextRankPoints(points: number): number | null {
  const info = getRankInfo(points);
  const idx = RANK_TIERS.findIndex((t) => t.tier === info.tier);
  const next = RANK_TIERS[idx + 1];
  return next ? next.min : null;
}

export function getAllRankTiers() {
  return RANK_TIERS.map((t) => ({
    tier: t.tier,
    label: t.label,
    labelTh: t.labelTh,
    icon: t.icon,
    color: t.color,
    min: t.min,
    max: t.max,
  }));
}
