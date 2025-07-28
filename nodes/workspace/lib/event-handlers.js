/**
 * Event Handlers - Workspace lifecycle and event management
 */

class EventHandlers {
    constructor(node) {
        this.node = node;
        this.workspace = node.workspace;
    }

    setupWorkspaceEvents() {
        this.workspace.on('started', () => {
            this.handleWorkspaceStarted();
        });
        
        this.workspace.on('stopped', () => {
            this.handleWorkspaceStopped();
        });
        
        this.workspace.on('error', (error) => {
            this.handleWorkspaceError(error);
        });
        
        this.workspace.on('network.added', (network) => {
            this.handleNetworkAdded(network);
        });
        
        this.workspace.on('network.removed', (network) => {
            this.handleNetworkRemoved(network);
        });
        
        this.workspace.on('activity.logged', (activity) => {
            this.handleActivityLogged(activity);
        });
    }

    handleWorkspaceStarted() {
        this.node.isStarted = true;
        this.node.isStarting = false;
        // Don't log to console - this will appear in activity log via workspace events
        this.node.emit('workspace.ready');
    }

    handleWorkspaceStopped() {
        this.node.isStarted = false;
        // Don't log to console - this will appear in activity log via workspace events
    }

    handleWorkspaceError(error) {
        this.node.error('Workspace error: ' + error.message);
        this.node.isStarting = false;
    }

    handleNetworkAdded(network) {
        // Network addition is handled automatically by the workspace
        // This could be used for additional Node-RED specific logic
    }

    handleNetworkRemoved(network) {
        // Network removal is handled automatically by the workspace
        // This could be used for additional Node-RED specific logic
    }

    handleActivityLogged(activity) {
        // Activity logging is handled automatically by the workspace
        // This could be used for additional Node-RED specific logic
        // such as emitting Node-RED events or updating status
    }

    setupNodeEvents() {
        this.node.on('close', async (removed, done) => {
            await this.handleNodeClose(removed, done);
        });
        
        this.node.on('input', (msg) => {
            this.handleNodeInput(msg);
        });
    }

    async handleNodeClose(removed, done) {
        if (this.workspace && this.node.isStarted) {
            try {
                await this.workspace.stop();
                // Don't log to console - this will appear in activity log via workspace events
            } catch (error) {
                this.node.error('Error stopping workspace: ' + error.message);
            }
        }
        done();
    }

    handleNodeInput(msg) {
        // Handle any input messages to the workspace node
        // This could be used for dynamic configuration or control
        this.node.send(msg);
    }

    emitStatusUpdate() {
        const status = {
            fill: this.node.isStarted ? 'green' : (this.node.isStarting ? 'yellow' : 'red'),
            shape: 'dot',
            text: this.node.isStarted ? 'ready' : (this.node.isStarting ? 'starting' : 'stopped')
        };
        this.node.status(status);
    }

    startPeriodicStatusUpdates() {
        // Update status every 5 seconds
        this.statusInterval = setInterval(() => {
            this.emitStatusUpdate();
        }, 5000);
    }

    stopPeriodicStatusUpdates() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }
}

module.exports = { EventHandlers };