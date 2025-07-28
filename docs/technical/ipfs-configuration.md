# IPFS Configuration Options for Nodebit

**Warning: Nodebit is in early development. Most configuration options are incomplete or subject to change.**

For network selection logic and user-facing policy, see [network-selection-strategy.md](./network-selection-strategy.md).

This document outlines all IPFS configuration options for Nodebit's implementation. Each option includes technical details, use cases, and recommendations for default values.

## Core IPFS Network Configuration

(See [network-selection-strategy.md](./network-selection-strategy.md) for how networks are chosen for operations.)

### 1. Swarm Configuration

**Purpose**: Controls peer-to-peer networking and connectivity

#### Listen Addresses
```javascript
addresses: {
    listen: [
        '/ip4/0.0.0.0/tcp/4001',           // IPv4 TCP
        '/ip4/0.0.0.0/tcp/4002/ws',        // IPv4 WebSocket
        '/ip6/::/tcp/4001',                // IPv6 TCP
        '/ip6/::/tcp/4002/ws'              // IPv6 WebSocket
    ]
}
```

**Options**:
- **TCP Port**: Default 4001, configurable for multiple instances
- **WebSocket Port**: Default 4002, for browser connectivity
- **IPv6 Support**: Enable/disable IPv6 networking
- **Interface Binding**: Bind to specific network interfaces

**Recommendations**:
- Default TCP: 4001 (standard IPFS port)
- Default WebSocket: 4002
- Enable IPv6: true (future compatibility)
- Bind to all interfaces: 0.0.0.0 (maximum connectivity)

#### Announce Addresses
```javascript
addresses: {
    announce: [
        '/ip4/192.168.1.100/tcp/4001',     // Local network
        '/dns4/mynode.example.com/tcp/4001' // Public domain
    ]
}
```

**Options**:
- **Public IP**: Announce public IP for external connectivity
- **Domain Names**: Use DNS names for dynamic IP environments
- **Port Mapping**: Handle NAT/firewall port forwarding

**Recommendations**:
- Auto-detect public IP: true
- Allow manual override: true
- Default to local network announcement only

### 2. Bootstrap Configuration

**Purpose**: Initial peer discovery and network joining

```javascript
bootstrap: [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'
]
```

**Options**:
- **Default Bootstrap Nodes**: Use standard IPFS bootstrap nodes
- **Custom Bootstrap**: Add organization-specific bootstrap nodes
- **Private Networks**: Use only custom bootstrap for private networks
- **Bootstrap Timeout**: How long to wait for bootstrap connections

**Recommendations**:
- Use default IPFS bootstrap: true
- Allow custom additions: true
- Bootstrap timeout: 30 seconds

### 3. Connection Management

#### Connection Limits
```javascript
connectionManager: {
    maxConnections: 100,        // Maximum total connections
    minConnections: 10,         // Minimum to maintain
    pollInterval: 2000,         // Check interval (ms)
    autoDialInterval: 10000     // Auto-dial interval (ms)
}
```

**Options**:
- **Max Connections**: Prevent resource exhaustion
- **Min Connections**: Ensure network connectivity
- **Connection Pruning**: Remove idle connections
- **Dial Strategy**: How aggressively to seek new peers

**Recommendations**:
- Max connections: 100 (good balance)
- Min connections: 10 (maintain connectivity)
- Auto-dial: enabled (maintain peer diversity)

#### Peer Discovery
```javascript
discovery: {
    mdns: {
        enabled: true,          // Local network discovery
        interval: 10000         // Discovery interval (ms)
    },
    bootstrap: {
        enabled: true,
        interval: 30000
    },
    dht: {
        enabled: true,          // DHT-based discovery
        mode: 'auto'           // auto, client, server
    }
}
```

**Options**:
- **mDNS**: Discover peers on local network
- **DHT**: Distributed hash table for peer discovery
- **Bootstrap**: Use bootstrap nodes for discovery
- **Discovery Intervals**: How often to search for peers

**Recommendations**:
- Enable all discovery methods: true
- mDNS interval: 10 seconds
- DHT mode: auto (adapt to network conditions)

## 💾 Storage Configuration

### 1. Datastore Configuration

**Purpose**: Where IPFS stores metadata and small data

```javascript
datastore: {
    type: 'fs',                 // File system storage
    path: '.nodebit/datastore', // Storage directory
    sharding: false,            // Directory sharding
    compression: 'none'         // Data compression
}
```

