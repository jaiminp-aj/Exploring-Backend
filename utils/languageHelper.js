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
 * Prepare data for saving - converts flat language data to nested structure
 */
const prepareForSave = (data, language = 'en') => {
  const prepared = { ...data };
  const translatableFields = [
    'menuTitle', 'title', 'subtitle', 'excerpt', 'content', 'description',
    'description1', 'description2', 'description3', 'introduction',
    'copyrightTitle', 'address', 'additionalInfo', 'slug', 'ctaButtonText'
  ];
  
  translatableFields.forEach(field => {
    if (prepared[field] !== undefined && typeof prepared[field] === 'string') {
      // If it's a string, convert to nested object
      prepared[field] = {
        [language]: prepared[field]
      };
    } else if (prepared[field] && typeof prepared[field] === 'object' && !prepared[field][language]) {
      // If it's already an object but doesn't have this language, add it
      prepared[field] = {
        ...prepared[field],
        [language]: prepared[field].en || prepared[field].es || ''
      };
    }
  });
  
  // Handle nested arrays
  if (prepared.content && Array.isArray(prepared.content)) {
    prepared.content = prepared.content.map(item => {
      const newItem = { ...item };
      if (item.title && typeof item.title === 'string') {
        newItem.title = { [language]: item.title };
      }
      if (item.description && typeof item.description === 'string') {
        newItem.description = { [language]: item.description };
      }
      return newItem;
    });
  }
  
  if (prepared.links && Array.isArray(prepared.links)) {
    prepared.links = prepared.links.map(link => {
      const newLink = { ...link };
      if (link.title && typeof link.title === 'string') {
        newLink.title = { [language]: link.title };
      }
      return newLink;
    });
  }
  
  if (prepared.quickLinks && Array.isArray(prepared.quickLinks)) {
    prepared.quickLinks = prepared.quickLinks.map(link => {
      const newLink = { ...link };
      if (link.title && typeof link.title === 'string') {
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

