import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserLibrary } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Download, 
  Package, 
  Calendar, 
  User, 
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Code,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface LibraryItem {
  order_id: string;
  buyer_id: string;
  product_id: string;
  amount_paise: number;
  status: string;
  purchased_at: string;
  expires_at: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  download_urls: string[] | null;
  product_type: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  seller_name: string | null;
  seller_avatar: string | null;
}

const LibraryPage = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      navigate('/home', { replace: true });
      return;
    }
    
    if (user) {
      fetchLibraryItems();
    }
  }, [user, profile, loading, navigate]);

  const fetchLibraryItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getUserLibrary(user!.id);
      setLibraryItems(data);
    } catch (error: any) {
      console.error('Error fetching library items:', error);
      setError(`Failed to fetch library: ${error.message}`);
      toast({
        title: 'Error',
        description: 'Failed to fetch your library items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string, productName: string) => {
    try {
      // Open download link in new tab
      window.open(url, '_blank');
      toast({
        title: 'Download Started',
        description: `Downloading ${productName}`,
      });
    } catch (error) {
      toast({
        title: 'Download Error',
        description: 'Failed to start download',
        variant: 'destructive',
      });
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'single': return <Package className="w-4 h-4" />;
      case 'pack': return <Package className="w-4 h-4" />;
      case 'subscription': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Digital Art': return <ImageIcon className="w-4 h-4" />;
      case 'Photography': return <ImageIcon className="w-4 h-4" />;
      case 'Video Content': return <Video className="w-4 h-4" />;
      case 'Templates': return <FileText className="w-4 h-4" />;
      case 'Documents': return <FileText className="w-4 h-4" />;
      case 'Audio': return <Music className="w-4 h-4" />;
      case 'Software': return <Code className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow">
          <Package className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div className="p-2 bg-primary rounded-xl">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Library</h1>
                <p className="text-sm text-muted-foreground">
                  Access your purchased digital products
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Library Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchLibraryItems}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : libraryItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your Library is Empty</h3>
            <p className="text-muted-foreground mb-4">
              You haven't purchased any digital products yet.
            </p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Purchased Products</h2>
              <Badge variant="secondary">
                {libraryItems.length} {libraryItems.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {libraryItems.map((item) => (
                <Card key={item.order_id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-white/90 text-black">
                        {getCategoryIcon(item.category_name || '')}
                        {item.category_name || 'Other'}
                      </Badge>
                    </div>
                    
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90 text-black">
                        {getProductTypeIcon(item.product_type)}
                        {item.product_type}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description || 'No description available'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={item.seller_avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {item.seller_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{item.seller_name || 'Unknown Seller'}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Purchased {formatDate(item.purchased_at)}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-purple-600">
                          ₹{(item.amount_paise / 100).toFixed(0)}
                        </div>
                      </div>
                    </div>

                    {/* Download Section */}
                    {item.download_urls && item.download_urls.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-green-600">
                          ✓ Download Available
                        </div>
                        <div className="space-y-2">
                          {item.download_urls.map((url, index) => (
                            <Button
                              key={index}
                              onClick={() => handleDownload(url, item.title)}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download {item.download_urls && item.download_urls.length > 1 ? `File ${index + 1}` : 'Product'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <div className="text-sm text-muted-foreground">
                          ⚠️ Download links not available
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Contact the seller for access
                        </div>
                      </div>
                    )}

                    {/* Preview Link */}
                    {item.preview_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open(item.preview_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Preview
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LibraryPage;