**Options**:
- **Storage Type**: File system, memory, LevelDB, etc.
- **Storage Path**: Where to store datastore files
- **Sharding**: Distribute files across subdirectories
- **Compression**: Compress stored data

**Recommendations**:
- Type: fs (persistent file storage)
- Path: configurable via workspace dataDir
- Sharding: false (simpler for small datasets)
- Compression: none (avoid complexity)

### 2. Blockstore Configuration

**Purpose**: Where IPFS stores content blocks (the actual data)

```javascript
blockstore: {
    type: 'fs',                 // File system storage
    path: '.nodebit/blocks',    // Storage directory
    sharding: true,             // Enable sharding for performance
    compression: 'none'         // Block compression
}
```

**Options**:
- **Storage Type**: File system, memory, custom
- **Storage Path**: Where to store block files
- **Sharding**: Improve performance with many blocks
- **Deduplication**: Remove duplicate blocks

**Recommendations**:
- Type: fs (persistent storage)
- Path: configurable via workspace dataDir
- Sharding: true (better performance)
- Deduplication: true (save space)

### 3. Repository Configuration

```javascript
repo: {
    autoMigrate: true,          // Auto-upgrade repo format
    repoLock: 'fs',            // Lock mechanism
    storageBackends: {
        root: 'fs',
        blocks: 'fs',
        datastore: 'fs'
    }
}
```

**Options**:
- **Auto Migration**: Automatically upgrade repo formats
- **Lock Mechanism**: Prevent concurrent access
- **Storage Backends**: Different storage for different data types

**Recommendations**:
- Auto migrate: true (keep up with IPFS updates)
- Lock: fs (prevent corruption)
- Unified storage: fs for all components

## 🔒 Security Configuration

### 1. Private Networks

```javascript
swarm: {
    key: '/key/swarm/psk/1.0.0/\n/base16/\n<64-char-hex-key>',
    disableNatPortMap: false
}
```

**Options**:
- **Private Key**: Restrict network to specific peers
- **NAT Traversal**: Enable/disable automatic port mapping
- **Firewall Rules**: Configure connection restrictions

**Recommendations**:
- Private networks: optional (user configurable)
- NAT traversal: enabled (better connectivity)
- Default to public network participation

### 2. Content Routing Security

```javascript
routing: {
    type: 'dht',               // DHT, delegated, or none
    dht: {
        enabled: true,
        mode: 'auto',          // auto, client, server
        validators: {},        // Custom validators
        selectors: {}          // Custom selectors
    }
}
```

**Options**:
- **Routing Type**: How to find content and peers
- **DHT Mode**: Participation level in distributed hash table
- **Content Validation**: Verify content authenticity
- **Provider Records**: How long to cache provider info

**Recommendations**:
- Routing: DHT (standard IPFS routing)
- DHT mode: auto (adapt to capabilities)
- Enable validation: true (security)

## ⚡ Performance Configuration

### 1. Bitswap Configuration

**Purpose**: Protocol for exchanging blocks with other peers

```javascript
bitswap: {
    maxMessageSize: 512 * 1024,     // 512KB max message
    sendDontHaves: true,            // Send "don't have" messages
    sendWantLists: true,            // Send want lists to peers
    maxOutstandingBytesPerPeer: 1024 * 1024 // 1MB per peer
}
```

**Options**:
- **Message Size**: Maximum size of bitswap messages
- **Want List Strategy**: How to request blocks from peers
- **Bandwidth Limits**: Prevent any peer from consuming too much bandwidth
- **Timeout Settings**: How long to wait for responses

**Recommendations**:
- Max message size: 512KB (good balance)
- Send strategies: enabled (better performance)
- Per-peer limits: 1MB (prevent abuse)

### 2. Preload Configuration

```javascript
preload: {
    enabled: false,             // Preload content to public gateways
    addresses: [
        '/dnsaddr/node0.preload.ipfs.io',
        '/dnsaddr/node1.preload.ipfs.io'
    ]
}
```

**Options**:
- **Preload Service**: Automatically announce content to gateways
- **Gateway List**: Which gateways to use for preloading
- **Preload Strategy**: What content to preload

**Recommendations**:
- Preload: disabled (privacy and control)
- Allow user override: true
- Custom gateway support: true

### 3. Garbage Collection

```javascript
gc: {
    enabled: true,              // Enable automatic GC
    interval: 3600000,          // 1 hour interval
    watermarks: {
        high: 0.9,              // Start GC at 90% full
        low: 0.8                // Stop GC at 80% full
    }
}
```

