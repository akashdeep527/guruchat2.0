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
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingHelpers, setIsLoadingHelpers] = useState(true);

  useEffect(() => {
    fetchHelpers();
  }, []);

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
          </div>
        ) : (
          // Client Dashboard - Browse Professionals
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-bold">Find Professional Help</h2>
                <p className="text-muted-foreground">
                  Connect with experts and get instant professional consultation
                </p>
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