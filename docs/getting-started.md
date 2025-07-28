# Getting Started with Nodebit

**Warning: Nodebit is in early development. Most features are incomplete, experimental, or demo-only. This guide covers basic setup and demo functionality.**

Welcome to Nodebit! This guide will help you get up and running with the basic interface for decentralized storage in Node-RED. You'll learn to manage IPFS networks and OrbitDB databases through both the web interface and Node-RED flows.

## What You'll Learn

By the end of this guide, you'll be able to:
- Set up and configure Nodebit workspaces
- Use the basic admin interface
- Create Node-RED flows for file and database operations (demo mode)
- Understand the demo mode and prepare for real implementation

## Prerequisites

- Node-RED 3.0 or later
- Node.js 18 or later
- Basic understanding of Node-RED flows

## Key Features

**Basic Security Management System:**
- CSS Grid-based layout with responsive design
- Three-panel ACL management workflow
- DID account management with metadata support
- Real-time permission control
- Fixed layout constraints for consistent appearance
- Basic card-based design with visual selection
- DID management with expandable panels
- Search and filtering capabilities
- Activity integration with workspace logging
- Basic operation with error handling
- CRUD operations for DIDs with form handling
- Automatic refresh functionality

## Installation

1. **Install Nodebit in Node-RED:**
   ```bash
   cd ~/.node-red
   npm install nodebit
   ```

2. **Restart Node-RED:**
   ```bash
   node-red
   ```

