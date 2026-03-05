/*********************************************************************************************************
*	SearchTranslation.js : Handles bilingual search translation between French and English keywords.
* Author: Constant Pagoui
*	Date: 2025-09-26
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const SearchTranslation = {
  // French to English mapping for professional roles/keywords
  frenchToEnglishMap: {
    // Legal
    'avocat': 'lawyer',
    'juriste': 'lawyer',
    'notaire': 'notary',

    // Architecture & Construction
    'architecte': 'architect',
    'ingénieur': 'engineer',
    'charpentier': 'carpenter',
    'menuisier': 'carpenter',
    'plombier': 'plumber',
    'électricien': 'electrician',
    'maçon': 'mason',
    'peintre': 'painter',
    'couvreur': 'roofer',

    // Healthcare
    'médecin': 'doctor',
    'docteur': 'doctor',
    'infirmier': 'nurse',
    'infirmière': 'nurse',
    'dentiste': 'dentist',
    'pharmacien': 'pharmacist',
    'kinésithérapeute': 'physiotherapist',

    // Technology
    'développeur': 'developer',
    'programmeur': 'developer',
    'informaticien': 'it specialist',
    'technicien': 'technician',
    'analyste': 'analyst',

    // Business & Finance
    'comptable': 'accountant',
    'consultant': 'consultant',
    'gestionnaire': 'manager',
    'directeur': 'director',
    'entrepreneur': 'entrepreneur',

    // Education
    'professeur': 'teacher',
    'enseignant': 'teacher',
    'tuteur': 'tutor',
    'formateur': 'trainer',

    // Services
    'coiffeur': 'hairdresser',
    'esthéticienne': 'beautician',
    'masseur': 'masseur',
    'nettoyeur': 'cleaner',
    'jardinier': 'gardener',
    'cuisinier': 'cook',
    'chef': 'chef',
    'serveur': 'waiter',
    'chauffeur': 'driver',
    'livreur': 'delivery person',

    // Arts & Media
    'photographe': 'photographer',
    'designer': 'designer',
    'graphiste': 'graphic designer',
    'musicien': 'musician',
    'dj': 'dj',
    'artiste': 'artist',
    'vidéaste': 'videographer',

    // Security & Safety
    'agent de sécurité': 'security guard',
    'garde du corps': 'bodyguard',
    'vigile': 'security guard',

    // Real Estate
    'agent immobilier': 'real estate agent',
    'évaluateur': 'appraiser',

    // Transportation
    'mécanicien': 'mechanic',
    'garagiste': 'mechanic',

    // Other common terms
    'expert': 'expert',
    'spécialiste': 'specialist',
    'professionnel': 'professional',
    'artisan': 'craftsman',
    'ouvrier': 'worker',
    'employé': 'employee',
    'freelance': 'freelancer',
    'indépendant': 'freelancer'
  },

  /**
   * Translates French keywords to English equivalents
   * @param {string} frenchKeyword - The French keyword to translate
   * @returns {string|null} - English translation or null if not found
   */
  translateToEnglish: function(frenchKeyword) {
    if (!frenchKeyword) return null;

    const normalizedKeyword = frenchKeyword.toLowerCase().trim();
    return this.frenchToEnglishMap[normalizedKeyword] || null;
  },

  /**
   * Gets search terms for a given keyword (original + translation if applicable)
   * @param {string} keyword - The search keyword
   * @param {string} currentLanguage - Current app language ('fr' or 'en')
   * @returns {array} - Array of search terms to use
   */
  getSearchTerms: function(keyword, currentLanguage = 'en') {
    if (!keyword) return [];

    const searchTerms = [keyword]; // Always include original keyword

    // If the app is in French mode and we have a translation, add it
    if (currentLanguage === 'fr') {
      const englishTranslation = this.translateToEnglish(keyword);
      if (englishTranslation && !searchTerms.includes(englishTranslation)) {
        searchTerms.push(englishTranslation);
      }
    }

    return searchTerms;
  },

  /**
   * Creates MongoDB query conditions for bilingual search
   * @param {string} searchTerm - The search term
   * @param {string} currentLanguage - Current app language
   * @param {string} fieldName - Database field name to search
   * @returns {object} - MongoDB query condition
   */
  createBilingualSearchCondition: function(searchTerm, currentLanguage, fieldName) {
    const searchTerms = this.getSearchTerms(searchTerm, currentLanguage);
    const conditions = [];

    searchTerms.forEach(term => {
      conditions.push(
        { [fieldName]: { $regex: new RegExp(term, 'i') } },
        { [fieldName]: { $regex: new RegExp(term.charAt(0).toUpperCase() + term.slice(1), 'i') } }
      );
    });

    return conditions.length > 1 ? { $or: conditions } : conditions[0] || {};
  }
};

module.exports = SearchTranslation;