import React from 'react';
import { Bell, BellOff, MapPin, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProximityAlerts } from '@/hooks/useProximityAlerts';

export function ProximityAlertSettings() {
  const {
    isMonitoring,
    settings,
    permissionStatus,
    toggleMonitoring,
    updateAlertRadius,
    clearAlertHistory,
  } = useProximityAlerts();

  const radiusOptions = [
    { value: 250, label: '250m' },
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-red-500" />
          Proximity Alerts
        </CardTitle>
        <CardDescription>
          Get notified when you're near hospitals, pharmacies, or emergency services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMonitoring ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isMonitoring ? 'Alerts Active' : 'Alerts Disabled'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isMonitoring 
                  ? 'Monitoring your location for nearby services' 
                  : 'Enable to receive proximity notifications'}
              </p>
            </div>
          </div>
          <Switch
            checked={isMonitoring}
            onCheckedChange={toggleMonitoring}
          />
        </div>

        {/* Permission Status */}
        {permissionStatus === 'denied' && (
          <Alert variant="destructive">
            <AlertDescription>
              Notification permission was denied. Please enable notifications in your browser settings to use this feature.
            </AlertDescription>
          </Alert>
        )}

        {/* Alert Radius */}
        {isMonitoring && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Alert Radius</p>
                <Badge variant="secondary">
                  {settings.alertRadius >= 1000 
                    ? `${settings.alertRadius / 1000}km` 
                    : `${settings.alertRadius}m`}
                </Badge>
              </div>
              <div className="flex gap-2">
                {radiusOptions.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={settings.alertRadius === option.value ? 'default' : 'outline'}
                    onClick={() => updateAlertRadius(option.value)}
                    className="flex-1"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Alert History */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-sm font-medium">Alert History</p>
                <p className="text-xs text-muted-foreground">
                  {settings.alertedLocations.length} location{settings.alertedLocations.length !== 1 ? 's' : ''} alerted
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAlertHistory}
                disabled={settings.alertedLocations.length === 0}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>

            {/* Info */}
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Alerts are based on cached emergency locations. Open "Nearby Help" first to cache locations in your area.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
