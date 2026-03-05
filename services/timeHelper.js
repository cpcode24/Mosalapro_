/**
 * Time helper functions for server-side time calculations
 * Author: Constant Pagoui  
 * Date: 2025-09-03
 */

/**
 * Get time ago string from a date
 * @param {Date|string} date - The date to compare against
 * @param {string} language - Language code ('en' or 'fr')
 * @returns {string} - Human readable time difference
 */
function getTimeAgo(date, language = 'en') {
    const now = new Date();
    const past = new Date(date);
    const diffInMilliseconds = Math.abs(now - past);
    
    // Define time intervals in milliseconds
    const intervals = {
        year: 31536000000, // 365 * 24 * 60 * 60 * 1000
        month: 2592000000, // 30 * 24 * 60 * 60 * 1000
        week: 604800000,   // 7 * 24 * 60 * 60 * 1000
        day: 86400000,     // 24 * 60 * 60 * 1000
        hour: 3600000,     // 60 * 60 * 1000
        minute: 60000      // 60 * 1000
    };
    
    // Define translations
    const translations = {
        en: {
            year: { singular: 'year', plural: 'years' },
            month: { singular: 'month', plural: 'months' },
            week: { singular: 'week', plural: 'weeks' },
            day: { singular: 'day', plural: 'days' },
            hour: { singular: 'hour', plural: 'hours' },
            minute: { singular: 'minute', plural: 'minutes' },
            ago: 'ago',
            now: 'now'
        },
        fr: {
            year: { singular: 'an', plural: 'ans' },
            month: { singular: 'mois', plural: 'mois' },
            week: { singular: 'semaine', plural: 'semaines' },
            day: { singular: 'jour', plural: 'jours' },
            hour: { singular: 'heure', plural: 'heures' },
            minute: { singular: 'minute', plural: 'minutes' },
            ago: 'il y a',
            now: 'maintenant'
        }
    };
    
    const lang = translations[language] || translations.en;
    
    // Less than a minute
    if (diffInMilliseconds < intervals.minute) {
        return lang.now;
    }
    
    // Check each interval
    for (const [key, milliseconds] of Object.entries(intervals)) {
        const count = Math.floor(diffInMilliseconds / milliseconds);
        
        if (count >= 1) {
            const unit = count === 1 ? lang[key].singular : lang[key].plural;
            
            if (language === 'fr') {
                return `${lang.ago} ${count} ${unit}`;
            } else {
                return `${count} ${unit} ${lang.ago}`;
            }
        }
    }
    
    return lang.now;
}

/**
 * Get short time ago string (abbreviated)
 * @param {Date|string} date - The date to compare against  
 * @returns {string} - Abbreviated time difference (e.g., "5m", "2h", "3d")
 */
function getShortTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInMilliseconds = Math.abs(now - past);
    
    const intervals = {
        yr: 31536000000, // year
        mo: 2592000000,  // month  
        w: 604800000,   // week
        d: 86400000,    // day
        h: 3600000,     // hour
        m: 60000        // minute
    };
    
    // Less than a minute
    if (diffInMilliseconds < intervals.m) {
        return 'now';
    }
    
    // Check each interval
    for (const [suffix, milliseconds] of Object.entries(intervals)) {
        const count = Math.floor(diffInMilliseconds / milliseconds);
        
        if (count >= 1) {
            return `${count}${suffix}`;
        }
    }
    
    return 'now';
}

module.exports = {
    getTimeAgo,
    getShortTimeAgo
};