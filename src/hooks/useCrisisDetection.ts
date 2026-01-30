import { useCallback } from 'react';
import { detectCrisis, CrisisDetectionResult } from '@/lib/crisisDetection';
import { detectSuicideRoadmapStage, RoadmapDetectionResult } from '@/lib/suicideRoadmapDetection';

export interface ComprehensiveCrisisResult {
  basicCrisis: CrisisDetectionResult;
  roadmapResult: RoadmapDetectionResult;
  requiresAutomatedResponse: boolean;
  triggerEmergencyDial: boolean;
  triggerNotifications: boolean;
}

export function useCrisisDetection() {
  const analyzeMessage = useCallback((content: string): ComprehensiveCrisisResult => {
    // Run both detection systems
    const basicCrisis = detectCrisis(content);
    const roadmapResult = detectSuicideRoadmapStage(content);

    // Determine if automated response is needed
    const requiresAutomatedResponse = 
      basicCrisis.severity === 'critical' ||
      roadmapResult.requiresImmediateIntervention ||
      roadmapResult.stage === 'action' ||
      roadmapResult.stage === 'planning' ||
      roadmapResult.stage === 'ideation';

    // Trigger emergency dial for most severe cases
    const triggerEmergencyDial =
      roadmapResult.stage === 'action' ||
      (roadmapResult.stage === 'planning' && roadmapResult.severity === 'critical');

    // Trigger notifications for high/critical severity
    const triggerNotifications =
      basicCrisis.severity === 'critical' ||
      basicCrisis.severity === 'high' ||
      roadmapResult.severity === 'critical' ||
      roadmapResult.severity === 'high';

    return {
      basicCrisis,
      roadmapResult,
      requiresAutomatedResponse,
      triggerEmergencyDial,
      triggerNotifications,
    };
  }, []);

  return { analyzeMessage };
}
