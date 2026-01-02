// Suicide Roadmap Detection based on research paper's 8-stage progression model
// Trigger → Spiral → Distortions → Isolation → Ideation → Planning → Action

export type SuicideRoadmapStage = 
  | 'trigger' 
  | 'spiral' 
  | 'distortions' 
  | 'isolation' 
  | 'ideation' 
  | 'planning' 
  | 'action';

export interface RoadmapDetectionResult {
  detected: boolean;
  stage: SuicideRoadmapStage | null;
  stageNumber: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  requiresImmediateIntervention: boolean;
  recommendedAction: 'self_help' | 'peer_support' | 'counsellor' | 'emergency';
}

// Stage 1: Trigger - Failure, breakup, bullying, financial stress → shame
const TRIGGER_PATTERNS = [
  /\b(fail(ed|ure|ing)?)\b/i,
  /\b(broke\s*up|breakup|broken\s*heart)\b/i,
  /\b(bully|bullied|bullying)\b/i,
  /\b(financial\s*(stress|problem|issue|crisis))\b/i,
  /\b(ashamed|shame|embarrass(ed|ing)?)\b/i,
  /\b(reject(ed|ion)?)\b/i,
  /\b(humiliat(ed|ion|ing))\b/i,
  /\b(disappoint(ed|ment|ing)?)\b/i,
  /\b(lost\s*(job|money|everything))\b/i,
];

// Stage 2: Spiral - Negative thought loops
const SPIRAL_PATTERNS = [
  /\b(i['']?m\s+a\s+failure)\b/i,
  /\b(nobody\s+(understands?|cares?|loves?))\b/i,
  /\b(everyone\s+(hates?|leaves?))\b/i,
  /\b(nothing\s+(works?|matters?))\b/i,
  /\b(always\s+(fail|mess\s*up|wrong))\b/i,
  /\b(never\s+(good\s*enough|succeed|right))\b/i,
  /\b(what['']?s\s+(wrong\s+with\s+me|the\s+point))\b/i,
  /\b(i['']?m\s+(stupid|useless|pathetic))\b/i,
  /\b(can['']?t\s+do\s+anything\s+right)\b/i,
];

// Stage 3: Distortions - Catastrophizing, personalization, all-or-nothing
const DISTORTION_PATTERNS = [
  /\b(everything\s+is\s+(ruined|over|destroyed))\b/i,
  /\b(my\s+(fault|mistake))\b/i,
  /\b(all\s+my\s+fault)\b/i,
  /\b(worst\s+(thing|case|scenario))\b/i,
  /\b(complete(ly)?\s+(fail(ure)?|disaster))\b/i,
  /\b(never\s+(recover|get\s+better|change))\b/i,
  /\b(always\s+(bad|wrong|failing))\b/i,
  /\b(everyone\s+will\s+(hate|leave|abandon))\b/i,
  /\b(ruined\s+(my\s+)?(life|future|everything))\b/i,
  /\b(no\s+(way\s+out|options?|choice))\b/i,
];

// Stage 4: Emotional Overload - Fear → helplessness → hopelessness
const OVERLOAD_PATTERNS = [
  /\b(can['']?t\s+(take|handle|bear)\s+(it|this|anymore))\b/i,
  /\b(overwhelm(ed|ing)?)\b/i,
  /\b(breaking\s*(down|apart))\b/i,
  /\b(falling\s*apart)\b/i,
  /\b(helpless|powerless)\b/i,
  /\b(hopeless|no\s+hope)\b/i,
  /\b(trapped|stuck|cornered)\b/i,
  /\b(drowning(\s+in)?)\b/i,
  /\b(suffocating)\b/i,
  /\b(too\s+much\s+(to\s+handle|for\s+me))\b/i,
];

