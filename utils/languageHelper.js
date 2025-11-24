/**
 * Language Helper Utilities
 * Functions to transform data based on requested language
 */

/**
 * Transform a single document to return only the requested language
 * Falls back to English if requested language is not available
 */
const transformByLanguage = (doc, language = 'en') => {
  if (!doc) return null;
  
  const obj = doc.toObject ? doc.toObject() : doc;
  const transformed = { ...obj };
  const fallbackLang = 'en';
  
  // Helper to get language value with fallback
  const getLangValue = (field, lang) => {
    if (!field) return undefined;
    if (typeof field === 'string') return field; // Already a string (backward compatibility)
    if (typeof field === 'object' && field[lang]) return field[lang];
    if (typeof field === 'object' && field[fallbackLang]) return field[fallbackLang];
    return undefined;
  };
  
  // Transform translatable fields
  const translatableFields = [
    'menuTitle', 'title', 'subtitle', 'excerpt', 'content', 'description',
    'description1', 'description2', 'description3', 'introduction',
    'copyrightTitle', 'address', 'additionalInfo', 'slug'
  ];
  
  translatableFields.forEach(field => {
    if (transformed[field]) {
      transformed[field] = getLangValue(transformed[field], language);
    }
  });
  
  // Transform nested arrays (like FAQ content, Footer links)
  if (transformed.content && Array.isArray(transformed.content)) {
    transformed.content = transformed.content.map(item => ({
      ...item,
      title: getLangValue(item.title, language),
      description: getLangValue(item.description, language),
    }));
  }
  
  if (transformed.links && Array.isArray(transformed.links)) {
    transformed.links = transformed.links.map(link => ({
      ...link,
      title: getLangValue(link.title, language),
    }));
  }
  
  if (transformed.quickLinks && Array.isArray(transformed.quickLinks)) {
    transformed.quickLinks = transformed.quickLinks.map(link => ({
      ...link,
      title: getLangValue(link.title, language),
    }));
  }
  
  // Transform CTA button text
  if (transformed.ctaButtonText) {
    transformed.ctaButtonText = getLangValue(transformed.ctaButtonText, language);
  }
  
  return transformed;
};

/**
 * Transform an array of documents
 */
const transformArrayByLanguage = (docs, language = 'en') => {
  if (!Array.isArray(docs)) return [];
  return docs.map(doc => transformByLanguage(doc, language));
};

/**
 * Prepare data for saving - handles both nested objects and flat strings
 * Supports new format: { title: { en: "...", es: "..." } }
 * Also supports old format: { title: "...", lang: "en" } for backward compatibility
 */
const prepareForSave = (data, language = 'en') => {
  const prepared = { ...data };
  const translatableFields = [
    'menuTitle', 'title', 'subtitle', 'excerpt', 'content', 'description',
    'description1', 'description2', 'description3', 'introduction',
    'copyrightTitle', 'address', 'additionalInfo', 'slug', 'ctaButtonText'
  ];
  
  translatableFields.forEach(field => {
    if (prepared[field] !== undefined) {
      // If it's already a nested object with en/es keys, use it as-is
      if (typeof prepared[field] === 'object' && 
          !Array.isArray(prepared[field]) &&
          (prepared[field].en !== undefined || prepared[field].es !== undefined)) {
        // Already in correct format, keep it - ensure both en and es exist (even if empty)
        prepared[field] = {
          en: prepared[field].en || '',
          es: prepared[field].es || '',
        };
        return; // Skip to next field
      }
      
      // If it's a string, convert to nested object
      if (typeof prepared[field] === 'string') {
        prepared[field] = {
          [language]: prepared[field]
        };
      } else if (prepared[field] && typeof prepared[field] === 'object' && !Array.isArray(prepared[field])) {
        // If it's an object but not in the right format, try to preserve it
        // This handles edge cases
        if (!prepared[field].en && !prepared[field].es) {
          prepared[field] = {
            [language]: prepared[field].value || prepared[field].text || ''
          };
        }
      }
    }
  });
  
  // Handle nested arrays (FAQ content, Footer links, etc.)
  if (prepared.content && Array.isArray(prepared.content)) {
    prepared.content = prepared.content.map(item => {
      const newItem = { ...item };
      // If title is already nested object, keep it
      if (item.title && typeof item.title === 'object' && 
          (item.title.en !== undefined || item.title.es !== undefined)) {
        // Already in correct format
      } else if (item.title && typeof item.title === 'string') {
        newItem.title = { [language]: item.title };
      }
      
      // If description is already nested object, keep it
      if (item.description && typeof item.description === 'object' && 
          (item.description.en !== undefined || item.description.es !== undefined)) {
        // Already in correct format
      } else if (item.description && typeof item.description === 'string') {
        newItem.description = { [language]: item.description };
      }
      return newItem;
    });
  }
  
  if (prepared.links && Array.isArray(prepared.links)) {
    prepared.links = prepared.links.map(link => {
      const newLink = { ...link };
      // If title is already nested object, keep it
      if (link.title && typeof link.title === 'object' && 
          (link.title.en !== undefined || link.title.es !== undefined)) {
        // Already in correct format
      } else if (link.title && typeof link.title === 'string') {
        newLink.title = { [language]: link.title };
      }
      return newLink;
    });
  }
  
  if (prepared.quickLinks && Array.isArray(prepared.quickLinks)) {
    prepared.quickLinks = prepared.quickLinks.map(link => {
      const newLink = { ...link };
      // If title is already nested object, keep it
      if (link.title && typeof link.title === 'object' && 
          (link.title.en !== undefined || link.title.es !== undefined)) {
        // Already in correct format
      } else if (link.title && typeof link.title === 'string') {
        newLink.title = { [language]: link.title };
      }
      return newLink;
    });
  }
  
  return prepared;
};

/**
 * Merge translations - used when updating existing document with new language
 */
const mergeTranslations = (existing, updates, language = 'en') => {
  const merged = { ...existing };
  const translatableFields = [
    'menuTitle', 'title', 'subtitle', 'excerpt', 'content', 'description',
    'description1', 'description2', 'description3', 'introduction',
    'copyrightTitle', 'address', 'additionalInfo', 'slug', 'ctaButtonText'
  ];
  
  translatableFields.forEach(field => {
    if (updates[field] !== undefined) {
      if (typeof updates[field] === 'string') {
        // New string value for this language
        merged[field] = {
          ...(merged[field] || {}),
          [language]: updates[field]
        };
      } else if (typeof updates[field] === 'object') {
        // Already in nested format, merge it
        merged[field] = {
          ...(merged[field] || {}),
          ...updates[field]
        };
      }
    }
  });
  
  return merged;
};

module.exports = {
  transformByLanguage,
  transformArrayByLanguage,
  prepareForSave,
  mergeTranslations,
};

