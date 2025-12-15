import { AlertTriangle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CRISIS_RESOURCES } from '@/lib/crisisDetection';

interface CrisisResourcesBannerProps {
  isAbuse?: boolean;
  onDismiss: () => void;
}

export function CrisisResourcesBanner({ isAbuse, onDismiss }: CrisisResourcesBannerProps) {
  const resources = isAbuse 
    ? [CRISIS_RESOURCES.abuse, CRISIS_RESOURCES.women]
    : [CRISIS_RESOURCES.suicide, CRISIS_RESOURCES.india];

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-medium text-sm">You're not alone. Help is available.</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              If you're in crisis, please reach out to these resources:
            </p>
            <div className="space-y-2">
              {resources.map((resource) => (
                <a
                  key={resource.phone}
                  href={`tel:${resource.phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-medium">{resource.name}:</span>
                  <span className="text-primary group-hover:underline">{resource.phone}</span>
                  <span className="text-muted-foreground">- {resource.description}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
