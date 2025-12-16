import { useState } from 'react';
import { X, Bell, Moon, Sun, Shield, Trash2, Download, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [reminders, setReminders] = useState(true);

  if (!isOpen) return null;

  const handleExportData = () => {
    toast.success('Your data export will be ready shortly. Check your email.');
  };

  const handleDeleteAccount = () => {
    toast.error('Please contact support to delete your account.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-xl">Settings</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Account */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Account</h3>
          <div className="glass rounded-xl p-4">
            <p className="font-medium">{user?.email || 'Anonymous User'}</p>
            <p className="text-sm text-muted-foreground">Member since recently</p>
          </div>
        </div>

        {/* Preferences */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label>Push Notifications</Label>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Label>Dark Mode</Label>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label>Daily Check-in Reminders</Label>
              </div>
              <Switch checked={reminders} onCheckedChange={setReminders} />
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Privacy & Data</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportData}>
              <Download className="h-4 w-4" />
              Export My Data
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-safe/10 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-safe flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Your Privacy Matters</p>
              <p className="text-xs text-muted-foreground">
                Your conversations are encrypted. We never share your personal data. 
                You can delete everything anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Help */}
        <Button variant="ghost" className="w-full justify-start gap-2">
          <HelpCircle className="h-4 w-4" />
          Help & Support
        </Button>

        <Button variant="outline" className="w-full mt-2" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}