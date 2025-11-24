/**
 * Language Middleware
 * Extracts language from request (query param, header, or defaults to 'en')
 * Supported languages: 'en' (English), 'es' (Spanish)
 */
const getLanguage = (req, res, next) => {
  // Priority: query param > header > default
  const langParam = req.query.lang || req.query.language;
  const acceptLanguage = req.headers['accept-language'];
  
  let language = 'en'; // Default language
  
  if (langParam) {
    // Normalize language code (en, es, en-US -> en, es)
    language = langParam.toLowerCase().split('-')[0];
  } else if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
    const preferredLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    language = preferredLang;
  }
  
  // Validate language (only support en and es for now)
  const supportedLanguages = ['en', 'es'];
  if (!supportedLanguages.includes(language)) {
    language = 'en'; // Fallback to English
  }
  
  req.language = language;
  next();
};

module.exports = getLanguage;

