import { addToBlacklist } from './blacklist.js';
import { CONFIG } from './config.js';

/**
 * Reply Watcher
 * Monitors for opt-out replies and auto-blacklists
 */

/**
 * Check if a message contains opt-out keywords
 * @param {string} text - Message text
 * @param {string[]} keywords - Opt-out keywords
 * @returns {boolean}
 */
export function isOptOutMessage(text, keywords) {
    const upperText = text.toUpperCase().trim();
    return keywords.some(keyword => upperText.includes(keyword.toUpperCase()));
}

/**
 * Start watching for incoming replies
 * @param {Object} sdk - IMessageSDK instance
 * @param {Object} options - Watch options
 * @param {string} options.blacklistFile - Path to blacklist file
 * @param {string[]} options.optOutKeywords - Keywords that trigger opt-out
 * @param {string} options.optOutConfirmation - Confirmation message to send
 * @param {Function} options.onOptOut - Callback when someone opts out
 */
export async function startReplyWatcher(sdk, options) {
    const {
        blacklistFile,
        optOutKeywords,
        optOutConfirmation,
        onOptOut
    } = options;

    console.log('👀 Starting reply watcher...');
    console.log(`   Watching for keywords: ${optOutKeywords.join(', ')}`);

    await sdk.startWatching({
        onDirectMessage: async (msg) => {
            // Check if message is from someone else (not us)
            if (msg.is_from_me) return;

            const messageText = msg.text || '';
            const sender = msg.sender;

            console.log(`📨 New message from ${sender}: "${messageText.substring(0, 50)}..."`);

            // Check for opt-out keywords
            if (isOptOutMessage(messageText, optOutKeywords)) {
                console.log(`⚠️  Opt-out detected from ${sender}`);

                // Add to blacklist
                addToBlacklist(blacklistFile, sender, `Replied: ${messageText.substring(0, 50)}`);

                // Send confirmation
                try {
                    await sdk.send(sender, optOutConfirmation);
                    console.log(`   ✅ Sent unsubscribe confirmation to ${sender}`);
                } catch (error) {
                    console.error(`   ❌ Failed to send confirmation: ${error.message}`);
                }

                // Call callback if provided
                if (onOptOut) {
                    onOptOut(sender, messageText);
                }
            }
        },
        onError: (error) => {
            console.error('❌ Watcher error:', error.message);
        }
    });
}

/**
 * Stop the reply watcher
 * @param {Object} sdk - IMessageSDK instance
 */
export function stopReplyWatcher(sdk) {
    sdk.stopWatching();
    console.log('👋 Reply watcher stopped');
}
