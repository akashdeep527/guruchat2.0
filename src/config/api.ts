// API Configuration
// Update this file with your actual API keys

export const API_CONFIG = {
  // Google Gemini AI API Key
  // Get your API key from: https://makersuite.google.com/app/apikey
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCsrEvAhpSVyzbze30f_xaDOSoVGFVwO4Q', // Fallback for development
  
  // Add other API keys here as needed
};

// Helper function to get API key
export const getGeminiApiKey = (): string => {
  const key = API_CONFIG.GEMINI_API_KEY;
  
  // Check if we're in production and no environment variable is set
  if (import.meta.env.PROD && !import.meta.env.VITE_GEMINI_API_KEY) {
    console.warn('⚠️ VITE_GEMINI_API_KEY environment variable not set in production');
  }
  
  if (!key || key === 'your_actual_api_key_here') {
    console.warn('⚠️ Please set VITE_GEMINI_API_KEY environment variable');
    return '';
  }
  
  console.log('🔑 Gemini API Key available:', !!key);
  return key;
};
