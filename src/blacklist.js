import fs from 'fs';
import { normalizePhone } from './csvParser.js';

/**
 * Blacklist Management
 * Handles opt-out tracking and filtering
 */

const BLACKLIST_HEADER = 'Phone,Reason,Timestamp\n';

/**
 * Load blacklisted phone numbers
 * @param {string} filepath - Path to blacklist CSV
 * @returns {Set<string>} - Set of blacklisted phone numbers
 */
export function loadBlacklist(filepath) {
    const blacklist = new Set();

    if (!fs.existsSync(filepath)) {
        // Create empty blacklist file
        fs.writeFileSync(filepath, BLACKLIST_HEADER);
        return blacklist;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header

    for (const line of lines) {
        const [phone] = line.split(',');
        if (phone && phone.trim()) {
            blacklist.add(normalizePhone(phone.trim()));
        }
    }

    return blacklist;
}

/**
 * Add a phone number to the blacklist
 * @param {string} filepath - Path to blacklist CSV
 * @param {string} phone - Phone number to blacklist
 * @param {string} reason - Reason for blacklisting
 */
export function addToBlacklist(filepath, phone, reason = 'STOP reply') {
    const normalized = normalizePhone(phone);
    const timestamp = new Date().toISOString();

    // Create file with header if it doesn't exist
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, BLACKLIST_HEADER);
    }

    // Append new entry
    const entry = `${normalized},"${reason}",${timestamp}\n`;
    fs.appendFileSync(filepath, entry);

    console.log(`   🚫 Added ${normalized} to blacklist: ${reason}`);
}

/**
 * Check if a phone number is blacklisted
 * @param {Set<string>} blacklist - Set of blacklisted numbers
 * @param {string} phone - Phone to check
 * @returns {boolean}
 */
export function isBlacklisted(blacklist, phone) {
    return blacklist.has(normalizePhone(phone));
}

/**
 * Filter contacts to remove blacklisted numbers
 * @param {Object[]} contacts - Array of contact objects
 * @param {Set<string>} blacklist - Set of blacklisted numbers
 * @returns {Object[]} - Filtered contacts
 */
export function filterBlacklisted(contacts, blacklist) {
    return contacts.filter(contact => !isBlacklisted(blacklist, contact.Phone));
}
