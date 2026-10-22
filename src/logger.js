import fs from 'fs';

/**
 * Delivery Status Logger
 * Tracks the result of every message attempt
 */

const LOG_HEADER = 'Timestamp,Phone,Name,Status,Error\n';

/**
 * Initialize the delivery log file
 * @param {string} filepath - Path to log file
 */
export function initDeliveryLog(filepath) {
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, LOG_HEADER);
    }
}

/**
 * Log a delivery attempt
 * @param {string} filepath - Path to log file
 * @param {Object} entry - Log entry
 * @param {string} entry.phone - Phone number
 * @param {string} entry.name - Contact name (optional)
 * @param {string} entry.status - SUCCESS | FAILED | SKIPPED_BLACKLISTED | SKIPPED_INVALID
 * @param {string} entry.error - Error message (optional)
 */
export function logDelivery(filepath, { phone, name = '', status, error = '' }) {
    const timestamp = new Date().toISOString();

    // Escape commas and quotes in fields
    const escapedName = name.replace(/"/g, '""');
    const escapedError = error.replace(/"/g, '""');

    const entry = `${timestamp},"${phone}","${escapedName}",${status},"${escapedError}"\n`;
    fs.appendFileSync(filepath, entry);
}

/**
 * Get delivery statistics from log
 * @param {string} filepath - Path to log file
 * @returns {Object} - Statistics object
 */
export function getDeliveryStats(filepath) {
    if (!fs.existsSync(filepath)) {
        return { total: 0, success: 0, failed: 0, skipped: 0 };
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n').slice(1).filter(line => line.trim());

    const stats = {
        total: lines.length,
        success: 0,
        failed: 0,
        skipped: 0
    };

    for (const line of lines) {
        if (line.includes(',SUCCESS,')) stats.success++;
        else if (line.includes(',FAILED,')) stats.failed++;
        else if (line.includes(',SKIPPED_')) stats.skipped++;
    }

    return stats;
}

/**
 * Get today's message count from log
 * @param {string} filepath - Path to log file
 * @returns {number} - Number of messages sent today
 */
export function getTodaysSentCount(filepath) {
    if (!fs.existsSync(filepath)) {
        return 0;
    }

    const today = new Date().toISOString().split('T')[0];
    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n').slice(1).filter(line => line.trim());

    return lines.filter(line => {
        return line.startsWith(today) && line.includes(',SUCCESS,');
    }).length;
}
