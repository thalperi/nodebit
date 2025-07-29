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

## 🔧 OrbitDB Integration Debugging

**Current Status**: Critical initialization failures preventing DID/ACL system functionality.

### Error Summary

**Primary Error**: `Cannot read properties of undefined (reading 'addEventListener')`
- **Location**: OrbitDB sync logic (`/node_modules/@orbitdb/core/src/sync.js:283:14`)
- **Context**: Occurs during database creation for both DID and ACL registries
- **Impact**: System OrbitDB, DID registry, and ACL registry all fail to initialize

### Progress Made

1. **Import Resolution** ✅
   - Fixed `MemoryStorage is not a constructor` error
   - Corrected CommonJS destructuring: `const { createOrbitDB, MemoryStorage } = require('@orbitdb/core')`
   - Removed duplicate dynamic imports

2. **API Alignment** ✅
   - Updated to official [OrbitDB API](https://api.orbitdb.org/) patterns
   - Simplified to: `createOrbitDB({ ipfs: helia })` and `orbitdb.open(name, { type: 'keyvalue' })`

3. **Directory Isolation** ✅
   - Added unique directory suffixes to prevent `LEVEL_LOCKED` errors
   - Path: `path.join(dataDir, 'system-orbitdb', uniqueId)`

4. **Version Verification** ✅
   - Confirmed compatible versions: `@orbitdb/core@3.0.2`, `helia@5.4.2`

### Current Investigation Areas

1. **Event Emitter Context**
   - OrbitDB sync logic expects event emitter from Helia/libp2p
   - Error suggests `undefined` object being accessed for `addEventListener`
   - Need to verify Helia's libp2p provides proper event context

2. **Initialization Sequence**
   - Current: Helia creation → libp2p status check → OrbitDB creation → Database opening
   - May need additional readiness checks or different sequence

3. **Storage Backend**
   - Removed explicit `MemoryStorage` to use defaults
   - May need to test different storage configurations

### Debugging Commands

```bash
# Check current workspace activity log
curl -s http://localhost:1880/nodebit/workspace/WORKSPACE_ID/api/activity | jq .

# Check system status
curl -s http://localhost:1880/nodebit/workspace/WORKSPACE_ID/api/debug/did-status | jq .

# Verify OrbitDB exports
node -e "console.log(Object.keys(require('@orbitdb/core')))"

# Check workspace ID from flows
curl -s http://localhost:1880/flows | grep -oE 'nb-workspace_[a-zA-Z0-9]+' | head -1
```

### Key Files

- **`lib/nodebit-core.js`** - Lines 935-1040: `_initializeDIDACLSystem()` method
- **Error Location**: `/node_modules/@orbitdb/core/src/sync.js:283` - `addEventListener` call
- **Network Creation**: Lines 587-660: Helia instance creation and readiness checks

### Documentation Resources

- [OrbitDB API Documentation](https://api.orbitdb.org/) - Official patterns and usage
- [Helia API Documentation](https://ipfs.github.io/helia/) - Complete module documentation  
- [Helia Wiki](https://github.com/ipfs/helia/wiki) - Migration guides and troubleshooting
- [Node-RED API Reference](https://nodered.org/docs/api/) - Runtime and module APIs

### Next Session Tasks

1. **Debug Event Emitter Context**
   - Investigate what OrbitDB sync expects from Helia/libp2p
   - Verify event emitter availability and properties
   - Test manual event emitter creation if needed

2. **Test Initialization Variations**
   - Try different OrbitDB creation patterns
   - Test database opening with minimal options
   - Verify Helia readiness indicators

3. **Enable Full System**
   - Once OrbitDB works, verify DID/ACL system initialization
   - Test system status indicators update properly
   - Begin file management testing with working OrbitDB

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