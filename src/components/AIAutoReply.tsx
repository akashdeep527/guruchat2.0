import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Send, 
  Edit, 
  Zap, 
  Settings,
  MessageSquare,
  Clock,
  CheckCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIAutoReplyProps {
  clientMessage: string;
  professionalContext: {
    name: string;
    specialty: string;
    experience: string;
    tone: 'professional' | 'friendly' | 'casual';
  };
  previousContext?: string;
  onSendReply: (message: string) => void;
}

const AIAutoReply = ({ 
  clientMessage, 
  professionalContext, 
  previousContext,
  onSendReply 
}: AIAutoReplyProps) => {
  const { toast } = useToast();
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedResponse, setEditedResponse] = useState('');
  const [responseType, setResponseType] = useState<'greeting' | 'consultation' | 'followup' | 'closing'>('consultation');
  const [generationCount, setGenerationCount] = useState(0);

  const generateAIResponse = async () => {
    if (!clientMessage.trim()) {
      toast({
        title: 'No message to respond to',
        description: 'Please wait for a client message first.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai/gemini-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientMessage,
          professionalContext,
          responseType,
          previousContext
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiResponse(data.response);
        setEditedResponse(data.response);
        setGenerationCount(prev => prev + 1);
        
        toast({
          title: '✨ AI Response Generated',
          description: 'Review and edit the response before sending.',
        });
      } else {
        // Use fallback response
        setAiResponse(data.fallback);
        setEditedResponse(data.fallback);
        
        toast({
          title: 'Using Fallback Response',
          description: 'AI generation failed, using template response.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('AI response generation failed:', error);
      const fallback = getFallbackResponse();
      setAiResponse(fallback);
      setEditedResponse(fallback);
      
      toast({
        title: 'Generation Failed',
        description: 'Using fallback response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateResponse = async () => {
    if (generationCount < 3) { // Limit regenerations
      await generateAIResponse();
    } else {
      toast({
        title: 'Regeneration Limit Reached',
        description: 'Please edit the current response or wait.',
        variant: 'default'
      });
    }
  };

  const getFallbackResponse = () => {
    const templates = {
      greeting: `Hello! I'm ${professionalContext.name}, a ${professionalContext.specialty} professional with ${professionalContext.experience} of experience. How can I help you today?`,
      consultation: `Thank you for reaching out about your ${professionalContext.specialty} needs. I'd be happy to help you with personalized guidance. What specific questions do you have?`,
      followup: `I hope my previous response was helpful. Is there anything specific you'd like me to clarify or expand on?`,
      closing: `Thank you for the conversation. Feel free to reach out anytime if you need further assistance. Have a great day!`
    };
    
    return templates[responseType];
  };

  const handleSend = () => {
    if (editedResponse.trim()) {
      onSendReply(editedResponse);
      // Reset after sending
      setAiResponse('');
      setEditedResponse('');
      setGenerationCount(0);
      
      toast({
        title: 'Response Sent!',
        description: 'Your AI-assisted response has been sent to the client.',
      });
    }
  };

  const handleEdit = (newText: string) => {
    setEditedResponse(newText);
  };

  // Auto-detect response type based on context
  useEffect(() => {
    if (clientMessage) {
      const message = clientMessage.toLowerCase();
      if (message.includes('hello') || message.includes('hi') || message.includes('start')) {
        setResponseType('greeting');
      } else if (message.includes('thank') || message.includes('bye') || message.includes('end')) {
        setResponseType('closing');
      } else if (previousContext) {
        setResponseType('followup');
      } else {
        setResponseType('consultation');
      }
    }
  }, [clientMessage, previousContext]);

  return (
    <Card className="w-full max-w-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Gemini AI Assistant
          <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by Google
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 p-6">
        {/* Response Type Selection */}
        <div className="flex gap-2 flex-wrap">
          {(['greeting', 'consultation', 'followup', 'closing'] as const).map((type) => (
            <Button
              key={type}
              variant={responseType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setResponseType(type)}
              className={responseType === type ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateAIResponse}
          disabled={isGenerating || !clientMessage.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
        >
          {isGenerating ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Gemini is thinking...
            </>
          ) : (
            <>
              <Bot className="h-4 w-4 mr-2" />
              Generate with Gemini AI
            </>
          )}
        </Button>

        {/* AI Generated Response */}
        {aiResponse && (
          <div className="space-y-3 p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  <Bot className="h-3 w-3 mr-1" />
                  Gemini Generated
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Generation #{generationCount}
                </span>
              </div>
              
              {generationCount < 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={regenerateResponse}
                  disabled={isGenerating}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>
            
            <Textarea
              value={editedResponse}
              onChange={(e) => handleEdit(e.target.value)}
              placeholder="AI generated response..."
              rows={4}
              className="min-h-[100px] border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSend}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                disabled={!editedResponse.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Response
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setEditedResponse(aiResponse)}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Reset to AI
              </Button>
            </div>
          </div>
        )}

        {/* Quick Templates */}
        <div className="border-t border-blue-200 pt-4">
          <h4 className="font-medium mb-3 text-blue-800">Quick Templates</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditedResponse("Thank you for reaching out. I'll be happy to help you with this.")}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Thank You
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditedResponse("I understand your concern. Let me provide you with a detailed solution.")}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Understanding
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditedResponse("I'll get back to you within the next few hours with a comprehensive answer.")}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Clock className="h-3 w-3 mr-1" />
              Follow Up
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditedResponse("Is there anything specific you'd like me to clarify or expand on?")}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Clarification
            </Button>
          </div>
        </div>

        {/* Professional Context Display */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>AI Context:</strong> {professionalContext.name} - {professionalContext.specialty} professional 
            with {professionalContext.experience} experience. Tone: {professionalContext.tone}.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAutoReply;
