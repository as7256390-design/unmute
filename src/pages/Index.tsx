import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
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
import { SOSButton } from '@/components/crisis/SOSButton';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { currentView, userType } = useApp();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

  // Show onboarding for new users
  if (currentView === 'onboarding' && !userType) {
    return <OnboardingScreen />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface />;
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
        return <MoodTracker />;
      case 'wellness':
        return <WellnessTools />;
      case 'alignment':
        return <AlignmentDashboard />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <MainLayout>
      <div className="h-screen overflow-y-auto">
        {renderContent()}
      </div>
      <SOSButton />
    </MainLayout>
  );
};

export default Index;
