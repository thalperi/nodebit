# Network Selection Strategy for Nodebit

**Warning: Nodebit is in early development. Network selection features are incomplete and subject to change.**

This is the canonical source for network selection logic and user-facing policy for Nodebit.

This document details how nb-file and nb-database nodes should select which IPFS network to use when multiple networks are available in a workspace.

## The Network Selection Problem

When a workspace has multiple IPFS networks available:
- **Local Helia Instance**: The workspace's own IPFS node
- **Remote IPFS Connections**: External IPFS daemons (company servers, public gateways, etc.)

Operations need to decide which network to use:
- **File Upload**: Which network should store the file?
- **Database Creation**: Which IPFS network should host the OrbitDB?
- **Content Retrieval**: Which network should we try first for downloads?

## Proposed Selection Strategies

### 1. **Explicit Network Selection** (Recommended for v1)

**Concept**: Users/flows explicitly specify which network to use

**Implementation**:
```javascript
// In nb-file node configuration
msg.network = "local-helia";  // or "remote-cluster-1"
msg.payload = "Hello IPFS!";

// In nb-database node configuration  
msg.network = "remote-cluster-1";
msg.operation = "create";
msg.databaseName = "user-data";
```

**Admin UI Integration**:
- Network dropdown in node configuration
- Default to "auto" (falls back to automatic selection)
- Show available networks with status indicators

**Pros**:
- Clear, predictable behavior
- User has full control
- Easy to implement and debug
- Good for specific use cases (local temp files, remote permanent storage)

**Cons**:
- Requires user to understand network topology
- More configuration overhead
- Flows become network-specific

### 2. **Automatic Selection with Policies**

**Concept**: System chooses network based on configurable policies

**Policy Examples**:
```javascript
// Workspace-level policies
{
  fileUpload: {
    strategy: "local-first",     // Try local, fallback to remote
    maxSize: "100MB",           // Files > 100MB go to remote
    temporary: "local-only"      // Temp files stay local
  },
  
  databaseCreation: {
    strategy: "remote-preferred", // Prefer remote for persistence
    fallback: "local"           // Use local if remote unavailable
  },
  
  contentRetrieval: {
    strategy: "fastest-first",   // Try fastest network first
    timeout: "5s"              // Switch networks after timeout
  }
}
```

**Implementation**:
```javascript
// Node automatically selects based on policies
msg.payload = "Hello IPFS!";
msg.fileType = "temporary";  // Triggers local-only policy

// Or override policy
msg.payload = "Important document";
msg.networkPolicy = "remote-only";
```

**Pros**:
- Intelligent default behavior
- Reduces configuration overhead
- Can optimize for performance/cost
- Flexible and powerful

**Cons**:
- More complex to implement
- Harder to predict behavior
- Requires policy configuration
- Debugging can be challenging

### 3. **Hybrid Approach** (Recommended for v2+)

**Concept**: Combine explicit selection with intelligent defaults

**Implementation**:
```javascript
// Explicit selection (highest priority)
msg.network = "remote-cluster-1";

// Policy-based selection (medium priority)
msg.networkPolicy = "high-availability";

// Automatic selection (fallback)
// Uses workspace default strategy
```

**Policy Types**:
- **Performance**: Choose fastest network
- **Reliability**: Choose most stable network
- **Cost**: Choose cheapest storage option
- **Privacy**: Choose most secure/private network
- **Availability**: Choose network with best uptime

## Network Selection Implementation

### **Network Registry in Workspace**

```javascript
// In nb-workspace
node.networks = {
  "local-helia": {
    type: "local",
    helia: heliaInstance,
    status: "connected",
    capabilities: ["read", "write", "pin"],
    performance: { latency: 1, bandwidth: "unlimited" },
    cost: { storage: 0, bandwidth: 0 },
    reliability: 0.99
  },
  
  "company-cluster": {
    type: "remote", 
    client: ipfsClient,
    status: "connected",
    capabilities: ["read", "write", "pin"],
    performance: { latency: 50, bandwidth: "1Gbps" },
    cost: { storage: 0.01, bandwidth: 0.001 },
    reliability: 0.999
  },
  
  "public-gateway": {
    type: "remote",
    client: ipfsClient,
    status: "connected", 
    capabilities: ["read"],  // Read-only
    performance: { latency: 200, bandwidth: "100Mbps" },
    cost: { storage: 0, bandwidth: 0 },
    reliability: 0.95
  }
};
```

