// Crisis detection keywords and patterns
import { detectSuicideRoadmapStage, RoadmapDetectionResult, SuicideRoadmapStage } from './suicideRoadmapDetection';

export { detectSuicideRoadmapStage, type RoadmapDetectionResult, type SuicideRoadmapStage };

const CRISIS_PATTERNS = {
  critical: [
    /\b(kill|end)\s*(myself|my life)\b/i,
    /\bsuicid(e|al)\b/i,
    /\bwant(ing)?\s*to\s*die\b/i,
    /\bend(ing)?\s*it\s*all\b/i,
    /\bno\s*reason\s*to\s*live\b/i,
    /\bself[\s-]?harm\b/i,
    /\bcut(ting)?\s*(myself|my)\b/i,
  ],
  high: [
    /\b(hate|despise)\s*myself\b/i,
    /\bworthless\b/i,
    /\bburden\s*to\b/i,
    /\bno\s*one\s*(cares|would\s*miss)\b/i,
    /\bhopeless\b/i,
    /\bgive\s*up\b/i,
    /\bcan'?t\s*(go\s*on|take\s*(it|this))\b/i,
  ],
  medium: [
    /\bdepressed\b/i,
    /\banxi(ety|ous)\b/i,
    /\bpanic\s*attack\b/i,
    /\bbreakdown\b/i,
    /\boverwhelm(ed|ing)\b/i,
    /\bcan'?t\s*cope\b/i,
    /\b(feeling|feel)\s*(alone|isolated|empty)\b/i,
  ],
  low: [
    /\bstress(ed)?\b/i,
    /\bsad\b/i,
    /\blonely\b/i,
    /\bscared\b/i,
    /\bworried\b/i,
  ],
};

const ABUSE_PATTERNS = [
  /\b(abuse|abused|abusing)\b/i,
  /\b(hit|hits|hitting|beat|beats|beating)\s*me\b/i,
  /\bdomestic\s*violence\b/i,
  /\bsexual\s*(assault|abuse|harassment)\b/i,
  /\brape[d]?\b/i,
  /\btouch(ed|ing)?\s*me\s*(inappropriate|wrong)\b/i,
];

export type CrisisSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: CrisisSeverity;
  matchedKeywords: string[];
  isAbuse: boolean;
  showResources: boolean;
}

export function detectCrisis(content: string): CrisisDetectionResult {
  const matchedKeywords: string[] = [];
  let severity: CrisisSeverity = 'low';
  let isAbuse = false;
  let foundCritical = false;
  let foundHigh = false;

  // Check for abuse patterns
  for (const pattern of ABUSE_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      isAbuse = true;
      matchedKeywords.push(match[0]);
      foundHigh = true;
    }
  }

  // Check crisis patterns from critical to low
  for (const pattern of CRISIS_PATTERNS.critical) {
    const match = content.match(pattern);
    if (match) {
      matchedKeywords.push(match[0]);
      foundCritical = true;
    }
  }

  if (!foundCritical) {
    for (const pattern of CRISIS_PATTERNS.high) {
      const match = content.match(pattern);
      if (match) {
        matchedKeywords.push(match[0]);
        foundHigh = true;
      }
    }
  }

  if (!foundCritical && !foundHigh) {
    for (const pattern of CRISIS_PATTERNS.medium) {
      const match = content.match(pattern);
      if (match) {
        matchedKeywords.push(match[0]);
        severity = 'medium';
      }
    }
  }

  // Determine final severity
  if (foundCritical) severity = 'critical';
  else if (foundHigh) severity = 'high';

  const isCrisis = matchedKeywords.length > 0;
  const showResources = severity === 'critical' || severity === 'high' || isAbuse;

  return {
    isCrisis,
    severity,
    matchedKeywords: [...new Set(matchedKeywords)],
    isAbuse,
    showResources,
  };
}

export const CRISIS_RESOURCES = {
  india: {
    name: 'iCall',
    phone: '9152987821',
    description: 'Professional counseling support',
  },
  suicide: {
    name: 'AASRA',
    phone: '9820466726',
    description: '24/7 suicide prevention helpline',
  },
  abuse: {
    name: 'Childline India',
    phone: '1098',
    description: 'For children facing abuse or violence',
  },
  women: {
    name: 'Women Helpline',
    phone: '181',
    description: 'National Commission for Women',
  },
};
