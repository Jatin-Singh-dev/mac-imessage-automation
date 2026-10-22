#!/usr/bin/env node

/**
 * iMessage Blaster - Professional Mass Messaging Tool
 * 
 * Usage:
 *   node index.js blast         - Send messages to all contacts
 *   node index.js blast --test  - Dry run (don't actually send)
 *   node index.js watch         - Monitor for opt-out replies
 */

import { IMessageSDK } from '@photon-ai/imessage-kit';
import { CONFIG } from './src/config.js';
import { buildMessage, validatePlaceholders } from './src/templateEngine.js';
import { loadContacts, getCSVColumns, isValidPhone } from './src/csvParser.js';
import { loadBlacklist, filterBlacklisted } from './src/blacklist.js';
import { initDeliveryLog, logDelivery, getTodaysSentCount, getDeliveryStats } from './src/logger.js';
import { sleep, getRandomDelay, shouldTakeBreak, getBreakDuration, formatDuration } from './src/cooldown.js';
import { startReplyWatcher, stopReplyWatcher } from './src/watcher.js';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'blast';
const isTestMode = args.includes('--test') || CONFIG.testMode;

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n🔥 Unhandled Promise Rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('\n🔥 Uncaught Exception:', error.message);
    if (CONFIG.debug) console.error(error.stack);
    process.exit(1);
});

/**
 * Main blast function - sends messages to all contacts
 */
async function runBlast() {
    console.log('\n🚀 iMessage Blaster Starting...\n');
    console.log(`   Mode: ${isTestMode ? '🧪 TEST (no actual sending)' : '📤 LIVE'}`);

    const sdk = new IMessageSDK({ debug: CONFIG.debug });
    let sessionMessageCount = 0;
    let totalSent = 0;

    try {
        // 1. Initialize delivery log
        initDeliveryLog(CONFIG.deliveryLogFile);

        // 2. Check daily limit
        const todaysSent = getTodaysSentCount(CONFIG.deliveryLogFile);
        const remainingToday = CONFIG.dailyLimit - todaysSent;

        console.log(`   Daily limit: ${todaysSent}/${CONFIG.dailyLimit} used`);

        if (remainingToday <= 0) {
            console.log('\n🛑 Daily limit reached! Try again tomorrow.');
            return;
        }

        // 3. Load and validate CSV
        console.log(`\n📂 Loading contacts from ${CONFIG.csvFile}...`);

        let columns, contacts;
        try {
            columns = await getCSVColumns(CONFIG.csvFile);
            const result = await loadContacts(CONFIG.csvFile);
            contacts = result.contacts;
        } catch (csvError) {
            console.error(`\n❌ CSV Error: ${csvError.message}`);
            return;
        }

        console.log(`   Found ${contacts.length} contacts`);
        console.log(`   Columns: ${columns.join(', ')}`);

        if (contacts.length === 0) {
            console.log('\n⚠️  No valid contacts found in CSV. Make sure there is a "Phone" column.');
            return;
        }

        // 4. Validate template placeholders
        const validation = validatePlaceholders(CONFIG.messageTemplate, columns);
        if (!validation.valid) {
            console.error(`\n❌ Template error: Missing columns: ${validation.missing.join(', ')}`);
            console.error(`   Available columns: ${columns.join(', ')}`);
            return;
        }
        console.log(`   Template placeholders: {${validation.found.join('}, {')}}`);

        // 5. Load blacklist and filter contacts
        console.log(`\n🚫 Loading blacklist from ${CONFIG.blacklistFile}...`);
        const blacklist = loadBlacklist(CONFIG.blacklistFile);
        const filteredContacts = filterBlacklisted(contacts, blacklist);
        const blacklistedCount = contacts.length - filteredContacts.length;

        console.log(`   Blacklisted: ${blacklist.size} numbers`);
        console.log(`   Contacts after filtering: ${filteredContacts.length}`);

        if (blacklistedCount > 0) {
            console.log(`   ⚠️  Skipping ${blacklistedCount} blacklisted contacts`);
        }

        if (filteredContacts.length === 0) {
            console.log('\n⚠️  No contacts to message after filtering.');
            return;
        }

        // 6. Apply daily limit
        const contactsToProcess = filteredContacts.slice(0, remainingToday);

        if (contactsToProcess.length < filteredContacts.length) {
            console.log(`   ⚠️  Limiting to ${remainingToday} contacts (daily cap)`);
        }

        console.log(`\n📤 Starting to send ${contactsToProcess.length} messages...`);
        console.log(`   Delay: ${CONFIG.minDelaySeconds}-${CONFIG.maxDelaySeconds}s between messages`);
        console.log(`   Session break: After every ${CONFIG.sessionLimit} messages\n`);

        // 7. Process each contact
        for (let i = 0; i < contactsToProcess.length; i++) {
            const contact = contactsToProcess[i];
            const phone = contact.Phone;
            const name = contact.Name || phone;

            console.log(`[${i + 1}/${contactsToProcess.length}] Processing: ${name}`);

            // Validate phone number
            if (!isValidPhone(phone)) {
                console.log(`   ⚠️  Invalid phone format, skipping`);
                logDelivery(CONFIG.deliveryLogFile, {
                    phone,
                    name,
                    status: 'SKIPPED_INVALID',
                    error: 'Invalid phone format'
                });
                continue;
            }

            // Build personalized message
            const message = buildMessage(CONFIG.messageTemplate, contact);

            if (isTestMode) {
                console.log(`   📝 [TEST] Would send: "${message}"`);
                logDelivery(CONFIG.deliveryLogFile, {
                    phone,
                    name,
                    status: 'SUCCESS',
                    error: 'TEST MODE'
                });
                totalSent++;
            } else {
                try {
                    await sdk.send(phone, message);
                    console.log(`   ✅ Sent successfully!`);
                    logDelivery(CONFIG.deliveryLogFile, {
                        phone,
                        name,
                        status: 'SUCCESS'
                    });
                    totalSent++;
                } catch (error) {
                    console.error(`   ❌ Failed: ${error.message}`);
                    logDelivery(CONFIG.deliveryLogFile, {
                        phone,
                        name,
                        status: 'FAILED',
                        error: error.message
                    });
                }
            }

            sessionMessageCount++;

            // Check for session break
            if (shouldTakeBreak(sessionMessageCount, CONFIG.sessionLimit) && i < contactsToProcess.length - 1) {
                const breakTime = getBreakDuration(CONFIG.breakDurationMinutes);
                console.log(`\n☕ Session break! ${sessionMessageCount} messages sent.`);
                console.log(`   Taking a ${formatDuration(breakTime)} break to avoid detection...`);

                if (!isTestMode) {
                    await sleep(breakTime);
                }

                console.log(`   ✅ Break over, resuming...\n`);
            } else if (i < contactsToProcess.length - 1) {
                // Random delay between messages
                const delay = getRandomDelay(CONFIG.minDelaySeconds, CONFIG.maxDelaySeconds);
                console.log(`   ⏳ Waiting ${formatDuration(delay)}...`);

                if (!isTestMode) {
                    await sleep(delay);
                }
            }
        }

        // 8. Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 Session Complete!');
        console.log('='.repeat(50));
        console.log(`   Messages attempted: ${contactsToProcess.length}`);
        console.log(`   Successful: ${totalSent}`);
        console.log(`   Today's total: ${todaysSent + totalSent}/${CONFIG.dailyLimit}`);
        console.log(`\n📁 Delivery log: ${CONFIG.deliveryLogFile}`);

    } catch (error) {
        console.error('\n🔥 CRITICAL ERROR:', error.message);
        if (CONFIG.debug) {
            console.error(error.stack);
        }
    } finally {
        if (!isTestMode) {
            try {
                await sdk.close();
            } catch (e) {
                // Ignore close errors
            }
        }
        console.log('\n👋 Done!\n');
    }
}

