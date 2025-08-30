import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Settings, 
  BarChart3, 
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIAutoReply from '@/components/AIAutoReply';
import AIAutoReplySettings from '@/components/AIAutoReplySettings';
import AIAutoReplyDashboard from '@/components/AIAutoReplyDashboard';
import { AIAutoReplySettings as AIAutoReplySettingsType } from '@/components/AIAutoReplySettings';

const AIAutoReplyPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiSettings, setAiSettings] = useState<AIAutoReplySettingsType | null>(null);

  // Mock client message for demo
  const mockClientMessage = "Hi, I'm looking for advice on starting a small business. Can you help me understand the basics of business planning and what steps I should take first?";

  const handleSaveSettings = (settings: AIAutoReplySettingsType) => {
    setAiSettings(settings);
    // In production, save to database
    console.log('AI settings saved:', settings);
  };

  const handleSendReply = (message: string) => {
    // In production, send the message through chat system
    console.log('Sending AI-generated reply:', message);
  };

  if (!user || !profile?.is_helper) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6">
            <Bot className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              AI Auto-Reply features are only available for professional helpers.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Auto-Reply Studio</h1>
              <p className="text-gray-600">Powered by Google Gemini AI</p>
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {profile.name?.charAt(0) || 'P'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{profile.name || 'Professional'}</h3>
                  <p className="text-sm text-gray-600">{profile.specialty || 'General Helper'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Enabled
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  <Zap className="h-3 w-3 mr-1" />
                  Gemini Pro
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AIAutoReplyDashboard professionalId={user.id} />
        </TabsContent>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Message Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Client Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">C</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">Client</div>
                      <div className="text-gray-700">{mockClientMessage}</div>
                      <div className="text-xs text-gray-500 mt-2">Just now</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>AI Analysis:</strong> This is a business consultation request. 
                    The client needs guidance on business planning fundamentals.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Response Generator */}
            <div>
              <AIAutoReply
                clientMessage={mockClientMessage}
                professionalContext={{
                  name: profile.name || 'Professional',
                  specialty: profile.specialty || 'Business Consultant',
                  experience: '5+ years',
                  tone: 'friendly'
                }}
                onSendReply={handleSendReply}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <AIAutoReplySettings
            professionalId={user.id}
            onSave={handleSaveSettings}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Stats Footer */}
      <Card className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">127</div>
              <div className="text-sm text-gray-600">Total Responses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">94.2%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">2.3m</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">4.8/5</div>
              <div className="text-sm text-gray-600">Client Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAutoReplyPage;