3. **Verify Installation:**
   - Open Node-RED in your browser (http://localhost:1880)
   - Look for "nodebit" category in the palette
   - You should see: nb-file and nb-database nodes

## Your First Workspace

### Step 1: Create a Workspace Configuration

1. **Access Configuration Nodes:**
   - Click the hamburger menu (☰) in the top-right
   - This opens the right sidebar with a "Config" tab
   - You'll see sections for "On all flows" and your current flow

2. **Add a Workspace:**
   - Look for the "+" button or "Add" option in the Config panel
   - Select "nb-workspace" from the list
   - Configure it:
     - **Name**: "My First Workspace"
     - **Data Directory**: ".nodebit" (default is fine)
     - **Auto-start**: ✓ (checked)
   - Click "Add" to save

### Step 2: Access the Admin Interface

1. **Open the Workspace Configuration:**
   - In the Config panel, find your "My First Workspace"
   - Click the edit button (pencil icon)

2. **Launch the Admin Interface:**
   - In the workspace configuration dialog, you'll see an "Open Workspace Admin" button
   - Click it to open the basic interface in a new window

3. **Explore the Interface:**
   - **Overview Tab**: See statistics for networks, databases, files, and peers
   - **Networks Tab**: Browse connected IPFS networks
   - **Databases Tab**: Explore OrbitDB databases
   - **Files Tab**: Manage IPFS files
   - **Query Builder Tab**: Future advanced querying (planned)

## Understanding the Admin Interface

### Overview Dashboard
The overview provides a basic view of your decentralized infrastructure:

- **IPFS Networks**: Shows connected networks (currently demo data)
- **OrbitDB Databases**: Displays available databases with entry counts
- **IPFS Files**: Lists stored files with sizes and pin status
- **Connected Peers**: Total peers across all networks

### Networks Management
Browse and manage IPFS network connections:

- **Local Helia**: Your local IPFS node (simulated in demo)
- **Remote Cluster**: External IPFS networks (simulated in demo)
- **Peer Information**: View peer IDs, connection status, and capabilities
- **Network Actions**: Manage connections and view details

### Database Browser
Explore OrbitDB databases across all networks:

- **Database Types**: Documents, key-value, event logs, feeds, counters
- **Storage Information**: Entry counts, sizes, network locations
- **Database Actions**: Browse data, execute queries, manage schemas

### File Manager
Manage files across IPFS networks:

- **File Metadata**: Names, CIDs, sizes, types, upload dates
- **Pin Management**: Control which files are kept permanently
- **Network Distribution**: See which networks store which files
- **Bulk Operations**: Pin/unpin multiple files at once

## Your First Node-RED Flow

Now let's create flows that interact with your workspace:

### File Upload Flow

1. **Create the Flow:**
   ```
   [inject] → [nb-file] → [debug]
   ```

2. **Configure the Inject Node:**
   - **Payload**: string
   - **Value**: "Hello, decentralized world!"
   - **Topic**: (leave empty)

3. **Configure the nb-file Node:**
   - **Name**: "Upload File"
   - **Workspace**: Select "My First Workspace"
   - **Operation**: "Auto-detect from message"

4. **Deploy and Test:**
   - Click "Deploy"
   - Click the inject button
   - Check the debug panel for results

**Expected Output:**
```json
{
  "topic": "file.uploaded",
  "payload": {
    "cid": "QmDemo...",
    "file": {
      "name": "uploaded-file",
      "size": 28,
      "type": "text/plain"
    },
    "demo": true,
    "links": {
      "ipfs": "https://ipfs.io/ipfs/QmDemo..."
    }
  }
}
```

### Database Operations Flow

1. **Create the Flow:**
   ```
   [inject] → [nb-database] → [debug]
   ```

2. **Configure the Inject Node:**
   - **Payload**: JSON
   - **Value**:
   ```json
   {
     "name": "Alice",
     "email": "alice@example.com",
     "role": "admin"
   }
   ```

3. **Configure the nb-database Node:**
   - **Name**: "Store User Data"
   - **Workspace**: Select "My First Workspace"
   - **Operation**: "Auto-detect from message"
   - **Database Type**: "documents"

4. **Deploy and Test:**
   - Click "Deploy"
   - Click the inject button
   - Check the debug panel for results

**Expected Output:**
```json
{
  "topic": "database.written",
  "payload": {
    "id": "1642680000000",
    "data": {
      "name": "Alice",
      "email": "alice@example.com", 
      "role": "admin"
    },
    "demo": true
  }
}
```

## Monitoring and Management

### Real-time Flow Monitoring

1. **Workspace Status:**
   - Deployed nodes show status indicators
   - Green dot: Ready and connected to workspace
   - Yellow ring: Workspace starting
   - Red ring: Error or no workspace configured

2. **Admin Interface Updates:**
   - The admin interface shows live data
   - Refresh tabs to see updated information
   - Statistics update automatically

### Flow Patterns

**File Processing Pipeline:**
```
[HTTP In] → [nb-file: upload] → [nb-database: index] → [HTTP Response]
```

**Database Query API:**
```
[HTTP In] → [nb-database: query] → [Template] → [HTTP Response]
```

**Monitoring Flow:**
```
[Timer] → [nb-database: status] → [Switch] → [Email Alert]
```

## Understanding Demo Mode

### Current Limitations

Nodebit currently operates in **demo mode**, which means:

- **Mock Data**: All operations use simulated data
- **No Real IPFS**: Files aren't actually stored on IPFS
- **No Real OrbitDB**: Database operations use in-memory storage
- **Simulated Networks**: Network information is generated for demonstration

### Demo Benefits

- **Interface Testing**: Explore the basic admin interface
- **Flow Development**: Build and test Node-RED flows
- **Pattern Learning**: Understand how real operations will work
- **UI Familiarity**: Get comfortable with the management interface

### What Works in Demo Mode

- 🔄 **Configuration Management**: Basic workspace setup, validation needs improvement
- 🔄 **Admin Interface**: Basic interface, requires substantial development
- 🔄 **Node-RED Integration**: Basic integration, needs enhancement
- 🔄 **API Endpoints**: Limited endpoints, requires comprehensive implementation
- ✅ **Status Monitoring**: Real-time status indicators and feedback

## Preparing for Real Implementation

### Understanding the Transition

When real IPFS and OrbitDB integration is added:

1. **Same Interface**: The admin interface will look identical
2. **Same Flows**: Your Node-RED flows will work without changes
3. **Real Data**: Operations will use actual IPFS and OrbitDB
4. **Network Integration**: Connect to real IPFS networks and peers

### Best Practices for Demo Development

1. **Build Realistic Flows**: Design flows as if using real data
2. **Plan for Scale**: Consider how flows will handle real network latency
3. **Error Handling**: Include proper error handling for network issues
4. **Security Considerations**: Plan for encryption and access control

## Next Steps

### Intermediate Exploration

1. **Complex Flows**: Build multi-step data processing pipelines
2. **API Integration**: Use HTTP nodes to create REST APIs
3. **Template Usage**: Create dynamic responses with template nodes
4. **Error Handling**: Add proper error handling and retry logic

### Advanced Concepts

1. **Workspace Management**: Create multiple workspaces for different projects
2. **Flow Organization**: Organize complex flows with subflows and groups
3. **Performance Monitoring**: Track flow performance and optimization
4. **Integration Patterns**: Connect with external systems and databases

### Contributing to Real Implementation

1. **IPFS Integration**: Help implement real Helia/IPFS operations
2. **OrbitDB Integration**: Add actual database functionality
3. **Network Discovery**: Implement automatic IPFS node detection
4. **Security Features**: Add encryption and access control

## Troubleshooting

### Common Issues

**"No workspace configured" error:**
- Ensure you've created an nb-workspace configuration
- Check that the workspace is selected in your node configuration
- Verify the workspace shows green status after deployment

**Admin interface won't open:**
- Make sure you've saved the workspace configuration first
- Check that Node-RED is running and accessible
- Verify there are no browser popup blockers preventing the window

**Nodes show red status:**
- Check that the workspace configuration exists
- Ensure the workspace name matches what's selected in the node
- Try redeploying the flow

### Getting Help

- **[Node Reference](../technical/node-roles.md)** - Detailed documentation for each node
- **[Architecture Guide](../technical/architecture.md)** - Technical design and patterns
- **[Examples](../reference/examples/)** - Real-world use cases and patterns
- **[GitHub Issues](https://github.com/nodebit/nodebit/issues)** - Report bugs and request features

## You're Ready!

You now have a working Nodebit installation with:
- ✅ **Configured workspace** with admin interface access
- ✅ **Working Node-RED flows** for file and database operations (demo mode)
- ✅ **Understanding of demo mode** and future real implementation
- ✅ **Foundation for building** decentralized applications

The basic interface gives you visibility into your decentralized infrastructure, while Node-RED flows provide the automation and integration capabilities.

Begin exploring early development functionality. Note: nb-file and nb-database nodes require implementation before building production applications.