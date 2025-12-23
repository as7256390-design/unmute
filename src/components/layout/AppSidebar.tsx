import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageCircle, 
  Users, 
  Heart, 
  ClipboardList, 
  BarChart3, 
  Plus,
  BookHeart,
  MessageSquare,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Settings,
  HelpCircle,
  LogOut,
  TrendingUp,
  Wind,
  UserCheck,
  Target,
  Trophy,
  Calendar,
  GraduationCap,
  Moon,
  Building2,
  Gamepad2,
  HeartHandshake,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';

const mainNavItems = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, description: 'Talk to someone' },
  { id: 'brain-games', label: 'Brain Games', icon: Gamepad2, description: 'Train your mind', highlight: true },
  { id: 'support-rooms', label: 'Support Rooms', icon: Users, description: 'Join themed rooms' },
  { id: 'wall', label: 'Support Wall', icon: Heart, description: 'Anonymous sharing' },
  { id: 'journal', label: 'Journal', icon: BookHeart, description: 'Private reflection' },
  { id: 'dashboard', label: 'My Growth', icon: BarChart3, description: 'Track progress' },
];

const toolsNavItems = [
  { id: 'mood-tracker', label: 'Mood Tracker', icon: TrendingUp, description: 'Daily mood logs' },
  { id: 'wellness', label: 'Wellness Tools', icon: Wind, description: 'Breathing & more' },
  { id: 'programs', label: 'Guided Programs', icon: Target, description: 'Structured wellness' },
  { id: 'relaxation', label: 'Sleep & Relax', icon: Moon, description: 'Calm content' },
  { id: 'gamification', label: 'Achievements', icon: Trophy, description: 'Badges & XP' },
  { id: 'family-activities', label: 'Family Activities', icon: HeartHandshake, description: 'Bond with parents' },
  { id: 'alignment', label: 'Family Alignment', icon: UserCheck, description: 'Parent-child gap' },
  { id: 'assessments', label: 'Mental Health Check', icon: Sparkles, description: 'PHQ-9 & GAD-7' },
  { id: 'emotional-form', label: 'Emotional Profile', icon: ClipboardList, description: 'Deep self-assessment' },
];

const professionalNavItems = [
  { id: 'counselor', label: 'Book Counselor', icon: Calendar, description: 'Schedule session' },
  { id: 'training', label: 'Peer Training', icon: GraduationCap, description: 'Become a listener' },
  { id: 'institution', label: 'Institution', icon: Building2, description: 'Admin dashboard' },
];

