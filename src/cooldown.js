/**
 * Cooldown Manager
 * Handles human-like timing patterns and session breaks
 */

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get a random delay between min and max seconds
 * @param {number} minSeconds - Minimum delay in seconds
 * @param {number} maxSeconds - Maximum delay in seconds
 * @returns {number} - Random delay in milliseconds
 */
export function getRandomDelay(minSeconds, maxSeconds) {
    const delaySeconds = Math.random() * (maxSeconds - minSeconds) + minSeconds;
    return Math.floor(delaySeconds * 1000);
}

/**
 * Check if it's time for a session break
 * @param {number} messagesSent - Number of messages sent in current session
 * @param {number} sessionLimit - Messages before break
 * @returns {boolean}
 */
export function shouldTakeBreak(messagesSent, sessionLimit) {
    return messagesSent > 0 && messagesSent % sessionLimit === 0;
}

/**
 * Get break duration with some randomness
 * @param {number} baseDurationMinutes - Base break duration in minutes
 * @returns {number} - Break duration in milliseconds (±20% variance)
 */
export function getBreakDuration(baseDurationMinutes) {
    // Add ±20% variance for more human-like behavior
    const variance = 0.2;
    const multiplier = 1 + (Math.random() * 2 - 1) * variance;
    return Math.floor(baseDurationMinutes * 60 * 1000 * multiplier);
}

/**
 * Format milliseconds into human-readable string
 * @param {number} ms - Milliseconds
 * @returns {string} - Formatted string (e.g., "5m 30s")
 */
export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
}