/**
 * Watch mode - monitors for opt-out replies
 */
async function runWatch() {
    console.log('\n👀 iMessage Reply Watcher Starting...\n');
    console.log('   Watching for opt-out keywords:', CONFIG.optOutKeywords.join(', '));
    console.log('   Blacklist file:', CONFIG.blacklistFile);
    console.log('\n   Press Ctrl+C to stop.\n');

    const sdk = new IMessageSDK({ debug: CONFIG.debug });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Stopping watcher...');
        stopReplyWatcher(sdk);
        sdk.close();
        process.exit(0);
    });

    try {
        await startReplyWatcher(sdk, {
            blacklistFile: CONFIG.blacklistFile,
            optOutKeywords: CONFIG.optOutKeywords,
            optOutConfirmation: CONFIG.optOutConfirmation,
            onOptOut: (sender, message) => {
                console.log(`📝 Logged opt-out: ${sender}`);
            }
        });
    } catch (error) {
        console.error('🔥 Watcher error:', error.message);
        sdk.close();
    }
}

// Main entry point
switch (command) {
    case 'blast':
        runBlast();
        break;
    case 'watch':
        runWatch();
        break;
    default:
        console.log(`
iMessage Blaster - Usage:

  node index.js blast         Send messages to all contacts
  node index.js blast --test  Dry run (preview without sending)
  node index.js watch         Monitor for opt-out replies

Configuration: Edit src/config.js to customize settings.
        `);
}
