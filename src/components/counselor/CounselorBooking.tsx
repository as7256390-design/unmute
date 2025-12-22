import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Video,
  CheckCircle2,
  XCircle,
  Star,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, addDays, setHours, setMinutes, isBefore, isAfter } from 'date-fns';
import { motion } from 'framer-motion';

interface Counselor {
  id: string;
  user_id: string;
  name: string;
  specialization: string[];
  bio: string;
  qualifications: string;
  experience_years: number;
  session_duration_minutes: number;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Session {
  id: string;
  counselor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  counselor?: Counselor;
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
];

export function CounselorBooking() {
  const { user } = useAuth();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounselors();
    if (user) loadUserSessions();
  }, [user]);

  const loadCounselors = async () => {
    const { data } = await supabase
      .from('counselors')
      .select('*')
      .eq('is_available', true);

    if (data) setCounselors(data);
    setLoading(false);
  };

  const loadUserSessions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('counseling_sessions')
      .select('*, counselor:counselors(*)')
      .eq('student_user_id', user.id)
      .order('scheduled_at', { ascending: false });

    if (data) setUserSessions(data);
  };

  const loadAvailability = async (counselorId: string) => {
    const { data } = await supabase
      .from('counselor_availability')
      .select('*')
      .eq('counselor_id', counselorId)
      .eq('is_active', true);

    if (data) setAvailability(data);
  };

  const selectCounselor = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    loadAvailability(counselor.id);
    setSelectedTime(null);
  };

  const getAvailableSlots = () => {
    if (!selectedDate || !selectedCounselor) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability) return [];

    return TIME_SLOTS.filter(slot => {
      const [hours] = slot.split(':').map(Number);
      const [startHour] = dayAvailability.start_time.split(':').map(Number);
      const [endHour] = dayAvailability.end_time.split(':').map(Number);
      return hours >= startHour && hours < endHour;
    });
  };

  const bookSession = async () => {
    if (!user || !selectedCounselor || !selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

    const { error } = await supabase
      .from('counseling_sessions')
      .insert({
        student_user_id: user.id,
        counselor_id: selectedCounselor.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: selectedCounselor.session_duration_minutes,
        status: 'scheduled'
      });

    if (error) {
      toast.error('Failed to book session');
      return;
    }

    toast.success('Session booked successfully!');
    setSelectedCounselor(null);
    setSelectedTime(null);
    loadUserSessions();
  };

  const cancelSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('counseling_sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId);

    if (error) {
      toast.error('Failed to cancel session');
      return;
    }

    toast.success('Session cancelled');
    loadUserSessions();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      scheduled: { variant: 'default', icon: CalendarIcon },
      completed: { variant: 'secondary', icon: CheckCircle2 },
      cancelled: { variant: 'destructive', icon: XCircle },
    };
    const config = variants[status] || variants.scheduled;
    return (
      <Badge variant={config.variant} className="capitalize">
        <config.icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Booking Flow
  if (selectedCounselor) {
    const availableSlots = getAvailableSlots();

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Button variant="ghost" onClick={() => setSelectedCounselor(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to counselors
        </Button>

        <Card className="glass mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle>{selectedCounselor.name}</CardTitle>
                <CardDescription>{selectedCounselor.qualifications}</CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedCounselor.experience_years} years experience
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">{selectedCounselor.bio}</p>
            <div className="flex flex-wrap gap-2">
              {selectedCounselor.specialization?.map(spec => (
                <Badge key={spec} variant="outline">{spec}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => 
                  isBefore(date, new Date()) || 
                  isAfter(date, addDays(new Date(), 30))
                }
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Select Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map(slot => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? 'default' : 'outline'}
                      onClick={() => setSelectedTime(slot)}
                      className="justify-center"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No available slots for this date
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass mt-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Session Details</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && selectedTime ? (
                    <>
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                    </>
                  ) : (
                    'Select date and time'
                  )}
                </p>
              </div>
              <Button 
                variant="gradient" 
                disabled={!selectedDate || !selectedTime}
                onClick={bookSession}
              >
                <Video className="h-4 w-4 mr-2" />
                Book Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main View
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold mb-2">Professional Counseling</h1>
        <p className="text-muted-foreground">
          Book a confidential session with a trained mental health professional
        </p>
      </div>

      <Tabs defaultValue="book" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="book">Book Session</TabsTrigger>
          <TabsTrigger value="sessions">My Sessions ({userSessions.filter(s => s.status === 'scheduled').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="mt-6">
          {counselors.length > 0 ? (
            <div className="grid gap-4">
              {counselors.map((counselor, i) => (
                <motion.div
                  key={counselor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectCounselor(counselor)}>
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                        <User className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{counselor.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {counselor.session_duration_minutes} min
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{counselor.qualifications}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {counselor.specialization?.slice(0, 3).map(spec => (
                            <Badge key={spec} variant="outline" className="text-xs">{spec}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline">Book</Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="glass">
              <CardContent className="py-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No counselors available at the moment</p>
                <p className="text-sm text-muted-foreground">Check back later or contact support</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6 space-y-4">
          {userSessions.length > 0 ? (
            userSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{(session.counselor as any)?.name || 'Counselor'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.scheduled_at), 'PPP')} at {format(new Date(session.scheduled_at), 'p')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(session.status)}
                      {session.status === 'scheduled' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => cancelSession(session.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="glass">
              <CardContent className="py-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No sessions booked yet</p>
                <p className="text-sm text-muted-foreground">Book your first session with a counselor</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
