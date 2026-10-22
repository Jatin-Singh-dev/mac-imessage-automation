import fs from 'fs';
import csv from 'csv-parser';

/**
 * CSV Parser with validation
 * Loads contacts and validates required fields
 */

/**
 * Load contacts from CSV file
 * @param {string} filepath - Path to CSV file
 * @returns {Promise<{contacts: Object[], columns: string[]}>} - Contacts and column names
 */
export async function loadContacts(filepath) {
    return new Promise((resolve, reject) => {
        const contacts = [];
        let columns = [];

        if (!fs.existsSync(filepath)) {
            reject(new Error(`CSV file not found: ${filepath}`));
            return;
        }

        fs.createReadStream(filepath)
            .pipe(csv())
            .on('headers', (headers) => {
                columns = headers;
            })
            .on('data', (row) => {
                // Validate phone number exists
                if (row.Phone && row.Phone.trim()) {
                    // Normalize phone number (remove spaces, dashes)
                    row.Phone = normalizePhone(row.Phone);
                    contacts.push(row);
                }
            })
            .on('end', () => {
                resolve({ contacts, columns });
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

/**
 * Get CSV column headers by reading first line
 * @param {string} filepath - Path to CSV file
 * @returns {Promise<string[]>} - Array of column names
 */
export async function getCSVColumns(filepath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filepath)) {
            reject(new Error(`CSV file not found: ${filepath}`));
            return;
        }

        // Read first line to get headers
        const content = fs.readFileSync(filepath, 'utf-8');
        const firstLine = content.split('\n')[0];
        const columns = firstLine.split(',').map(col => col.trim());
        resolve(columns);
    });
}

/**
 * Normalize phone number format
 * @param {string} phone - Raw phone number
 * @returns {string} - Normalized phone number
 */
export function normalizePhone(phone) {
    // Remove spaces, dashes, parentheses
    let normalized = phone.replace(/[\s\-\(\)\.]/g, '');

    // Ensure it starts with + for international format
    if (!normalized.startsWith('+')) {
        // Assume US number if 10 digits
        if (normalized.length === 10) {
            normalized = '+1' + normalized;
        } else if (normalized.length === 11 && normalized.startsWith('1')) {
            normalized = '+' + normalized;
        }
    }

    return normalized;
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export function isValidPhone(phone) {
    // Basic validation: should start with + and have at least 10 digits
    const normalized = normalizePhone(phone);
    return /^\+\d{10,15}$/.test(normalized);
}
