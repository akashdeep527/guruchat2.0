import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKey } from '@/config/api';

// Initialize Gemini with API key from config
const genAI = new GoogleGenerativeAI(getGeminiApiKey());

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  // Fallback models if the primary one fails
  private fallbackModels = ['gemini-1.5-pro', 'gemini-1.0-pro'];

  async generateResponse(params: {
    clientMessage: string;
    professionalContext: {
      specialty: string;
      experience: string;
      tone: 'professional' | 'friendly' | 'casual';
      name: string;
    };
    responseType: 'greeting' | 'consultation' | 'followup' | 'closing';
    previousContext?: string;
  }) {
    // Try primary model first
    try {
      console.log('🔍 Gemini Service: Starting response generation with gemini-2.0-flash-exp');
      console.log('🔑 API Key available:', !!getGeminiApiKey());
      console.log('📝 Client message:', params.clientMessage);
      
      const prompt = this.buildPrompt(params);
      console.log('📋 Generated prompt length:', prompt.length);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      console.log('✅ Gemini API success with gemini-2.0-flash-exp');
      
      return {
        success: true,
        response: response.text(),
        usage: result.usageMetadata
      };
    } catch (error) {
      console.error('❌ Gemini API error with gemini-2.0-flash-exp:', error);
      
      // Try fallback models
      for (const fallbackModel of this.fallbackModels) {
        try {
          console.log(`🔄 Trying fallback model: ${fallbackModel}`);
          const fallbackGenAI = new GoogleGenerativeAI(getGeminiApiKey());
          const fallbackModelInstance = fallbackGenAI.getGenerativeModel({ model: fallbackModel });
          
          const prompt = this.buildPrompt(params);
          const result = await fallbackModelInstance.generateContent(prompt);
          const response = await result.response;
          
          console.log(`✅ Gemini API success with ${fallbackModel}`);
          
          return {
            success: true,
            response: response.text(),
            usage: result.usageMetadata
          };
        } catch (fallbackError) {
          console.error(`❌ Fallback model ${fallbackModel} failed:`, fallbackError);
          continue;
        }
      }
      
      // All models failed
      console.error('❌ All Gemini models failed');
      console.error('Final error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: this.getFallbackResponse(params.responseType, params.professionalContext)
      };
    }
  }

  private buildPrompt(params: any) {
    const toneInstructions = {
      professional: 'Use formal, respectful language with proper business etiquette',
      friendly: 'Use warm, approachable language while maintaining professionalism',
      casual: 'Use relaxed, conversational language that feels personal'
    };

    return `
You are ${params.professionalContext.name}, a ${params.professionalContext.specialty} professional with ${params.professionalContext.experience} of experience.

Generate a ${params.responseType} response to this client message:
"${params.clientMessage}"

Context: ${params.previousContext || 'This is a new conversation'}

Requirements:
- ${toneInstructions[params.tone]}
- Professional and helpful
- Specific to ${params.responseType} context
- Under 80 words
- Include a question to encourage engagement
- Reflect your expertise in ${params.professionalContext.specialty}
- Sound natural and human-written

Response type: ${params.responseType}

${this.getResponseTypeContext(params.responseType)}

Generate only the response text, no explanations or formatting.
    `;
  }

  private getResponseTypeContext(responseType: string) {
    const contexts = {
      greeting: 'This is the first response to a new client. Introduce yourself warmly and ask how you can help.',
      consultation: 'The client is asking for advice or consultation. Provide helpful initial guidance and ask clarifying questions.',
      followup: 'This is a follow-up to previous conversation. Reference what was discussed and ask if they need clarification.',
      closing: 'The conversation is ending. Thank them warmly and encourage future contact.'
    };
    return contexts[responseType as keyof typeof contexts] || '';
  }

  private getFallbackResponse(responseType: string, context: any) {
    const templates = {
      greeting: `Hello! I'm ${context.name}, a ${context.specialty} professional with ${context.experience} of experience. How can I help you today?`,
      consultation: `Thank you for reaching out about your ${context.specialty} needs. I'd be happy to help you with personalized guidance. What specific questions do you have?`,
      followup: `I hope my previous response was helpful. Is there anything specific you'd like me to clarify or expand on?`,
      closing: `Thank you for the conversation. Feel free to reach out anytime if you need further assistance. Have a great day!`
    };
    
    return templates[responseType as keyof typeof templates] || templates.consultation;
  }
}

export const geminiService = new GeminiService();
