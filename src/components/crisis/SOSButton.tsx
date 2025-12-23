import { useState } from 'react';
import { Phone, X, Heart, ExternalLink, MapPin, Bell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NearbyEmergencyHelp } from '@/components/emergency/NearbyEmergencyHelp';
import { ProximityAlertSettings } from '@/components/emergency/ProximityAlertSettings';
import { PanicMode } from '@/components/emergency/PanicMode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const emergencyResources = [
  { 
    name: 'iCall (India)', 
    number: '9152987821',
    hours: 'Mon-Sat, 8am-10pm',
    type: 'call'
  },
  { 
    name: 'Vandrevala Foundation', 
    number: '1860-2662-345',
    hours: '24/7',
    type: 'call'
  },
  { 
    name: 'AASRA', 
    number: '9820466726',
    hours: '24/7',
    type: 'call'
  },
  {
    name: 'Chat with Someone',
    number: '',
    hours: 'Always available',
    type: 'chat',
    url: 'https://www.yourdost.com'
  },
];

export function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('help');

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110",
          "bg-destructive text-destructive-foreground",
          "animate-pulse-soft"
        )}
        title="Emergency Help"
      >
        <Phone className="h-6 w-6" />
      </button>

      {/* SOS Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-xl flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                Need Help Right Now?
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="help" className="gap-1.5 text-xs sm:text-sm">
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">Get</span> Help
                </TabsTrigger>
                <TabsTrigger value="panic" className="gap-1.5 text-xs sm:text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Panic
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 text-xs sm:text-sm">
                  <Bell className="h-4 w-4" />
                  Alerts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="help" className="mt-0 space-y-4">
                <p className="text-muted-foreground text-sm">
                  You're not alone. These people are trained to listen and help. No judgment, just support.
                </p>

                {/* Nearby Emergency Help Button */}
                <div className="p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Find nearby help</span>
                    </div>
                    <NearbyEmergencyHelp />
                  </div>
                </div>

                <div className="space-y-3">
                  {emergencyResources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.type === 'call' ? `tel:${resource.number}` : resource.url}
                      target={resource.type === 'chat' ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="block glass rounded-xl p-4 hover:bg-card/90 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          {resource.number && (
                            <p className="text-primary font-mono">{resource.number}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{resource.hours}</p>
                        </div>
                        {resource.type === 'call' ? (
                          <Phone className="h-5 w-5 text-safe" />
                        ) : (
                          <ExternalLink className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </a>
                  ))}
                </div>

                <div className="p-4 bg-primary/10 rounded-xl">
                  <p className="text-sm text-center">
                    💙 It takes courage to reach out. We're proud of you for being here.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="panic" className="mt-0">
                <PanicMode />
              </TabsContent>

              <TabsContent value="alerts" className="mt-0">
                <ProximityAlertSettings />
              </TabsContent>
            </Tabs>

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}