export function AppSidebar() {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    currentView, 
    setCurrentView, 
    chats, 
    currentChat, 
    setCurrentChat, 
    createNewChat,
    userType,
    setUserType
  } = useApp();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const handleNewChat = () => {
    createNewChat();
    setCurrentView('chat');
    if (isMobile) setMobileMenuOpen(false);
  };

  const handleNavClick = (id: string) => {
    if (id === 'parent') {
      setUserType('parent');
      setCurrentView('parent');
    } else {
      setCurrentView(id as any);
    }
    if (isMobile) setMobileMenuOpen(false);
  };

  // Mobile: Bottom navigation + hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-sm border-b z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">Unmute</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-t z-40 flex items-center justify-around px-2 pb-safe">
          {mainNavItems.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]",
                currentView === item.id 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Full Screen Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 bg-background"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                    <Heart className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-display font-semibold text-lg">Menu</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-4rem)] pb-20">
                <div className="p-4 space-y-6">
                  {/* New Chat */}
                  <Button 
                    variant="gradient" 
                    className="w-full justify-start gap-2" 
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4" />
                    New Conversation
                  </Button>

                  {/* Main Navigation */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-2">Main</p>
                    {mainNavItems.map(item => (
                      <Button
                        key={item.id}
                        variant={currentView === item.id ? 'soft' : 'ghost'}
                        className="w-full justify-start gap-3 h-12"
                        onClick={() => handleNavClick(item.id)}
                      >
                        <item.icon className="h-5 w-5" />
                        <div className="flex flex-col items-start">
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      </Button>
                    ))}
                  </div>

                  {/* Tools */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-2">Tools</p>
                    {toolsNavItems.map(item => (
                      <Button
                        key={item.id}
                        variant={currentView === item.id ? 'soft' : 'ghost'}
                        className="w-full justify-start gap-3 h-12"
                        onClick={() => handleNavClick(item.id)}
                      >
                        <item.icon className="h-5 w-5" />
                        <div className="flex flex-col items-start">
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      </Button>
                    ))}
                  </div>

                  {/* Professional */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-2">Professional</p>
                    {professionalNavItems.map(item => (
                      <Button
                        key={item.id}
                        variant={currentView === item.id ? 'soft' : 'ghost'}
                        className="w-full justify-start gap-3 h-12"
                        onClick={() => handleNavClick(item.id)}
                      >
                        <item.icon className="h-5 w-5" />
                        <div className="flex flex-col items-start">
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      </Button>
                    ))}
                  </div>

                  {/* Parent Section */}
                  <Button
                    variant={userType === 'parent' ? 'secondary' : 'outline'}
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => handleNavClick('parent')}
                  >
                    <Users className="h-5 w-5" />
                    <div className="flex flex-col items-start">
                      <span>Parent Section</span>
                      <span className="text-xs text-muted-foreground">Family tools</span>
                    </div>
                  </Button>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2" 
                      onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2" 
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </>
    );
  }

  // Desktop: Collapsed sidebar
  if (!sidebarOpen) {
    return (
      <div className="fixed left-0 top-0 h-full w-14 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 z-50">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(true)}
          className="mb-4"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        
        <Button
          variant="gradient"
          size="icon"
          onClick={handleNewChat}
          className="mb-4"
        >
          <Plus className="h-5 w-5" />
        </Button>

        <Separator className="w-8 my-2" />

        <div className="flex flex-col gap-2">
          {mainNavItems.map(item => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'soft' : 'ghost'}
              size="icon"
              onClick={() => handleNavClick(item.id)}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>

        <Separator className="w-8 my-2" />

        <div className="flex flex-col gap-2">
          {toolsNavItems.map(item => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'soft' : 'ghost'}
              size="icon"
              onClick={() => handleNavClick(item.id)}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button
            variant={userType === 'parent' ? 'soft-secondary' : 'ghost'}
            size="icon"
            onClick={() => handleNavClick('parent')}
            title="Parent Section"
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: Expanded sidebar
  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg text-foreground">Unmute</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-2">
        <Button 
          variant="gradient" 
          className="w-full justify-start gap-2" 
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        {/* Main Navigation */}
        <div className="space-y-1 mb-4">
          <p className="text-xs font-medium text-muted-foreground px-2 py-2">Main</p>
          {mainNavItems.map(item => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'soft' : item.highlight ? 'outline' : 'ghost'}
              className={cn(
                "w-full justify-start gap-3 h-10",
                item.highlight && currentView !== item.id && "border-primary/50 bg-primary/5 hover:bg-primary/10"
              )}
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon className={cn("h-4 w-4", item.highlight && "text-primary")} />
              <span>{item.label}</span>
              {item.highlight && currentView !== item.id && (
                <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">NEW</span>
              )}
            </Button>
          ))}
        </div>

        {/* Tools */}
        <div className="space-y-1 mb-4">
          <p className="text-xs font-medium text-muted-foreground px-2 py-2">Tools</p>
          {toolsNavItems.map(item => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'soft' : 'ghost'}
              className="w-full justify-start gap-3 h-10"
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Professional */}
        <div className="space-y-1 mb-4">
          <p className="text-xs font-medium text-muted-foreground px-2 py-2">Professional</p>
          {professionalNavItems.map(item => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'soft' : 'ghost'}
              className="w-full justify-start gap-3 h-10"
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Recent Chats */}
        {chats.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 py-2">Recent</p>
            {chats.slice(0, 5).map(chat => (
              <Button
                key={chat.id}
                variant={currentChat?.id === chat.id ? 'soft' : 'ghost'}
                className="w-full justify-start gap-3 h-9 text-sm"
                onClick={() => {
                  setCurrentChat(chat);
                  setCurrentView('chat');
                }}
              >
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant={userType === 'parent' ? 'secondary' : 'ghost'}
          className="w-full justify-start gap-3 h-10 mb-2"
          onClick={() => handleNavClick('parent')}
        >
          <Users className="h-4 w-4" />
          <span>Parent Section</span>
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => toast.info('Help center coming soon!')}>
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
