import { NextApiRequest, NextApiResponse } from 'next';
import { geminiService } from '@/services/geminiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientMessage, professionalContext, responseType, previousContext } = req.body;

    // Validate required fields
    if (!clientMessage || !professionalContext) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: clientMessage and professionalContext' 
      });
    }

    // Validate professional context
    if (!professionalContext.name || !professionalContext.specialty || !professionalContext.experience) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid professional context. Missing name, specialty, or experience.' 
      });
    }

    // Generate response using Gemini
    const result = await geminiService.generateResponse({
      clientMessage,
      professionalContext,
      responseType,
      previousContext
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        response: result.response,
        usage: result.usage,
        model: 'gemini-pro'
      });
    } else {
      res.status(200).json({
        success: false,
        error: result.error,
        fallback: result.fallback,
        model: 'fallback'
      });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate AI response',
      fallback: 'Thank you for your message. I will respond shortly with personalized assistance.'
    });
  }
}
