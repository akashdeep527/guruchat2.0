import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bot, 
  Save, 
  Zap, 
  MessageSquare,
  Clock,
  User,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface AIAutoReplySettingsProps {
  professionalId: string;
  onSave: (settings: AIAutoReplySettings) => void;
}

export interface AIAutoReplySettings {
  enabled: boolean;
  responseDelay: number; // minutes
  tone: 'professional' | 'friendly' | 'casual';
  autoGreeting: boolean;
  autoFollowUp: boolean;
  maxDailyResponses: number;
  customPrompts: {
    greeting: string;
    consultation: string;
    followup: string;
    closing: string;
  };
}

const AIAutoReplySettings = ({ professionalId, onSave }: AIAutoReplySettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AIAutoReplySettings>({
    enabled: false,
    responseDelay: 5,
    tone: 'professional',
    autoGreeting: true,
    autoFollowUp: true,
    maxDailyResponses: 50,
    customPrompts: {
      greeting: '',
      consultation: '',
      followup: '',
      closing: ''
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load existing settings from localStorage or API
    loadSettings();
  }, [professionalId]);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(`ai_auto_reply_${professionalId}`);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage (in production, save to database)
      localStorage.setItem(`ai_auto_reply_${professionalId}`, JSON.stringify(settings));
      
      // Call parent save function
      onSave(settings);
      
      toast({
        title: 'Settings Saved',
        description: 'Your AI auto-reply preferences have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof AIAutoReplySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateCustomPrompt = (type: keyof AIAutoReplySettings['customPrompts'], value: string) => {
    setSettings(prev => ({
      ...prev,
      customPrompts: { ...prev.customPrompts, [type]: value }
    }));
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Auto-Reply Settings
          <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
            <Bot className="h-3 w-3 mr-1" />
            Gemini AI
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Main Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">General Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="enabled" className="font-medium">Enable AI Auto-Reply</Label>
                <p className="text-sm text-muted-foreground">Allow AI to generate responses</p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSetting('enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="autoGreeting" className="font-medium">Auto Greeting</Label>
                <p className="text-sm text-muted-foreground">Send welcome message to new clients</p>
              </div>
              <Switch
                id="autoGreeting"
                checked={settings.autoGreeting}
                onCheckedChange={(checked) => updateSetting('autoGreeting', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="autoFollowUp" className="font-medium">Auto Follow-Up</Label>
                <p className="text-sm text-muted-foreground">Send follow-up messages</p>
              </div>
              <Switch
                id="autoFollowUp"
                checked={settings.autoFollowUp}
                onCheckedChange={(checked) => updateSetting('autoFollowUp', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="maxDailyResponses" className="font-medium">Daily Response Limit</Label>
                <p className="text-sm text-muted-foreground">Maximum AI responses per day</p>
              </div>
              <Input
                id="maxDailyResponses"
                type="number"
                min="1"
                max="100"
                value={settings.maxDailyResponses}
                onChange={(e) => updateSetting('maxDailyResponses', parseInt(e.target.value))}
                className="w-20"
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </div>

        {/* Response Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Response Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Response Tone</Label>
              <select
                id="tone"
                value={settings.tone}
                onChange={(e) => updateSetting('tone', e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={!settings.enabled}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {settings.tone === 'professional' && 'Formal and business-like'}
                {settings.tone === 'friendly' && 'Warm and approachable'}
                {settings.tone === 'casual' && 'Relaxed and conversational'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseDelay">Response Delay (minutes)</Label>
              <Input
                id="responseDelay"
                type="number"
                min="0"
                max="60"
                value={settings.responseDelay}
                onChange={(e) => updateSetting('responseDelay', parseInt(e.target.value))}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Wait time before sending AI response
              </p>
            </div>
          </div>
        </div>

        {/* Custom Prompts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Custom Prompts</h3>
          <p className="text-sm text-muted-foreground">
            Customize how AI generates responses for different scenarios
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="greetingPrompt">Greeting Prompt</Label>
              <Textarea
                id="greetingPrompt"
                placeholder="Custom greeting instructions..."
                value={settings.customPrompts.greeting}
                onChange={(e) => updateCustomPrompt('greeting', e.target.value)}
                rows={3}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultationPrompt">Consultation Prompt</Label>
              <Textarea
                id="consultationPrompt"
                placeholder="Custom consultation instructions..."
                value={settings.customPrompts.consultation}
                onChange={(e) => updateCustomPrompt('consultation', e.target.value)}
                rows={3}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followupPrompt">Follow-up Prompt</Label>
              <Textarea
                id="followupPrompt"
                placeholder="Custom follow-up instructions..."
                value={settings.customPrompts.followup}
                onChange={(e) => updateCustomPrompt('followup', e.target.value)}
                rows={3}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingPrompt">Closing Prompt</Label>
              <Textarea
                id="closingPrompt"
                placeholder="Custom closing instructions..."
                value={settings.customPrompts.closing}
                onChange={(e) => updateCustomPrompt('closing', e.target.value)}
                rows={3}
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </div>

        {/* AI Information */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">AI Safety & Privacy</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• All responses are reviewed before sending</li>
                <li>• Client data is never shared with AI services</li>
                <li>• You maintain full control over all responses</li>
                <li>• AI responses can be edited or rejected</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAutoReplySettings;
