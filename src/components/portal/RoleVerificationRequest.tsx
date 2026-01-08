import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Send, 
  CheckCircle,
  AlertCircle,
  Shield,
  Headphones,
  Stethoscope
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Institution {
  id: string;
  name: string;
  code: string;
}

interface RoleVerificationRequestProps {
  requestedRole: 'listener' | 'counsellor';
}

export function RoleVerificationRequest({ requestedRole }: RoleVerificationRequestProps) {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ status: string; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkExistingRequest();
      loadInstitutions();
    }
  }, [user]);

  const checkExistingRequest = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_roles')
        .select('is_verified, created_at')
        .eq('user_id', user.id)
        .eq('role', requestedRole)
        .single();

      if (data) {
        setExistingRequest({
          status: data.is_verified ? 'approved' : 'pending',
          created_at: data.created_at
        });
      }
    } catch (err) {
      // No existing request
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutions = async () => {
    try {
      const { data } = await supabase
        .from('institutions')
        .select('id, name, code')
        .order('name');
      
      setInstitutions(data || []);
    } catch (err) {
      console.error('Error loading institutions:', err);
    }
  };

  const submitRequest = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (!selectedInstitution && !institutionCode) {
      toast.error('Please select or enter an institution');
      return;
    }

    setSubmitting(true);
    try {
      let institutionId = selectedInstitution;

      // If using code, find institution
      if (!institutionId && institutionCode) {
        const { data: inst } = await supabase
          .from('institutions')
          .select('id')
          .eq('code', institutionCode.toUpperCase())
          .single();

        if (!inst) {
          toast.error('Invalid institution code');
          setSubmitting(false);
          return;
        }
        institutionId = inst.id;
      }

      // Create the role request (unverified)
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: requestedRole,
          institution_id: institutionId,
          is_verified: false
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a pending request for this role');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Verification request submitted! An admin will review it soon.');
      setExistingRequest({
        status: 'pending',
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error submitting request:', err);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Already has a request
  if (existingRequest) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          {existingRequest.status === 'approved' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-safe/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-safe" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verification Approved!</h3>
              <p className="text-muted-foreground">
                Your {requestedRole} role has been verified. You can now access all portal features.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verification Pending</h3>
              <p className="text-muted-foreground mb-4">
                Your request was submitted on {new Date(existingRequest.created_at).toLocaleDateString()}. 
                An institution admin will review it soon.
              </p>
              <p className="text-sm text-muted-foreground">
                You'll get access to the portal once approved.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4">
          {requestedRole === 'listener' ? (
            <Headphones className="h-8 w-8 text-primary-foreground" />
          ) : (
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          )}
        </div>
        <CardTitle>
          Request {requestedRole === 'listener' ? 'Peer Listener' : 'Counsellor'} Verification
        </CardTitle>
        <CardDescription>
          Submit your credentials for admin approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Institution</Label>
          <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your institution" />
            </SelectTrigger>
            <SelectContent>
              {institutions.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Institution Code</Label>
          <Input
            placeholder="Enter institution code"
            value={institutionCode}
            onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
            disabled={!!selectedInstitution}
          />
        </div>

        <div className="space-y-2">
          <Label>Qualifications (Optional)</Label>
          <Textarea
            placeholder={requestedRole === 'listener' 
              ? "Describe any peer support training or experience..."
              : "List your counseling qualifications and certifications..."
            }
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-medium">What happens next?</p>
              <p className="text-muted-foreground">
                Your institution admin will review your request and verify your credentials. 
                You'll receive access once approved.
              </p>
            </div>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={submitRequest}
          disabled={submitting || (!selectedInstitution && !institutionCode)}
        >
          {submitting ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submit Request
        </Button>
      </CardContent>
    </Card>
  );
}
