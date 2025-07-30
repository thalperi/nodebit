# Nodebit Workspace Initialization Workflow

This document details the full technical workflow for initializing a Nodebit workspace—from the moment a user presses the **Add** button on the "Add new nb-workspace config node" form, through Helia and OrbitDB setup, to the first successful "Resource discovery completed" record in the internal log. It is based on a post-inspection code audit and includes TODO annotations for areas needing further development.

---

## Overview Flowchart

```mermaid
graph TD
    A[User presses Add on nb-workspace config node form] --> B[Node-RED creates nb-workspace config node]
    B --> C[NodebitWorkspace instance created]
    C --> D[Workspace autoStart triggers start sequence]
    D --> E[Ensure data directory exists]
    E --> F[Detect Kubo nodes (optional)]
    F --> G[Create local Helia network]
    G --> H[Create OrbitDB instance for local network]
    H --> I[Initialize DID/ACL system]
    I --> J[Create persistent keystore and system identity]
    J --> K[Create system OrbitDB for DID/ACL]
    K --> L[Create DID registry database]
    L --> M[Create ACL registry database]
    M --> N[Add admin identity to authenticated DIDs]
    N --> O[Start resource discovery]
    O --> P[Discover resources in all networks]
    P --> Q[Emit 'Resource discovery completed' log]
```

---

## Step-by-Step Technical Narrative

### 1. User Action: Add Workspace Config Node
- **UI:** User fills out the form and presses **Add**.
- **File:** `nodes/workspace/workspace.html`, `client-scripts.js`
- **Result:** Node-RED creates a new config node of type `nb-workspace`.

### 2. Node Creation: NodebitWorkspaceNode
- **File:** `nodes/workspace/lib/node-factory.js`
- The factory function creates a new `NodebitWorkspace` instance with the provided config (name, dataDir, autoStart).
- Event listeners and node methods are set up.
- If `autoStart` is enabled, `startWorkspace(node)` is called.

### 3. NodebitWorkspace Instantiation
- **File:** `lib/nodebit-core.js` (class `NodebitWorkspace`)
- Constructor sets up config, state, and calls `_initializeAsync()` to set up logging and load recent activities.

### 4. Workspace Start Sequence
- **File:** `lib/nodebit-core.js` (`NodebitWorkspace.start()`)
- Checks if already started.
- Loads ES module dependencies.
- Ensures the workspace data directory exists.

### 5. Network Initialization
- **File:** `lib/nodebit-core.js` (`NodebitWorkspace.start()`)
- If `autoStart` is enabled:
  - Attempts to detect existing Kubo nodes (optional, not required for local Helia).
  - Calls `addNetwork('local', { type: 'helia', config: { ... } })` to create a local Helia network.

### 6. Helia and OrbitDB Setup
- **File:** `lib/nodebit-core.js` (`addNetwork`, `_createHeliaNetwork`)
- `_createHeliaNetwork` creates a Helia IPFS node with libp2p (with pubsub/gossipsub), blockstore, and datastore.
- Also creates an OrbitDB instance for the local network.
- Network is added to the workspace's `networks` map.

### 7. DID/ACL System Initialization
- **File:** `lib/nodebit-core.js` (`_initializeDIDACLSystem`)
- Waits for Helia's libp2p to be fully started.
- Creates a persistent keystore and system identity (`nodebit-admin`).
- Creates a system OrbitDB instance for DID/ACL management.
- Creates a DID registry database (type: keyvalue).
- Creates an ACL registry database (type: keyvalue).
- Adds the admin identity to the set of authenticated DIDs.
- Logs success or partial initialization.
- **TODO:**
  - [ ] Improve error handling and retries for OrbitDB/Helia startup failures.
  - [ ] Expose more granular status updates to the UI during this phase.
  - [ ] Support for multi-admin or multi-identity bootstrapping.

### 8. Resource Discovery
- **File:** `lib/nodebit-core.js` (`_startResourceDiscovery`, `discoverResources`)
- Starts periodic resource discovery (every 5 minutes).
- On startup, immediately calls `discoverResources()`:
  - Discovers resources in each network (files, databases, etc.).
  - Updates the internal resource cache.
  - Emits `resources.discovered` event.
  - Logs "Resource discovery completed" with resource count.
- **TODO:**
  - [ ] Expand resource discovery to include more resource types and metadata.
  - [ ] Add hooks for custom resource discovery plugins.

### 9. Workspace Ready
- **File:** `nodes/workspace/lib/node-factory.js`, `lib/nodebit-core.js`
- The workspace emits a `started` event, which updates the node state and triggers UI updates.
- The system is now ready for user operations and API calls.

---

## Areas Awaiting Further Development (TODOs)

- [ ] **Error Handling:** More robust handling and UI feedback for failures in Helia/OrbitDB/DID/ACL initialization.
- [ ] **Status Reporting:** Real-time, granular status updates to the dashboard during each step.
- [ ] **Multi-Admin Support:** Bootstrapping and management of multiple admin identities.
- [ ] **Resource Discovery Extensibility:** Plugin system for custom resource types and discovery logic.
- [ ] **Testing:** More automated tests for edge cases in the initialization sequence.

---

## References
- `lib/nodebit-core.js` (core logic)
- `nodes/workspace/lib/node-factory.js` (Node-RED integration)
- Nodebit documentation: [docs/technical/architecture.md](architecture.md), [docs/general/status.md](../general/status.md), [docs/general/tasks.md](../general/tasks.md)
- [OrbitDB API Documentation](https://api.orbitdb.org/)
- [Helia API Documentation](https://ipfs.github.io/helia/)
- [Node-RED API Reference](https://nodered.org/docs/api/) 