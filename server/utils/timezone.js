const env = require("../env");
const { format } = require("date-fns");
const knex = require("../knex");

/**
 * Get current time with configured timezone
 * @returns {Date} Date object adjusted to configured timezone
 */
function getTimezoneDate(date = new Date()) {
  const targetDate = new Date(date);
  const timezoneOffset = env.TIMEZONE_OFFSET * 60; // Convert hours to minutes
  const localOffset = targetDate.getTimezoneOffset();
  
  // Adjust to target timezone
  const adjustedTime = new Date(
    targetDate.getTime() + (localOffset + timezoneOffset) * 60000
  );
  
  return adjustedTime;
}

/**
 * Format date for database insertion based on DB type
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForDB(date = new Date()) {
  const tzDate = getTimezoneDate(date);
  
  // SQLite: 'YYYY-MM-DD HH:mm:ss'
  if (knex.isSQLite) {
    const isoString = tzDate.toISOString();
    return isoString.substring(0, 10) + " " + isoString.substring(11, 19);
  }
  
  // MySQL: 'YYYY-MM-DD HH:mm:ss' (saves in local timezone)
  if (knex.isMySQL) {
    return format(tzDate, "yyyy-MM-dd HH:mm:ss");
  }
  
  // PostgreSQL: ISO string
  return tzDate.toISOString();
}

/**
 * Get current timestamp string for database
 * @returns {string} Formatted timestamp
 */
function now() {
  return formatDateForDB();
}

/**
 * Get ISO string with timezone adjustment
 * @param {Date} date - Date to convert
 * @returns {string} ISO string
 */
function toISOString(date = new Date()) {
  return getTimezoneDate(date).toISOString();
}

/**
 * Parse date from database to JS Date
 * @param {string|Date} dateStr - Date string from database
 * @returns {Date} JavaScript Date object
 */
function parseFromDB(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  // Handle different database formats
  const date = new Date(dateStr);
  
  // Reverse timezone adjustment for display
  const timezoneOffset = env.TIMEZONE_OFFSET * 60;
  const localOffset = date.getTimezoneOffset();
  
  return new Date(date.getTime() - (localOffset + timezoneOffset) * 60000);
}

/**
 * Get timezone info
 * @returns {object} Timezone information
 */
function getTimezoneInfo() {
  return {
    timezone: env.TIMEZONE,
    offset: env.TIMEZONE_OFFSET,
    offsetString: `UTC${env.TIMEZONE_OFFSET >= 0 ? '+' : ''}${env.TIMEZONE_OFFSET}`,
    currentTime: now(),
  };
}

module.exports = {
  getTimezoneDate,
  formatDateForDB,
  now,
  toISOString,
  parseFromDB,
  getTimezoneInfo,
};
