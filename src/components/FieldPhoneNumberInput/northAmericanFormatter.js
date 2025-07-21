/**
 * North American phone number formatter
 * Formats phone numbers as (XXX) XXX-XXXX
 * Validates North American phone number format
 */

/**
 * Extract only digits from a string
 * @param {String} str
 * @returns string containing only digits
 */
const extractDigits = str => str.replace(/[^\d]/g, '');

/**
 * Format a phone number as North American format (XXX) XXX-XXXX
 * @param {String} value
 * @returns formatted phone number string
 */
export const format = value => {
  if (!value) {
    return '';
  }

  const digits = extractDigits(value);
  
  // Limit to 10 digits for North American format
  const limitedDigits = digits.slice(0, 10);
  
  if (limitedDigits.length === 0) {
    return '';
  }
  
  if (limitedDigits.length <= 3) {
    return `(${limitedDigits}`;
  }
  
  if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  }
  
  return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
};

/**
 * Parse the formatted phone number to extract only digits
 * @param {String} value
 * @returns string containing only digits
 */
export const parse = value => {
  if (!value) {
    return '';
  }
  
  return extractDigits(value);
};

/**
 * Validate if the phone number is a valid North American format
 * @param {String} value
 * @returns boolean indicating if the phone number is valid
 */
export const isValidNorthAmericanPhone = value => {
  if (!value) {
    return false;
  }
  
  const digits = extractDigits(value);
  
  // North American phone numbers must be exactly 10 digits
  // and the first digit cannot be 0 or 1 (area code rules)
  if (digits.length !== 10) {
    return false;
  }
  
  // Area code cannot start with 0 or 1
  const areaCode = digits.slice(0, 3);
  if (areaCode[0] === '0' || areaCode[0] === '1') {
    return false;
  }
  
  // Check for invalid area codes (N11 codes like 911, 411, etc.)
  const n11Codes = ['911', '411', '311', '211', '511', '611', '711', '811', '911'];
  if (n11Codes.includes(areaCode)) {
    return false;
  }
  
  return true;
}; 