### **Selection Algorithm**

```javascript
function selectNetwork(operation, criteria = {}) {
  // 1. Explicit network selection
  if (criteria.network) {
    return validateNetwork(criteria.network, operation);
  }
  
  // 2. Policy-based selection
  if (criteria.policy) {
    return selectByPolicy(criteria.policy, operation);
  }
  
  // 3. Operation-specific defaults
  const candidates = getCapableNetworks(operation);
  
  switch (operation.type) {
    case 'file-upload':
      return selectForUpload(candidates, operation);
    case 'file-download':
      return selectForDownload(candidates, operation);
    case 'database-create':
      return selectForDatabase(candidates, operation);
    default:
      return selectDefault(candidates);
  }
}

function selectForUpload(networks, operation) {
  // Filter by capabilities
  const writable = networks.filter(n => n.capabilities.includes('write'));
  
  // Apply size-based rules
  if (operation.size > 100 * 1024 * 1024) { // > 100MB
    return writable.find(n => n.type === 'remote') || writable[0];
  }
  
  // Default to local for smaller files
  return writable.find(n => n.type === 'local') || writable[0];
}
```

### **Configuration in Admin UI**

**Network Management Tab**:
```html
<div class="network-policies">
  <h3>Network Selection Policies</h3>
  
  <div class="policy-section">
    <label>File Uploads:</label>
    <select name="fileUploadPolicy">
      <option value="local-first">Local First</option>
      <option value="remote-first">Remote First</option>
      <option value="size-based">Size Based (100MB threshold)</option>
      <option value="explicit-only">Explicit Selection Only</option>
    </select>
  </div>
  
  <div class="policy-section">
    <label>Database Creation:</label>
    <select name="databasePolicy">
      <option value="remote-preferred">Remote Preferred</option>
      <option value="local-only">Local Only</option>
      <option value="high-availability">High Availability</option>
    </select>
  </div>
  
  <div class="policy-section">
    <label>Content Retrieval:</label>
    <select name="retrievalPolicy">
      <option value="fastest-first">Fastest First</option>
      <option value="local-first">Local First</option>
      <option value="round-robin">Round Robin</option>
    </select>
  </div>
</div>
```

**Node Configuration**:
```html
<!-- In nb-file node configuration -->
<div class="form-row">
  <label for="node-input-network">Network:</label>
  <select id="node-input-network">
    <option value="">Auto (use workspace policy)</option>
    <option value="local-helia">Local Helia</option>
    <option value="company-cluster">Company Cluster</option>
    <option value="public-gateway">Public Gateway (read-only)</option>
  </select>
</div>

<div class="form-row">
  <label for="node-input-networkPolicy">Network Policy:</label>
  <select id="node-input-networkPolicy">
    <option value="">Default</option>
    <option value="performance">Performance</option>
    <option value="reliability">Reliability</option>
    <option value="cost">Cost Optimized</option>
    <option value="privacy">Privacy</option>
  </select>
</div>
```

## Recommended Implementation Plan

### **Phase 1: Explicit Selection Only**
- Simple network dropdown in node configuration
- Manual selection required for multi-network scenarios
- Clear, predictable behavior
- Easy to implement and test

### **Phase 2: Add Default Policies**
- Workspace-level default policies
- Automatic fallback when no explicit selection
- Basic policies: local-first, remote-first, size-based

### **Phase 3: Advanced Policies**
- Performance-based selection
- Cost optimization
- Reliability and availability policies
- Dynamic network health monitoring

### **Phase 4: Machine Learning**
- Learn from user patterns
- Optimize based on actual performance
- Predictive network selection
- Adaptive policies

This approach provides immediate functionality while allowing for sophisticated optimization as the system matures.