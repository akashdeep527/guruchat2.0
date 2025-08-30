import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Users, 
  Zap,
  BarChart3,
  Calendar,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

interface AIAutoReplyDashboardProps {
  professionalId: string;
}

interface AIStats {
  totalResponses: number;
  todayResponses: number;
  responseRate: number;
  averageResponseTime: number;
  clientSatisfaction: number;
  activeConversations: number;
}

interface AIRecentActivity {
  id: string;
  clientName: string;
  message: string;
  responseType: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'failed';
}

const AIAutoReplyDashboard = ({ professionalId }: AIAutoReplyDashboardProps) => {
  const [stats, setStats] = useState<AIStats>({
    totalResponses: 0,
    todayResponses: 0,
    responseRate: 0,
    averageResponseTime: 0,
    clientSatisfaction: 0,
    activeConversations: 0
  });

  const [recentActivity, setRecentActivity] = useState<AIRecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [professionalId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // In production, fetch from API
      // For now, use mock data
      const mockStats: AIStats = {
        totalResponses: 127,
        todayResponses: 8,
        responseRate: 94.2,
        averageResponseTime: 2.3,
        clientSatisfaction: 4.8,
        activeConversations: 12
      };

      const mockActivity: AIRecentActivity[] = [
        {
          id: '1',
          clientName: 'Sarah Johnson',
          message: 'I need help with my business strategy',
          responseType: 'consultation',
          timestamp: '2 minutes ago',
          status: 'sent'
        },
        {
          id: '2',
          clientName: 'Mike Chen',
          message: 'Thank you for the advice',
          responseType: 'closing',
          timestamp: '15 minutes ago',
          status: 'sent'
        },
        {
          id: '3',
          clientName: 'Emily Davis',
          message: 'Can you explain this further?',
          responseType: 'followup',
          timestamp: '1 hour ago',
          status: 'pending'
        }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">Sent</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Auto-Reply Dashboard</h2>
          <p className="text-gray-600">Monitor your AI assistant performance and client interactions</p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          <Bot className="h-3 w-3 mr-1" />
          Gemini AI Active
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total AI Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalResponses}</div>
            <p className="text-xs text-blue-700 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Today's Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.todayResponses}</div>
            <p className="text-xs text-green-700 mt-1">
              <Clock className="h-3 w-3 inline mr-1" />
              Last response: 2 min ago
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.responseRate}%</div>
            <p className="text-xs text-purple-700 mt-1">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              Excellent performance
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.averageResponseTime}m</div>
            <p className="text-xs text-orange-700 mt-1">
              <Zap className="h-3 w-3 inline mr-1" />
              Lightning fast
            </p>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-teal-800">Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">{stats.clientSatisfaction}/5</div>
            <p className="text-xs text-teal-700 mt-1">
              <Users className="h-3 w-3 inline mr-1" />
              Based on 89 reviews
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{stats.activeConversations}</div>
            <p className="text-xs text-indigo-700 mt-1">
              <MessageSquare className="h-3 w-3 inline mr-1" />
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent AI Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(activity.status)}
                  <div>
                    <div className="font-medium text-gray-900">{activity.clientName}</div>
                    <div className="text-sm text-gray-600">{activity.message}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.responseType}
                      </Badge>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(activity.status)}
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Bot className="h-5 w-5" />
              <span className="font-medium">Quick AI Actions</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" size="sm" className="h-auto p-3 flex-col gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Generate Response</span>
              </Button>
              
              <Button variant="outline" size="sm" className="h-auto p-3 flex-col gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Schedule Reply</span>
              </Button>
              
              <Button variant="outline" size="sm" className="h-auto p-3 flex-col gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">View Analytics</span>
              </Button>
              
              <Button variant="outline" size="sm" className="h-auto p-3 flex-col gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-xs">AI Settings</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAutoReplyDashboard;