// Stage 5: Isolation - Withdrawal from activities and peers
const ISOLATION_PATTERNS = [
  /\b(alone|lonely|isolated)\b/i,
  /\b(no\s+(one|friends?|family))\b/i,
  /\b(push(ing)?\s+(everyone|people)\s+away)\b/i,
  /\b(withdraw(n|ing)?)\b/i,
  /\b(don['']?t\s+want\s+to\s+(see|talk|meet)\s+(anyone|people))\b/i,
  /\b(stay(ing)?\s+(in|home|alone))\b/i,
  /\b(avoid(ing)?\s+(everyone|people|friends))\b/i,
  /\b(cut(ting)?\s+(off|out)\s+(everyone|people|friends))\b/i,
  /\b(nobody\s+(would\s+)?miss\s+me)\b/i,
  /\b(better\s+off\s+without\s+me)\b/i,
];

// Stage 6: Ideation - Suicide seen as escape
const IDEATION_PATTERNS = [
  /\b(want(ing)?\s+to\s+die)\b/i,
  /\b(wish\s+i\s+(was\s+dead|wasn['']?t\s+(alive|here|born)))\b/i,
  /\b(death\s+(seems?|sounds?|would\s+be)\s+(easier|better|peaceful))\b/i,
  /\b(suicid(e|al))\b/i,
  /\b(end(ing)?\s+(it|my\s+life|everything))\b/i,
  /\b(no\s+(reason|point)\s+to\s+(live|continue|go\s+on))\b/i,
  /\b(thinking\s+about\s+(death|dying|ending))\b/i,
  /\b(life\s+(is\s+)?not\s+worth)\b/i,
  /\b(escape\s+(from\s+)?(this|life|pain))\b/i,
];

// Stage 7: Planning - Researching methods, writing notes
const PLANNING_PATTERNS = [
  /\b(how\s+to\s+(kill|end|die|suicide))\b/i,
  /\b(method(s)?\s+(to|of|for)\s+(die|death|suicide))\b/i,
  /\b(writing\s+(notes?|letters?|goodbye))\b/i,
  /\b(giving\s+(away|out)\s+(stuff|things|belongings|possessions))\b/i,
  /\b(saying\s+goodbye)\b/i,
  /\b(final\s+(message|note|letter|words))\b/i,
  /\b(set\s+(a\s+)?date)\b/i,
  /\b(pills?|overdose|hanging|jump(ing)?)\b/i,
  /\b(made\s+(up\s+)?my\s+mind)\b/i,
  /\b(decided\s+to\s+(end|die))\b/i,
];

// Stage 8: Action - Attempt in progress
const ACTION_PATTERNS = [
  /\b(i['']?m\s+(going\s+to|about\s+to)\s+(do\s+it|end\s+it|die|kill))\b/i,
  /\b(this\s+is\s+(it|goodbye|the\s+end))\b/i,
  /\b(already\s+(took|swallowed|cut))\b/i,
  /\b(can['']?t\s+stop\s+myself)\b/i,
  /\b(doing\s+it\s+(now|tonight|today))\b/i,
  /\b(no\s+turning\s+back)\b/i,
  /\b(final(ly)?\s+(doing\s+it|ending))\b/i,
  /\b(bleeding|overdos(ed|ing))\b/i,
  /\b(on\s+the\s+(edge|ledge|bridge|roof))\b/i,
];

const STAGE_CONFIG: Record<SuicideRoadmapStage, {
  patterns: RegExp[];
  number: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'self_help' | 'peer_support' | 'counsellor' | 'emergency';
  immediate: boolean;
}> = {
  trigger: { patterns: TRIGGER_PATTERNS, number: 1, severity: 'low', action: 'self_help', immediate: false },
  spiral: { patterns: SPIRAL_PATTERNS, number: 2, severity: 'medium', action: 'peer_support', immediate: false },
  distortions: { patterns: DISTORTION_PATTERNS, number: 3, severity: 'medium', action: 'peer_support', immediate: false },
  isolation: { patterns: OVERLOAD_PATTERNS.concat(ISOLATION_PATTERNS), number: 4, severity: 'high', action: 'counsellor', immediate: false },
  ideation: { patterns: IDEATION_PATTERNS, number: 5, severity: 'high', action: 'counsellor', immediate: true },
  planning: { patterns: PLANNING_PATTERNS, number: 6, severity: 'critical', action: 'emergency', immediate: true },
  action: { patterns: ACTION_PATTERNS, number: 7, severity: 'critical', action: 'emergency', immediate: true },
};

