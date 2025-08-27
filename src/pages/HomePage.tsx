import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  User, 
  LogOut, 
  Star, 
  Clock, 
  IndianRupee,
  Settings,
  Users,
  Zap,
  Search,
  Shield,
  ChevronDown,
  History
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Helper {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  hourly_rate: number;
  specialties: string[];
  rating: number;
  total_sessions: number;
  is_available: boolean;
}

const HomePage = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State declarations
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingHelpers, setIsLoadingHelpers] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHelpers();
    checkAdminRole();
    if (user && profile?.is_helper) {
      fetchPendingRequests();
      fetchProfessionalSessions();
    }
    if (user && !profile?.is_helper) {
      fetchClientSessions();
    }
  }, [user, profile]);

  // Real-time subscription for chat session updates (for clients)
  useEffect(() => {
    if (!user || profile?.is_helper) return;

    const channel = supabase
      .channel('client-sessions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `client_id=eq.${user.id}`
        },
        (payload) => {
          const session = payload.new as any;
          if (session.status === 'active' && payload.old.status === 'pending') {
            toast({
              title: "Chat request accepted!",
              description: "Your chat request has been accepted. Redirecting to chat...",
            });
            // Navigate to chat after a short delay
            setTimeout(() => {
              navigate(`/chat/${session.id}`);
            }, 1500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, navigate, toast]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  const fetchHelpers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_helper', true)
        .eq('is_available', true)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching helpers:', error);
        toast({
          title: "Error",
          description: "Failed to load professionals",
          variant: "destructive"
        });
        return;
      }

      setHelpers(data || []);
    } catch (error) {
      console.error('Error in fetchHelpers:', error);
    } finally {
      setIsLoadingHelpers(false);
    }
  };

  // Fetch pending chat requests for professionals
  const fetchPendingRequests = async () => {
    if (!user || !profile?.is_helper) return;
    
    try {
      // First get the chat sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('helper_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        setPendingRequests([]);
        return;
      }

      // Get client profiles for the sessions
      const clientIds = sessions.map(session => session.client_id);
      const { data: clientProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', clientIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const requestsWithClients = sessions.map(session => ({
        ...session,
        client: clientProfiles?.find(profile => profile.user_id === session.client_id)
      }));

      setPendingRequests(requestsWithClients);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  // Fetch client's chat sessions (for chat history)
  const fetchClientSessions = async () => {
    if (!user) return;
    
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('client_id', user.id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        setChatHistory([]);
        return;
      }

      // Get helper profiles for the sessions
      const helperIds = sessions.map(session => session.helper_id);
      const { data: helperProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', helperIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const sessionsWithHelpers = sessions.map(session => ({
        ...session,
        helper: helperProfiles?.find(profile => profile.user_id === session.helper_id)
      }));

      setChatHistory(sessionsWithHelpers);
    } catch (error) {
      console.error('Error fetching client sessions:', error);
    }
  };

  // Fetch professional's chat sessions (for chat history)
  const fetchProfessionalSessions = async () => {
    if (!user || !profile?.is_helper) return;
    
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('helper_id', user.id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        setChatHistory([]);
        return;
      }

      // Get client profiles for the sessions
      const clientIds = sessions.map(session => session.client_id);
      const { data: clientProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', clientIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const sessionsWithClients = sessions.map(session => ({
        ...session,
        client: clientProfiles?.find(profile => profile.user_id === session.client_id)
      }));

      setChatHistory(sessionsWithClients);
    } catch (error) {
      console.error('Error fetching professional sessions:', error);
    }
  };

  const startChat = async (helperId: string, helperRate: number) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          client_id: user.id,
          helper_id: helperId,
          hourly_rate: helperRate * 100, // Convert to paise
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Chat request sent!",
        description: "The professional will be notified of your request."
      });
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat session",
        variant: "destructive"
      });
    }
  };

  // Accept or reject chat request
  const handleChatRequest = async (sessionId: string, action: 'accept' | 'reject') => {
    try {
      const status = action === 'accept' ? 'active' : 'cancelled';
      const updates: any = { status };
      
      if (action === 'accept') {
        updates.started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;

      if (action === 'accept') {
        toast({
          title: "Chat request accepted!",
          description: "Redirecting to chat...",
        });
        
        // Navigate to chat page
        navigate(`/chat/${sessionId}`);
      } else {
        toast({
          title: "Chat request rejected",
          description: "The request has been declined."
        });
      }

      // Refresh pending requests
      fetchPendingRequests();
      fetchProfessionalSessions();
    } catch (error: any) {
      console.error('Error handling chat request:', error);
      toast({
        title: "Error",
        description: "Failed to handle chat request",
        variant: "destructive"
      });
    }
  };

  const filteredHelpers = helpers.filter(helper =>
    helper.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    helper.specialties?.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow">
          <MessageCircle className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <MessageCircle className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">GuruChat</h1>
                <p className="text-sm text-muted-foreground">
                  {profile?.is_helper ? 'Professional Dashboard' : 'Find Experts'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Button>
              )}
              <Avatar>
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.display_name.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{profile?.display_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {profile?.is_helper ? (
                    <>
                      <Zap className="h-3 w-3" />
                      Professional
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3" />
                      Client
                    </>
                  )}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {profile?.is_helper ? (
          // Professional Dashboard
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.total_sessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Successful consultations
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {profile.rating.toFixed(1)}
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average rating
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{profile.hourly_rate || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Per hour
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Professional Profile</CardTitle>
                <CardDescription>
                  Manage your professional information and availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{profile.display_name}</p>
                    <p className="text-sm text-muted-foreground">{profile.bio || 'No bio added'}</p>
                    <div className="flex gap-1 mt-2">
                      {profile.specialties?.map((specialty, index) => (
                        <Badge key={index} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Chat Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Pending Chat Requests
                  {pendingRequests.length > 0 && (
                    <Badge variant="destructive">{pendingRequests.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Manage incoming chat requests from clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No pending chat requests at the moment
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.client?.avatar_url} />
                            <AvatarFallback>
                              {request.client?.display_name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.client?.display_name || 'Client'}</p>
                            <p className="text-sm text-muted-foreground">
                              Rate: ₹{request.hourly_rate / 100}/hour
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleChatRequest(request.id, 'accept')}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChatRequest(request.id, 'reject')}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat History Dropdown for Professionals */}
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <History className="h-4 w-4" />
                    Chat History
                    {chatHistory.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {chatHistory.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card border border-border shadow-lg">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Your Chat Sessions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {chatHistory.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No chat sessions yet
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {chatHistory.map((session) => (
                        <DropdownMenuItem 
                          key={session.id} 
                          className="p-3 cursor-pointer focus:bg-muted"
                          onClick={() => navigate(`/chat/${session.id}`)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={session.client?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {session.client?.display_name?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {session.client?.display_name || 'Client'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₹{session.hourly_rate / 100}/hour
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(session.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge 
                                variant={session.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {session.status}
                              </Badge>
                              {session.status === 'active' && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                  Live
                                </Badge>
                              )}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          // Client Dashboard - Browse Professionals & Chat History
          <div className="space-y-6">
            {/* Chat History Dropdown for Clients */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Find Professional Help</h2>
                <p className="text-muted-foreground">
                  Connect with experts and get instant professional consultation
                </p>
              </div>
              {chatHistory.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <History className="h-4 w-4" />
                      Chat History
                      <Badge variant="secondary" className="ml-1">
                        {chatHistory.length}
                      </Badge>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-card border border-border shadow-lg">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Your Chat Sessions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-80 overflow-y-auto">
                      {chatHistory.map((session) => (
                        <DropdownMenuItem 
                          key={session.id} 
                          className="p-3 cursor-pointer focus:bg-muted"
                          onClick={() => navigate(`/chat/${session.id}`)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={session.helper?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {session.helper?.display_name?.charAt(0) || 'H'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {session.helper?.display_name || 'Professional'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₹{session.hourly_rate / 100}/hour
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(session.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge 
                                variant={session.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {session.status}
                              </Badge>
                              {session.status === 'active' && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                  Live
                                </Badge>
                              )}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {isLoadingHelpers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-24" />
                          <div className="h-3 bg-muted rounded w-32" />
                          <div className="h-3 bg-muted rounded w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHelpers.map((helper) => (
                  <Card key={helper.id} className="hover:shadow-lg transition-shadow animate-slide-up">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={helper.avatar_url} />
                          <AvatarFallback>{helper.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{helper.display_name}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            {helper.rating.toFixed(1)} ({helper.total_sessions} sessions)
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium text-primary mt-1">
                            <IndianRupee className="h-3 w-3" />
                            ₹{helper.hourly_rate}/hour
                          </div>
                        </div>
                      </div>
                      
                      {helper.bio && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {helper.bio}
                        </p>
                      )}
                      
                      {helper.specialties && helper.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {helper.specialties.slice(0, 3).map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {helper.specialties.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{helper.specialties.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        className="w-full" 
                        onClick={() => startChat(helper.user_id, helper.hourly_rate)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {!isLoadingHelpers && filteredHelpers.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No professionals found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : 'No professionals are currently available'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;