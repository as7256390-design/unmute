import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Download,
  Plus,
  Copy,
  BarChart3,
  Shield,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Institution {
  id: string;
  name: string;
  type: string;
  code: string;
  created_at: string;
}

interface MoodStat {
  date: string;
  avg_mood_score: number;
  total_checkins: number;
  stress_high_count: number;
  stress_medium_count: number;
  stress_low_count: number;
  crisis_alerts_count: number;
}

const COLORS = ['hsl(var(--safe))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export function InstitutionDashboard() {
  const { user } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [moodStats, setMoodStats] = useState<MoodStat[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newInstitution, setNewInstitution] = useState({ name: '', type: 'school' });

  useEffect(() => {
    if (user) {
      loadInstitution();
    }
  }, [user]);

  const loadInstitution = async () => {
    if (!user) return;

    const { data: inst } = await supabase
      .from('institutions')
      .select('*')
      .eq('admin_user_id', user.id)
      .single();

    if (inst) {
      setInstitution(inst);
      loadStats(inst.id);
      loadMemberCount(inst.id);
    } else {
      setShowCreate(true);
    }
    setLoading(false);
  };

  const loadStats = async (institutionId: string) => {
    const { data } = await supabase
      .from('institution_mood_stats')
      .select('*')
      .eq('institution_id', institutionId)
      .order('date', { ascending: true })
      .limit(30);

    if (data) {
      setMoodStats(data);
    }
  };

  const loadMemberCount = async (institutionId: string) => {
    const { count } = await supabase
      .from('institution_members')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId);

    setMemberCount(count || 0);
  };

  const createInstitution = async () => {
    if (!user || !newInstitution.name) return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('institutions')
      .insert({
        name: newInstitution.name,
        type: newInstitution.type,
        code,
        admin_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create institution');
      return;
    }

    setInstitution(data);
    setShowCreate(false);
    toast.success('Institution created successfully!');
  };

  const copyCode = () => {
    if (institution) {
      navigator.clipboard.writeText(institution.code);
      toast.success('Join code copied!');
    }
  };

  const exportReport = () => {
    if (!moodStats.length) {
      toast.error('No data to export');
      return;
    }

    const csv = [
      'Date,Average Mood,Total Check-ins,High Stress,Medium Stress,Low Stress,Crisis Alerts',
      ...moodStats.map(s => 
        `${s.date},${s.avg_mood_score},${s.total_checkins},${s.stress_high_count},${s.stress_medium_count},${s.stress_low_count},${s.crisis_alerts_count}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wellness-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report downloaded!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Card className="glass">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Create Your Institution</CardTitle>
            <CardDescription>
              Set up your school, college, or coaching center to monitor student wellness anonymously
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Institution Name</Label>
              <Input
                placeholder="e.g., Delhi Public School"
                value={newInstitution.name}
                onChange={(e) => setNewInstitution(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {['school', 'college', 'coaching'].map(type => (
                  <Button
                    key={type}
                    variant={newInstitution.type === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewInstitution(prev => ({ ...prev, type }))}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <Button variant="gradient" className="w-full" onClick={createInstitution}>
              <Plus className="h-4 w-4 mr-2" />
              Create Institution
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestStats = moodStats[moodStats.length - 1];
  const previousStats = moodStats[moodStats.length - 2];
  const moodTrend = latestStats && previousStats 
    ? latestStats.avg_mood_score - previousStats.avg_mood_score 
    : 0;

  const stressDistribution = latestStats ? [
    { name: 'Low', value: latestStats.stress_low_count, color: 'hsl(var(--safe))' },
    { name: 'Medium', value: latestStats.stress_medium_count, color: 'hsl(var(--warning))' },
    { name: 'High', value: latestStats.stress_high_count, color: 'hsl(var(--destructive))' },
  ] : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {institution?.name}
          </h1>
          <p className="text-muted-foreground">Anonymized student wellness dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Join Code:</span>
            <code className="font-mono font-bold">{institution?.code}</code>
            <Button variant="ghost" size="icon-sm" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-3 py-3">
          <Shield className="h-5 w-5 text-primary" />
          <p className="text-sm">
            <strong>Privacy First:</strong> All data is anonymized and aggregated. 
            Individual student information is never visible.
          </p>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold">{memberCount}</p>
              </div>
              <Users className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Mood Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">
                    {latestStats?.avg_mood_score?.toFixed(1) || '-'}
                  </p>
                  {moodTrend !== 0 && (
                    <Badge variant={moodTrend > 0 ? 'default' : 'destructive'} className="text-xs">
                      {moodTrend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {Math.abs(moodTrend).toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
              <Heart className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Check-ins</p>
                <p className="text-3xl font-bold">{latestStats?.total_checkins || 0}</p>
              </div>
              <BarChart3 className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className={`glass ${latestStats?.crisis_alerts_count > 0 ? 'border-destructive' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crisis Alerts</p>
                <p className="text-3xl font-bold">{latestStats?.crisis_alerts_count || 0}</p>
              </div>
              <AlertTriangle className={`h-10 w-10 ${latestStats?.crisis_alerts_count > 0 ? 'text-destructive' : 'text-muted-foreground/20'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList>
          <TabsTrigger value="trends">Mood Trends</TabsTrigger>
          <TabsTrigger value="stress">Stress Distribution</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Mood Score Over Time</CardTitle>
              <CardDescription>30-day anonymized average mood scores</CardDescription>
            </CardHeader>
            <CardContent>
              {moodStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={moodStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[1, 5]} 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_mood_score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No data yet. Stats will appear as students check in.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stress">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Stress Level Distribution</CardTitle>
              <CardDescription>Current breakdown of reported stress levels</CardDescription>
            </CardHeader>
            <CardContent>
              {stressDistribution.some(s => s.value > 0) ? (
                <div className="flex items-center justify-center gap-8">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={stressDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {stressDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {stressDistribution.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }} 
                        />
                        <span className="text-sm">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <p>No stress data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Daily Check-in Engagement</CardTitle>
              <CardDescription>Number of students checking in each day</CardDescription>
            </CardHeader>
            <CardContent>
              {moodStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={moodStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Bar dataKey="total_checkins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No engagement data yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
