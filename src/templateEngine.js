/**
 * Dynamic Template Engine
 * Replaces {Placeholder} with values from CSV row
 */

/**
 * Build a personalized message by replacing placeholders
 * @param {string} template - Message template with {Placeholder} syntax
 * @param {Object} row - CSV row object with key-value pairs
 * @returns {string} - Personalized message
 */
export function buildMessage(template, row) {
    return template.replace(/{(\w+)}/g, (match, key) => {
        // Return the value if it exists, otherwise keep the placeholder
        return row[key] !== undefined ? row[key] : match;
    });
}

/**
 * Validate that all placeholders in template have corresponding CSV columns
 * @param {string} template - Message template
 * @param {string[]} csvColumns - Array of column names from CSV header
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validatePlaceholders(template, csvColumns) {
    const placeholders = [];
    const regex = /{(\w+)}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
        placeholders.push(match[1]);
    }

    const missing = placeholders.filter(p => !csvColumns.includes(p));

    return {
        valid: missing.length === 0,
        missing,
        found: placeholders
    };
}

/**
 * Extract all placeholder names from a template
 * @param {string} template - Message template
 * @returns {string[]} - Array of placeholder names
 */
export function extractPlaceholders(template) {
    const placeholders = [];
    const regex = /{(\w+)}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
        placeholders.push(match[1]);
    }

    return [...new Set(placeholders)]; // Remove duplicates
}
