import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/contexts/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { EmotionalProfileForm } from '@/components/forms/EmotionalProfileForm';
import { AssessmentHub } from '@/components/forms/AssessmentHub';
import { SupportRooms } from '@/components/support/SupportRooms';
import { SupportWall } from '@/components/support/SupportWall';
import { Journal } from '@/components/journal/Journal';
import { GrowthDashboard } from '@/components/dashboard/GrowthDashboard';
import { ParentInterface } from '@/components/parent/ParentInterface';
import { MoodTracker } from '@/components/wellness/MoodTracker';
import { WellnessTools } from '@/components/wellness/WellnessTools';
import { AlignmentDashboard } from '@/components/dashboard/AlignmentDashboard';
import { GuidedPrograms } from '@/components/programs/GuidedPrograms';
import { GamificationHub } from '@/components/gamification/GamificationHub';
import { CounselorBooking } from '@/components/counselor/CounselorBooking';
import { PeerListenerTraining } from '@/components/training/PeerListenerTraining';
import { RelaxationContent } from '@/components/relaxation/RelaxationContent';
import { InstitutionDashboard } from '@/components/institution/InstitutionDashboard';
import { BrainGamesHub } from '@/components/games/BrainGamesHub';
import { ChildSharedActivities } from '@/components/child/ChildSharedActivities';
import { ListenerCounsellorPortal } from '@/components/portal/ListenerCounsellorPortal';
import { SOSButton } from '@/components/crisis/SOSButton';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

const Index = () => {
  const { currentView, userType } = useApp();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth immediately if no user and not loading
  if (!loading && !user) {
    navigate('/auth', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (currentView === 'onboarding' && !userType) {
    return <OnboardingScreen />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface />;
      case 'brain-games':
        return <BrainGamesHub />;
      case 'emotional-form':
        return <EmotionalProfileForm />;
      case 'assessments':
      case 'phq9':
        return <AssessmentHub />;
      case 'support-rooms':
        return <SupportRooms />;
      case 'wall':
        return <SupportWall />;
      case 'journal':
        return <Journal />;
      case 'dashboard':
        return <GrowthDashboard />;
      case 'parent':
        return <ParentInterface />;
      case 'mood-tracker':
      case 'mood':
        return <MoodTracker />;
      case 'wellness':
        return <WellnessTools />;
      case 'alignment':
        return <AlignmentDashboard />;
      case 'programs':
        return <GuidedPrograms />;
      case 'gamification':
        return <GamificationHub />;
      case 'counselor':
        return <CounselorBooking />;
      case 'training':
        return <PeerListenerTraining />;
      case 'relaxation':
        return <RelaxationContent />;
      case 'institution':
        return <InstitutionDashboard />;
      case 'family-activities':
        return <ChildSharedActivities />;
      case 'listener-portal':
      case 'counsellor-portal':
        return <ListenerCounsellorPortal />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <MainLayout>
      <div className="h-screen overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
        {renderContent()}
      </div>
      <SOSButton />
      <InstallPrompt />
    </MainLayout>
  );
};

export default Index;
