import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MessageCircle, 
  IndianRupee, 
  Settings, 
  Shield,
  TrendingUp,
  Activity,
  UserCheck,
  Clock,
  Ban,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Navigate } from 'react-router-dom';

interface AdminStats {
  totalUsers: number;
  totalHelpers: number;
  totalSessions: number;
  activeSessions: number;
  totalRevenue: number;
  pendingSessions: number;
}

interface UserWithRole {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  is_helper: boolean;
  hourly_rate?: number;
  rating: number;
  total_sessions: number;
  is_available: boolean;
  created_at: string;
  email?: string;
  roles: string[];
}

interface ChatSession {
  id: string;
  client_id: string;
  helper_id: string;
  status: string;
  hourly_rate: number;
  total_amount?: number;
  duration_minutes?: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  client_name?: string;
  helper_name?: string;
}

interface Payment {
  id: string;
  session_id: string;
  client_id: string;
  helper_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_id?: string;
  created_at: string;
  client_name?: string;
  helper_name?: string;
}

const AdminPanel = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(data);
      } catch (error) {
        console.error('Error in checkAdminRole:', error);
        setIsAdmin(false);
      }
    };

    if (user) {
      checkAdminRole();
    }
  }, [user]);

  // Fetch admin stats
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      fetchSessions();
      fetchPayments();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [usersResult, sessionResult, paymentsResult] = await Promise.all([
        supabase.from('profiles').select('is_helper'),
        supabase.from('chat_sessions').select('status, total_amount'),
        supabase.from('payments').select('amount, status')
      ]);

      const totalUsers = usersResult.data?.length || 0;
      const totalHelpers = usersResult.data?.filter(u => u.is_helper).length || 0;
      const totalSessions = sessionResult.data?.length || 0;
      const activeSessions = sessionResult.data?.filter(s => s.status === 'active').length || 0;
      const pendingSessions = sessionResult.data?.filter(s => s.status === 'pending').length || 0;
      const totalRevenue = paymentsResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        totalUsers,
        totalHelpers,
        totalSessions,
        activeSessions,
        pendingSessions,
        totalRevenue: Math.round(totalRevenue / 100) // Convert from paise to rupees
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingData(true);
      
      // Fetch profiles with user roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRole[] = profiles?.map(profile => ({
        ...profile,
        roles: userRoles?.filter(r => r.user_id === profile.user_id).map(r => r.role) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users data",
        variant: "destructive"
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!sessions) {
        setSessions([]);
        return;
      }

      // Fetch client and helper names separately
      const clientIds = [...new Set(sessions.map(s => s.client_id))];
      const helperIds = [...new Set(sessions.map(s => s.helper_id))];
      
      const { data: clientProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', clientIds);

      const { data: helperProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', helperIds);

      const clientMap = new Map(clientProfiles?.map(p => [p.user_id, p.display_name]) || []);
      const helperMap = new Map(helperProfiles?.map(p => [p.user_id, p.display_name]) || []);

      const sessionsWithNames = sessions.map(session => ({
        ...session,
        client_name: clientMap.get(session.client_id) || 'Unknown',
        helper_name: helperMap.get(session.helper_id) || 'Unknown'
      }));

      setSessions(sessionsWithNames);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!payments) {
        setPayments([]);
        return;
      }

      // Fetch client and helper names separately
      const clientIds = [...new Set(payments.map(p => p.client_id))];
      const helperIds = [...new Set(payments.map(p => p.helper_id))];
      
      const { data: clientProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', clientIds);

      const { data: helperProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', helperIds);

      const clientMap = new Map(clientProfiles?.map(p => [p.user_id, p.display_name]) || []);
      const helperMap = new Map(helperProfiles?.map(p => [p.user_id, p.display_name]) || []);

      const paymentsWithNames = payments.map(payment => ({
        ...payment,
        client_name: clientMap.get(payment.client_id) || 'Unknown',
        helper_name: helperMap.get(payment.helper_id) || 'Unknown'
      }));

      setPayments(paymentsWithNames);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const updateUserRole = async (userId: string, role: string, action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: role as 'user' | 'admin' | 'helper'
          });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role as 'user' | 'admin' | 'helper');
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Role ${action === 'add' ? 'added' : 'removed'} successfully`
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ status: status as 'pending' | 'active' | 'completed' | 'cancelled' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session status updated successfully"
      });
      
      fetchSessions();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSessions = sessions.filter(session =>
    session.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.helper_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(payment =>
    payment.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.helper_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow">
          <Shield className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive rounded-xl">
              <Shield className="h-6 w-6 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">
                Manage your GuruChat platform
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalHelpers} professionals
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSessions}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeSessions} active, {stats.pendingSessions} pending
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
                    <p className="text-xs text-muted-foreground">
                      Platform earnings
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm">System operating normally</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{stats?.activeSessions || 0} active chat sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">{stats?.totalHelpers || 0} professionals available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingData ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.display_name}</p>
                              <p className="text-xs text-muted-foreground">{user.user_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_helper ? "default" : "secondary"}>
                              {user.is_helper ? "Professional" : "Client"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.roles.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.is_helper && (
                              <div className="text-xs">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  {user.rating.toFixed(1)} ({user.total_sessions} sessions)
                                </div>
                                {user.hourly_rate && (
                                  <div className="flex items-center gap-1">
                                    <IndianRupee className="h-3 w-3" />
                                    ₹{user.hourly_rate}/hr
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Select
                                onValueChange={(value) => {
                                  const [action, role] = value.split(':');
                                  updateUserRole(user.user_id, role, action as 'add' | 'remove');
                                }}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {!user.roles.includes('admin') && (
                                    <SelectItem value="add:admin">+ Admin</SelectItem>
                                  )}
                                  {user.roles.includes('admin') && (
                                    <SelectItem value="remove:admin">- Admin</SelectItem>
                                  )}
                                  {!user.roles.includes('helper') && (
                                    <SelectItem value="add:helper">+ Helper</SelectItem>
                                  )}
                                  {user.roles.includes('helper') && (
                                    <SelectItem value="remove:helper">- Helper</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6 mt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Chat Sessions</CardTitle>
                <CardDescription>Monitor and manage all chat sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No sessions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-xs">
                            {session.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>Client: {session.client_name}</div>
                              <div>Helper: {session.helper_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                session.status === 'active' ? 'default' :
                                session.status === 'completed' ? 'secondary' :
                                session.status === 'pending' ? 'outline' : 'destructive'
                              }
                            >
                              {session.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.duration_minutes ? `${session.duration_minutes}m` : '-'}
                          </TableCell>
                          <TableCell>
                            ₹{Math.round((session.total_amount || 0) / 100)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(session.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Select
                                onValueChange={(value) => updateSessionStatus(session.id, value)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>Track all platform payments and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stripe ID</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-xs">
                            {payment.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>From: {payment.client_name}</div>
                              <div>To: {payment.helper_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ₹{Math.round(payment.amount / 100)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.currency}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                payment.status === 'completed' ? 'default' :
                                payment.status === 'pending' ? 'outline' : 'destructive'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.stripe_payment_id?.slice(0, 12) || '-'}...
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure platform settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Platform Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>All systems operational</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Database Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Connected and healthy</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={fetchStats}>
                        Refresh Stats
                      </Button>
                      <Button variant="outline" onClick={fetchUsers}>
                        Sync Users
                      </Button>
                      <Button variant="outline" onClick={fetchSessions}>
                        Refresh Sessions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;