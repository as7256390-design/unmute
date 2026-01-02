import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Headphones, 
  Stethoscope,
  FileText,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoleRequest {
  id: string;
  user_id: string;
  role: 'listener' | 'counsellor';
  is_verified: boolean;
  created_at: string;
  institution_id: string | null;
  profile?: {
    display_name: string | null;
  };
}

interface RoleVerificationPanelProps {
  institutionId: string;
  onVerificationChange?: () => void;
}

export function RoleVerificationPanel({ institutionId, onVerificationChange }: RoleVerificationPanelProps) {
  const [pendingRequests, setPendingRequests] = useState<RoleRequest[]>([]);
  const [verifiedRoles, setVerifiedRoles] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadRoleRequests();
  }, [institutionId]);

  const loadRoleRequests = async () => {
    setLoading(true);
    try {
      // Get pending requests (unverified listeners and counsellors for this institution)
      const { data: pending } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          is_verified,
          created_at,
          institution_id
        `)
        .eq('institution_id', institutionId)
        .in('role', ['listener', 'counsellor'])
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      // Get verified roles
      const { data: verified } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          is_verified,
          created_at,
          institution_id
        `)
        .eq('institution_id', institutionId)
        .in('role', ['listener', 'counsellor'])
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      // Fetch profiles for all users
      const allUserIds = [...(pending || []), ...(verified || [])].map(r => r.user_id);
      let profilesMap: Record<string, { display_name: string | null }> = {};
      
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', allUserIds);
        
        if (profiles) {
          profiles.forEach(p => {
            profilesMap[p.user_id] = { display_name: p.display_name };
          });
        }
      }

      // Attach profiles to requests
      const pendingWithProfiles = (pending || []).map(r => ({
        ...r,
        role: r.role as 'listener' | 'counsellor',
        profile: profilesMap[r.user_id] || { display_name: null }
      }));

      const verifiedWithProfiles = (verified || []).map(r => ({
        ...r,
        role: r.role as 'listener' | 'counsellor',
        profile: profilesMap[r.user_id] || { display_name: null }
      }));

      setPendingRequests(pendingWithProfiles);
      setVerifiedRoles(verifiedWithProfiles);
    } catch (error) {
      console.error('Error loading role requests:', error);
      toast.error('Failed to load role requests');
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (request: RoleRequest) => {
    setProcessingId(request.id);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          is_verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success(`${request.role === 'listener' ? 'Listener' : 'Counsellor'} approved successfully`);
      loadRoleRequests();
      onVerificationChange?.();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (request: RoleRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;
    
    setProcessingId(selectedRequest.id);
    try {
      // Delete the role request
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Application rejected');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      loadRoleRequests();
      onVerificationChange?.();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const revokeVerification = async (request: RoleRequest) => {
    setProcessingId(request.id);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          is_verified: false,
          verified_at: null
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Verification revoked');
      loadRoleRequests();
      onVerificationChange?.();
    } catch (error) {
      console.error('Error revoking verification:', error);
      toast.error('Failed to revoke verification');
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'listener' ? (
      <Headphones className="h-4 w-4" />
    ) : (
      <Stethoscope className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pending Applications ({pendingRequests.length})
          </CardTitle>
          <CardDescription>
            Review and approve listener and counsellor applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No pending applications</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">
                          {request.profile?.display_name || 'Anonymous User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {request.user_id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {getRoleIcon(request.role)}
                          {request.role === 'listener' ? 'Peer Listener' : 'Counsellor'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveRequest(request)}
                            disabled={processingId === request.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(request)}
                            disabled={processingId === request.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Verified Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-safe" />
            Verified Staff ({verifiedRoles.length})
          </CardTitle>
          <CardDescription>
            Active listeners and counsellors in your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifiedRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No verified listeners or counsellors yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="font-medium">
                          {role.profile?.display_name || 'Anonymous User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {role.user_id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          {getRoleIcon(role.role)}
                          {role.role === 'listener' ? 'Peer Listener' : 'Counsellor'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(role.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => revokeVerification(role)}
                          disabled={processingId === role.id}
                        >
                          Revoke Access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this {selectedRequest?.role} application? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              placeholder="Provide a reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={rejectRequest}
              disabled={processingId === selectedRequest?.id}
            >
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
