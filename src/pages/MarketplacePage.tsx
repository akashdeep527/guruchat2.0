import { useAuth } from '@/contexts/AuthContext';
import Marketplace from '@/components/Marketplace';
import { Navigate } from 'react-router-dom';

const MarketplacePage = () => {
  const { user, profile, loading } = useAuth();

  // Handle redirect when user is not authenticated
  if (!loading && (!user || !profile)) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Marketplace />
      </div>
    </div>
  );
};

export default MarketplacePage;
