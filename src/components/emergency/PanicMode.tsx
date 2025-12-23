import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Plus, Trash2, Edit2, Check, X, Loader2, MessageCircle, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
  is_primary: boolean;
}

export function PanicMode() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panicDialogOpen, setPanicDialogOpen] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      triggerPanicAlert();
    }
  }, [countdown]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setRelationship('');
    setIsPrimary(false);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }

    // Validate phone format
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!/^[+]?[\d]{10,15}$/.test(cleanPhone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('emergency_contacts')
          .update({ name, phone: cleanPhone, relationship, is_primary: isPrimary })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Contact updated');
      } else {
        const { error } = await supabase
          .from('emergency_contacts')
          .insert({ 
            user_id: user?.id, 
            name, 
            phone: cleanPhone, 
            relationship, 
            is_primary: isPrimary 
          });
        if (error) throw error;
        toast.success('Contact added');
      }
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship || '');
    setIsPrimary(contact.is_primary);
    setEditingId(contact.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Contact deleted');
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const startPanicCountdown = () => {
    if (contacts.length === 0) {
      toast.error('Please add emergency contacts first');
      return;
    }
    setPanicDialogOpen(true);
    setCountdown(5);
  };

  const cancelPanic = () => {
    setCountdown(null);
    setPanicDialogOpen(false);
  };

  const triggerPanicAlert = async () => {
    setCountdown(null);
    setSendingSMS(true);

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Log panic alert
      await supabase.from('panic_alerts').insert({
        user_id: user?.id,
        latitude,
        longitude,
        contacts_notified: contacts.length,
      });

      // Send SMS via edge function
      const { data, error } = await supabase.functions.invoke('send-panic-alert', {
        body: {
          contacts: contacts.map(c => ({ name: c.name, phone: c.phone })),
          latitude,
          longitude,
          userName: user?.email?.split('@')[0],
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Alert sent to ${data.sent} contacts!`);
      } else if (data?.whatsappOnly) {
        toast.warning('SMS not configured. Use WhatsApp to share your location.');
      }

      setPanicDialogOpen(false);
    } catch (error: any) {
      console.error('Panic alert error:', error);
      if (error?.code === 1) {
        toast.error('Location permission denied. Cannot send alert without location.');
      } else {
        toast.error('Failed to send alert. Try WhatsApp instead.');
      }
    } finally {
      setSendingSMS(false);
    }
  };

  const shareViaWhatsApp = async () => {
    setSendingWhatsApp(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const message = encodeURIComponent(
        `🚨 EMERGENCY ALERT 🚨\n\nI need help! Here's my location:\n${locationUrl}\n\nPlease respond immediately or contact emergency services.`
      );

      // Log panic alert
      await supabase.from('panic_alerts').insert({
        user_id: user?.id,
        latitude,
        longitude,
        contacts_notified: contacts.length,
      });

      // Open WhatsApp with the first contact
      const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
      if (primaryContact) {
        const phone = primaryContact.phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        toast.success('Opening WhatsApp...');
      }

      setPanicDialogOpen(false);
    } catch (error: any) {
      console.error('WhatsApp share error:', error);
      if (error?.code === 1) {
        toast.error('Location permission denied');
      } else {
        toast.error('Failed to get location');
      }
    } finally {
      setSendingWhatsApp(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Please sign in to set up emergency contacts
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panic Button */}
      <Card className="border-red-200 dark:border-red-900 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              variant="destructive"
              className="h-24 w-24 rounded-full text-xl font-bold shadow-lg hover:scale-105 transition-transform"
              onClick={startPanicCountdown}
              disabled={contacts.length === 0}
            >
              <AlertTriangle className="h-10 w-10" />
            </Button>
            <div className="text-center">
              <h3 className="font-semibold text-lg">Panic Button</h3>
              <p className="text-sm text-muted-foreground">
                {contacts.length === 0
                  ? 'Add emergency contacts to enable'
                  : `Tap to alert ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                These contacts will be notified when you trigger panic mode
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No emergency contacts added yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.name}</span>
                          {contact.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        {contact.relationship && (
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Add/Edit Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 border rounded-lg bg-muted/30"
              >
                <h4 className="font-medium mb-4">
                  {editingId ? 'Edit Contact' : 'Add New Contact'}
                </h4>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Input
                      id="relationship"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      placeholder="e.g., Parent, Spouse, Friend"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="primary"
                      checked={isPrimary}
                      onCheckedChange={setIsPrimary}
                    />
                    <Label htmlFor="primary">Primary contact</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      {editingId ? 'Update' : 'Add Contact'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Panic Confirmation Dialog */}
      <Dialog open={panicDialogOpen} onOpenChange={setPanicDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Emergency Alert
            </DialogTitle>
            <DialogDescription>
              Your location will be shared with your emergency contacts
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {countdown !== null && countdown > 0 ? (
              <div className="text-center">
                <div className="text-6xl font-bold text-destructive mb-4">
                  {countdown}
                </div>
                <p className="text-muted-foreground">
                  Alert will be sent automatically...
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={cancelPanic}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  className="w-full gap-2 h-12"
                  variant="destructive"
                  onClick={triggerPanicAlert}
                  disabled={sendingSMS}
                >
                  {sendingSMS ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  Send SMS Alert
                </Button>
                <Button
                  className="w-full gap-2 h-12 bg-green-600 hover:bg-green-700"
                  onClick={shareViaWhatsApp}
                  disabled={sendingWhatsApp}
                >
                  {sendingWhatsApp ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <MessageCircle className="h-5 w-5" />
                  )}
                  Share via WhatsApp
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="text-xs text-muted-foreground text-center">
            Contacts will receive your live location link
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