export function detectSuicideRoadmapStage(content: string): RoadmapDetectionResult {
  const indicators: string[] = [];
  let highestStage: SuicideRoadmapStage | null = null;
  let highestStageNumber = 0;

  // Check from most severe to least severe
  const stagePriority: SuicideRoadmapStage[] = [
    'action', 'planning', 'ideation', 'isolation', 'distortions', 'spiral', 'trigger'
  ];

  for (const stage of stagePriority) {
    const config = STAGE_CONFIG[stage];
    for (const pattern of config.patterns) {
      const match = content.match(pattern);
      if (match) {
        indicators.push(match[0]);
        if (config.number > highestStageNumber) {
          highestStageNumber = config.number;
          highestStage = stage;
        }
      }
    }
  }

  if (!highestStage) {
    return {
      detected: false,
      stage: null,
      stageNumber: 0,
      severity: 'low',
      indicators: [],
      requiresImmediateIntervention: false,
      recommendedAction: 'self_help',
    };
  }

  const config = STAGE_CONFIG[highestStage];

  return {
    detected: true,
    stage: highestStage,
    stageNumber: config.number,
    severity: config.severity,
    indicators: [...new Set(indicators)],
    requiresImmediateIntervention: config.immediate,
    recommendedAction: config.action,
  };
}

export function getStageName(stage: SuicideRoadmapStage): string {
  const names: Record<SuicideRoadmapStage, string> = {
    trigger: 'Trigger Event',
    spiral: 'Negative Spiral',
    distortions: 'Cognitive Distortions',
    isolation: 'Emotional Overload & Isolation',
    ideation: 'Suicidal Ideation',
    planning: 'Active Planning',
    action: 'Imminent Action',
  };
  return names[stage];
}

export function getStageDescription(stage: SuicideRoadmapStage): string {
  const descriptions: Record<SuicideRoadmapStage, string> = {
    trigger: 'A triggering event like failure, rejection, or trauma has occurred',
    spiral: 'Negative thought patterns are forming and building',
    distortions: 'Thinking patterns are becoming distorted and catastrophic',
    isolation: 'Withdrawal from support systems and emotional overload',
    ideation: 'Thoughts of ending life are present',
    planning: 'Active planning or preparation is occurring',
    action: 'Immediate intervention required - attempt may be imminent',
  };
  return descriptions[stage];
}

export function getInterventionGuidance(stage: SuicideRoadmapStage): string[] {
  const guidance: Record<SuicideRoadmapStage, string[]> = {
    trigger: [
      'Acknowledge the difficult situation',
      'Offer wellness tools like breathing exercises',
      'Encourage journaling to process feelings',
      'Suggest connecting with support rooms',
    ],
    spiral: [
      'Validate feelings without reinforcing negative thoughts',
      'Gently challenge negative self-talk',
      'Connect with peer listeners',
      'Recommend cognitive exercises',
    ],
    distortions: [
      'Help identify cognitive distortions',
      'Offer CBT-based exercises',
      'Connect with trained peer listener',
      'Consider counsellor referral',
    ],
    isolation: [
      'Urgent peer listener connection needed',
      'Recommend counsellor session',
      'Monitor closely for escalation',
      'Alert support network if consented',
    ],
    ideation: [
      'Immediate counsellor referral required',
      'Show crisis resources prominently',
      'Stay engaged until help is connected',
      'Create safety plan together',
    ],
    planning: [
      'EMERGENCY: Connect to crisis helpline immediately',
      'Do not leave person alone if possible',
      'Alert emergency contacts',
      'Professional intervention critical',
    ],
    action: [
      'CALL EMERGENCY SERVICES IMMEDIATELY',
      'Stay on the line with the person',
      'Keep them talking until help arrives',
      'Do not hang up or leave',
    ],
  };
  return guidance[stage];
}
