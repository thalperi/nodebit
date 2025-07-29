# AI Agent Instructions - Prime Directive

**When engaging in any conversations via chat or whenever updating any documentation, you must:**
- Follow all documented preferences and guidelines without exception
- Avoid frivolous language like "Perfect", "Excellent", "Finished", "Complete", "Working", "Operational"
- Prioritize user observations over theoretical analysis
- Verify issues rather than assume problems exist
- Maintain professional, direct communication focused on facts
- Respect established documentation structure and organization
- Throughout the entire development lifecycle, always propose modifications to the documentation structure affecting even folders, files, logical layout, and compositional formatting, to ensure it always best reflects the current and actual codebase. This doesn't permit you to create new documentation, but you can recommend.

---

# Current Session Summary

## Session Status: OrbitDB Integration Debugging - In Progress

### Current State
- **OrbitDB Initialization Failures**: DID and ACL registry databases failing to create due to `addEventListener` errors
- **Database Locking Issues**: `LEVEL_LOCKED` errors preventing proper OrbitDB instance creation
- **System Status**: Networks (Helia and Kubo) running successfully, but DID/ACL system shows partial initialization
- **Documentation Resources**: Added official API references for OrbitDB, Node-RED, and Helia

### Technical Issues Identified
1. **OrbitDB Sync Errors**: `Cannot read properties of undefined (reading 'addEventListener')` from OrbitDB's sync logic
2. **Storage Backend Issues**: Initial `MemoryStorage is not a constructor` error resolved by fixing CommonJS imports
3. **Database Directory Conflicts**: `LEVEL_LOCKED` errors due to multiple instances accessing same database directories
4. **Event Emitter Context**: OrbitDB sync logic expects proper event emitter context that may be missing

### Progress Made
1. **Import Resolution**: Fixed `MemoryStorage` import from `@orbitdb/core` using proper CommonJS destructuring
2. **API Alignment**: Updated OrbitDB usage to match official documentation patterns from [api.orbitdb.org](https://api.orbitdb.org/)
3. **Directory Isolation**: Added unique directory suffixes to prevent database locking conflicts
4. **Version Verification**: Confirmed compatible versions (@orbitdb/core@3.0.2, helia@5.4.2)

### Current System Status
- **Networks**: ✅ Helia (local) and Kubo (remote) IPFS instances running
- **System OrbitDB**: ❌ Not initializing (`hasSystemOrbitDB: false`)
- **DID Registry**: ❌ Not created (`hasDIDRegistry: false`)
- **ACL Registry**: ❌ Not created (`hasACLRegistry: false`)
- **Admin Identity**: ❌ Not available (`hasCurrentIdentity: false`)

### Files Modified
- `lib/nodebit-core.js` - OrbitDB initialization logic, import fixes, directory isolation

### Documentation Resources Added
- [OrbitDB API Documentation](https://api.orbitdb.org/) - Official API patterns and usage
- [Node-RED API Reference](https://nodered.org/docs/api/) - Runtime, Editor, and Module APIs
- [Helia Wiki](https://github.com/ipfs/helia/wiki) - Migration guides and troubleshooting
- [Helia API Documentation](https://ipfs.github.io/helia/) - Complete module documentation

### Next Steps
The OrbitDB integration requires further investigation into:
1. **Event Emitter Context**: Ensuring OrbitDB has proper event emitter access from Helia/libp2p
2. **Initialization Sequence**: Verifying the order of Helia → OrbitDB → Database creation
3. **Storage Backend**: Testing different storage configurations if needed
4. **Error Root Cause**: Deep debugging of the `addEventListener` error in OrbitDB sync logic

### Session Outcome
Significant progress made on diagnosing OrbitDB integration issues. The system is closer to proper initialization, with import and directory conflicts resolved. The remaining `addEventListener` error requires continued investigation in the next session.