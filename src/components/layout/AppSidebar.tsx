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
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const mainNavItems = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, description: 'Talk to someone' },
  { id: 'support-rooms', label: 'Support Rooms', icon: Users, description: 'Join themed rooms' },
  { id: 'wall', label: 'Support Wall', icon: Heart, description: 'Anonymous sharing' },
  { id: 'journal', label: 'Journal', icon: BookHeart, description: 'Private reflection' },
  { id: 'dashboard', label: 'My Growth', icon: BarChart3, description: 'Track progress' },
];

const toolsNavItems = [
  { id: 'emotional-form', label: 'Emotional Profile', icon: ClipboardList, description: 'Deep self-assessment' },
  { id: 'assessments', label: 'Mental Health Check', icon: Sparkles, description: 'PHQ-9 & GAD-7' },
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

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const handleNewChat = () => {
    createNewChat();
    setCurrentView('chat');
  };

  const handleNavClick = (id: string) => {
    if (id === 'parent') {
      setUserType('parent');
      setCurrentView('parent');
    } else {
      setCurrentView(id as any);
    }
  };

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
              variant={currentView === item.id ? 'soft' : 'ghost'}
              className="w-full justify-start gap-3 h-10"
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
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
          <Button variant="ghost" size="icon-sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
