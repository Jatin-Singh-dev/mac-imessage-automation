// Configuration for iMessage Blaster
// Edit these settings to customize your messaging behavior

export const CONFIG = {
    // === DATA FILES ===
    csvFile: './data/contacts.csv',
    blacklistFile: './data/blacklist.csv',
    deliveryLogFile: './data/delivery_log.csv',

    // === MESSAGE TEMPLATE ===
    // Use {ColumnName} to insert values from your CSV
    // Example: "Hi {Name}! Your appointment is on {Date}."
    messageTemplate: "Hello {Name} how are you?",

    // === TIMING & DELAYS ===
    minDelaySeconds: 5,         // Minimum delay between messages
    maxDelaySeconds: 20,        // Maximum delay between messages

    // === SESSION LIMITS (Human-like behavior) ===
    sessionLimit: 15,           // Messages before mandatory break
    breakDurationMinutes: 15,   // Duration of mandatory break

    // === DAILY LIMITS ===
    dailyLimit: 50,             // Maximum messages per day (safety cap)

    // === OPT-OUT KEYWORDS ===
    // If someone replies with any of these, they get blacklisted
    optOutKeywords: ['STOP', 'UNSUBSCRIBE', 'REMOVE', 'OPTOUT', 'OPT OUT', 'CANCEL'],

    // Confirmation message sent when someone opts out
    optOutConfirmation: "You've been unsubscribed. No further messages will be sent.",

    // === TEST MODE ===
    // Set to true to see what would be sent without actually sending
    testMode: false,

    // === DEBUG ===
    debug: false                // Enable verbose logging
};
