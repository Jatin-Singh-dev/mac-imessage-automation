# iMessage Blaster

Professional iMessage automation tool with built-in safety features.

## Prerequisites

1. **Sign into Messages**: Open Messages app on your Mac and sign in with Apple ID
2. **Grant Full Disk Access**: System Settings → Privacy & Security → Full Disk Access → Add your terminal
3. **Optional - SMS Forwarding**: iPhone Settings → Messages → Text Message Forwarding → Enable your Mac

## Installation

```bash
cd imessage-blast
npm install
```

## Quick Start

### 1. Edit Your Contacts

Edit `data/contacts.csv` with your recipients:

```csv
Phone,Name,Date,Age,Category
+15550199999,John,Feb 12th,25,VIP
+15550200000,Jane,March 1st,30,Standard
```

### 2. Customize Your Message

Edit `src/config.js`:

```javascript
messageTemplate: "Hi {Name}! Your appointment is on {Date}. See you then!"
```

Use `{ColumnName}` to insert any CSV column.

### 3. Test Run (Recommended First!)

```bash
npm run test:dry
```

This shows what would be sent without actually sending.

### 4. Send Messages

```bash
npm start
```

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Send messages to all contacts |
| `npm run test:dry` | Preview without sending |
| `npm run watch` | Monitor for opt-out replies |

## Configuration

Edit `src/config.js` to customize:

| Setting | Default | Description |
|---------|---------|-------------|
| `minDelaySeconds` | 10 | Minimum delay between messages |
| `maxDelaySeconds` | 30 | Maximum delay between messages |
| `sessionLimit` | 15 | Messages before mandatory break |
| `breakDurationMinutes` | 15 | Break duration |
| `dailyLimit` | 100 | Max messages per day |

## Safety Features

- **Delivery Tracking**: All attempts logged to `data/delivery_log.csv`
- **Blacklist**: Opt-outs saved to `data/blacklist.csv` and auto-skipped
- **Auto Opt-Out**: Watch mode detects STOP replies and blacklists them
- **Session Breaks**: Automatic pauses to mimic human behavior
- **Daily Caps**: Prevents over-sending

## File Structure

```
imessage-blast/
├── index.js           # Main entry point
├── src/
│   ├── config.js      # All settings
│   ├── templateEngine.js
│   ├── csvParser.js
│   ├── blacklist.js
│   ├── logger.js
│   ├── cooldown.js
│   └── watcher.js
└── data/
    ├── contacts.csv       # Your contacts (edit this)
    ├── blacklist.csv      # Auto-managed opt-outs
    └── delivery_log.csv   # Delivery results
```

## Tips

- **Start small**: Test with 10-20 contacts first
- **Run watch mode**: Keep `npm run watch` running in a separate terminal to catch opt-outs
- **Check logs**: Review `data/delivery_log.csv` after each run
