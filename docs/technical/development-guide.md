# Development Guide

This guide covers development-specific information for Nodebit contributors and maintainers.

## 🔍 Activity Logging System

Nodebit uses an internal activity logging system for all debugging and verification. **Never use `console.log()`** - instead, use the workspace activity logging system.

### Logging Pattern

**For debugging and verification:**
```javascript
// ✅ CORRECT: Use activity logging
fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Your debug message here' })
});

// ❌ WRONG: Never use console.log
console.log('This will not be visible in the activity log');
```

### Checking Activity Logs

1. Open Node-RED workspace properties
2. Click "Open Workspace Admin" 
3. Check the "Recent Activity" section for all logged messages

### Available Endpoints

- `/api/test-log` - General debugging and verification messages
- `/api/log-debug` - Debug-level messages  
- `/api/activity` - View all activity records
- `/api/activity/stats` - Activity statistics

### Development Guidelines

- **Always use activity logging** for debugging and verification
- **Check Recent Activity** in workspace admin for diagnostic information
- **No console.log statements** - they won't be visible in the activity system
- **Activity logs persist** across sessions and provide historical debugging data

## 🏗️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Node-RED installed globally or locally
- Git

### Local Development
```bash
git clone https://github.com/nodebit/nodebit
cd nodebit
npm install
npm link
cd ~/.node-red
npm link nodebit
```

### Testing
- Use the activity logging system for all debugging
- Check workspace distributed dashboard for real-time feedback
- Test node functionality through Node-RED flows

## 📁 Project Structure

```
nodebit/
├── nodes/workspace/          # Main workspace configuration node
│   ├── api/                  # REST API endpoints
│   ├── ui/                   # Web interface components
│   ├── lib/                  # Core functionality
│   └── utils/                # Utility functions
├── nodes/database/           # Database operations node
├── nodes/file/               # File operations node
├── utils/                    # Shared utilities
└── docs/                     # Documentation
```

## 🔧 Key Development Areas

1. **IPFS Integration**: Replace mock operations with real Helia calls
2. **OrbitDB Integration**: Implement actual database operations
3. **Network Discovery**: Add automatic IPFS node detection
4. **Security Features**: Implement encryption and access control
5. **Performance Optimization**: Caching, batching, and efficiency improvements

## 🐛 Debugging Workflow

1. **Use activity logging** instead of console.log
2. **Check Recent Activity** in workspace admin
3. **Test through Node-RED flows** rather than direct API calls
4. **Verify node configuration** through workspace properties
5. **Monitor network connections** through distributed dashboard

## 📝 Code Standards

- Use activity logging for all debugging
- Follow Node-RED node development patterns
- Maintain backward compatibility
- Document API changes
- Test through Node-RED interface 