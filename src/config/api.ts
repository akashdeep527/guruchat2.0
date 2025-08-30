// API Configuration
// Update this file with your actual API keys

export const API_CONFIG = {
  // Google Gemini AI API Key
  // Get your API key from: https://makersuite.google.com/app/apikey
  GEMINI_API_KEY: 'AIzaSyCsrEvAhpSVyzbze30f_xaDOSoVGFVwO4Q', // Replace with your actual key
  
  // Add other API keys here as needed
};

// Helper function to get API key
export const getGeminiApiKey = (): string => {
  const key = API_CONFIG.GEMINI_API_KEY;
  if (key === 'your_actual_api_key_here') {
    console.warn('⚠️ Please update your Gemini API key in src/config/api.ts');
  }
  console.log('🔑 Gemini API Key length:', key.length);
  console.log('🔑 Gemini API Key starts with:', key.substring(0, 10) + '...');
  return key;
};