**Options**:
- **Auto GC**: Automatically clean up unpinned content
- **GC Interval**: How often to run garbage collection
- **Storage Watermarks**: When to start/stop GC
- **Pin Protection**: Ensure pinned content is never collected

**Recommendations**:
- Auto GC: enabled (prevent storage bloat)
- Interval: 1 hour (balance performance/storage)
- High watermark: 90% (leave some headroom)

## 🌐 API Configuration

### 1. HTTP API

```javascript
api: {
    host: '127.0.0.1',         // API bind address
    port: 5001,                // API port
    cors: {
        origin: ['*'],          // CORS origins
        credentials: true       // Allow credentials
    }
}
```

**Options**:
- **API Host**: Which interface to bind API to
- **API Port**: Port for HTTP API
- **CORS Settings**: Cross-origin request handling
- **Authentication**: API access control

**Recommendations**:
- Host: 127.0.0.1 (local only for security)
- Port: 5001 (standard IPFS API port)
- CORS: restricted (security)
- Auth: consider for production

### 2. Gateway Configuration

```javascript
gateway: {
    host: '127.0.0.1',         // Gateway bind address
    port: 8080,                // Gateway port
    pathPrefixes: ['/ipfs', '/ipns'],
    publicGateways: {}         // Public gateway configuration
}
```

**Options**:
- **Gateway Host**: Interface for HTTP gateway
- **Gateway Port**: Port for content access
- **Path Prefixes**: URL patterns for content access
- **Public Gateway**: Whether to act as public gateway

**Recommendations**:
- Host: 127.0.0.1 (local access only)
- Port: 8080 (standard gateway port)
- Public gateway: disabled (security/bandwidth)

## 🔧 Advanced Configuration

### 1. Experimental Features

```javascript
experimental: {
    ipnsPubsub: false,          // IPNS over pubsub
    sharding: false,            // Directory sharding
    urlstore: false,            // URL-based storage
    p2pHypermedia: false,       // P2P hypermedia protocol
    strategicProviding: false   // Strategic content providing
}
```

**Options**:
- **IPNS Pubsub**: Faster IPNS updates via pubsub
- **Sharding**: Large directory handling
- **URL Store**: Reference external URLs as IPFS content
- **Strategic Providing**: Optimize what content to provide

**Recommendations**:
- All experimental: disabled (stability)
- Allow advanced user override: true

### 2. Pubsub Configuration

```javascript
pubsub: {
    enabled: true,              // Enable pubsub
    router: 'gossipsub',        // Routing algorithm
    signMessages: true,         // Sign pubsub messages
    strictSigning: true         // Require valid signatures
}
```

**Options**:
- **Pubsub Protocol**: gossipsub, floodsub
- **Message Signing**: Cryptographically sign messages
- **Signature Validation**: Verify message signatures
- **Topic Limits**: Limit subscribed topics

**Recommendations**:
- Pubsub: enabled (needed for OrbitDB)
- Router: gossipsub (better performance)
- Signing: enabled (security)

## 📋 Configuration Categories for Nodebit

### Essential (Must Configure)
- **Storage Paths**: dataDir-based paths for datastore/blockstore
- **Network Ports**: TCP/WebSocket ports for connectivity
- **Bootstrap**: Default + custom bootstrap nodes

### Important (Should Configure)
- **Connection Limits**: Max/min connections for stability
- **Discovery**: mDNS, DHT settings for peer finding
- **Garbage Collection**: Auto-cleanup settings

### Advanced (Optional)
- **Private Networks**: For isolated deployments
- **API Security**: Authentication and CORS
- **Performance Tuning**: Bitswap, preload settings

### Experimental (Expert Only)
- **Experimental Features**: Cutting-edge IPFS features
- **Custom Protocols**: Advanced networking options

## 🎯 Recommended Default Configuration

```javascript
const defaultConfig = {
    // Essential
    dataDir: '.nodebit',
    ports: {
        swarm: 4001,
        api: 5001,
        gateway: 8080
    },
    
    // Important
    connections: {
        max: 100,
        min: 10
    },
    discovery: {
        mdns: true,
        dht: true,
        bootstrap: true
    },
    gc: {
        enabled: true,
        interval: 3600000
    },
    
    // Security
    api: {
        host: '127.0.0.1'  // Local only
    },
    
    // Advanced (disabled by default)
    experimental: {},
    privateNetwork: null
}
```

This configuration provides a secure, performant default while allowing advanced users to customize as needed.