/**
 * Node Factory - Creates and configures nb-workspace nodes
 */

const { NodebitWorkspace } = require('../../../lib/nodebit-core');
const path = require('path');

function createWorkspaceNode(RED) {
    return function NodebitWorkspaceNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        
        // Store configuration
        node.config = {
            name: config.name || 'Nodebit Workspace',
            dataDir: config.dataDir || '.nodebit',
            autoStart: config.autoStart !== false
        };
        
        // Create the real Nodebit workspace
        node.workspace = new NodebitWorkspace({
            dataDir: path.resolve(node.config.dataDir),
            autoStart: node.config.autoStart
        });
        
        // Workspace state
        node.isStarted = false;
        node.isStarting = false;
        
        // Set up event listeners
        setupEventListeners(node);
        
        // Start the workspace if autoStart is enabled
        if (node.config.autoStart) {
            startWorkspace(node);
        }
        
        // Provide methods for other nodes
        setupNodeMethods(node);
        
        // Clean up on node removal
        node.on('close', async (removed, done) => {
            await cleanupWorkspace(node, done);
        });
    };
}

function setupEventListeners(node) {
    node.workspace.on('started', () => {
        node.isStarted = true;
        node.isStarting = false;
        // Don't log to console - this will appear in activity log via workspace events
        node.emit('workspace.ready');
    });
    
    node.workspace.on('stopped', () => {
        node.isStarted = false;
        // Don't log to console - this will appear in activity log via workspace events
    });
    
    // All these events are now captured in the activity log automatically
    // No need to duplicate them in Node-RED console output
}

function startWorkspace(node) {
    node.isStarting = true;
    node.workspace.start().catch(error => {
        node.error('Failed to start workspace: ' + error.message);
        node.isStarting = false;
    });
}

function setupNodeMethods(node) {
    node.getStatus = function() {
        return {
            isStarted: node.isStarted,
            isStarting: node.isStarting,
            demo: false, // Now using real implementation
            config: node.config,
            networks: node.workspace.getNetworks(),
            resourceCount: node.workspace.resources.size
        };
    };
    
    node.isReady = function() {
        return node.isStarted;
    };
    
    node.getWorkspace = function() {
        return node.workspace;
    };
}

async function cleanupWorkspace(node, done) {
    if (node.workspace && node.isStarted) {
        try {
            await node.workspace.stop();
            // Don't log to console - this will appear in activity log via workspace events
        } catch (error) {
            node.error('Error stopping workspace: ' + error.message);
        }
    }
    done();
}

module.exports = { createWorkspaceNode };