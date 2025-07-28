/**
 * Workspace Manager - Core workspace state and operations
 */

class WorkspaceManager {
    constructor(node) {
        this.node = node;
        this.workspace = node.workspace;
    }

    getStatus() {
        return {
            isStarted: this.node.isStarted,
            isStarting: this.node.isStarting,
            demo: false, // Now using real implementation
            config: this.node.config,
            networks: this.workspace.getNetworks(),
            resourceCount: this.workspace.resources.size
        };
    }

    isReady() {
        return this.node.isStarted;
    }

    getWorkspace() {
        return this.workspace;
    }

    async getNetworks() {
        if (!this.isReady()) {
            throw new Error('Workspace not ready');
        }
        return this.workspace.getNetworks();
    }

    async getActivity(beforeTimestamp = null, limit = 50) {
        const workspace = this.getWorkspace();
        
        if (beforeTimestamp) {
            // Load older activities for lazy loading
            return await workspace.loadOlderActivities(beforeTimestamp, limit);
        } else {
            // Return current in-memory activities (most recent 100)
            const activities = workspace.activityLog || [];
            
            // If no activities in memory, try to load from file
            if (activities.length === 0 && !workspace.activitiesLoaded) {
                await workspace._loadRecentActivities();
                workspace.activitiesLoaded = true;
            }
            
            return workspace.activityLog || [];
        }
    }

    async clearActivity() {
        const workspace = this.getWorkspace();
        workspace.activityLog = [];
        return { success: true, message: 'Activity log cleared' };
    }

    async logMessage(message) {
        const workspace = this.getWorkspace();
        if (workspace && workspace.logger) {
            workspace.logger.info('Dashboard: ' + message);
        }
    }

    async logDebugMessage(message) {
        const workspace = this.getWorkspace();
        if (workspace.logger) {
            workspace.logger.info('Dashboard Debug: ' + message);
        }
    }

    // DID/ACL Management Methods
    async getAllDIDs() {
        const workspace = this.getWorkspace();
        
        if (!workspace.isStarted) {
            throw new Error('Workspace not started yet');
        }
        
        if (!workspace.didRegistry) {
            throw new Error('DID/ACL system still initializing - please wait a moment');
        }
        
        return await workspace.getAllDIDs();
    }

    async createDID(id, metadata = {}) {
        const workspace = this.getWorkspace();
        return await workspace.createDID(id, metadata);
    }

    async updateDIDMetadata(didId, metadata = {}) {
        const workspace = this.getWorkspace();
        return await workspace.updateDIDMetadata(didId, metadata);
    }

    async deleteDID(didId) {
        const workspace = this.getWorkspace();
        return await workspace.deleteDID(didId);
    }

    async authenticateDID(didId, signature) {
        const workspace = this.getWorkspace();
        return await workspace.authenticateDID(didId, signature);
    }

    async getAllACLs() {
        const workspace = this.getWorkspace();
        
        if (!workspace.isStarted) {
            throw new Error('Workspace not started yet');
        }
        
        if (!workspace.aclRegistry) {
            throw new Error('DID/ACL system still initializing - please wait a moment');
        }
        
        return await workspace.getAllACLs();
    }

    async grantPermission(did, resource, action) {
        const workspace = this.getWorkspace();
        return await workspace.grantPermission(did, resource, action);
    }

    async revokePermission(did, resource, action) {
        const workspace = this.getWorkspace();
        return await workspace.revokePermission(did, resource, action);
    }

    async checkPermission(did, resource, action) {
        const workspace = this.getWorkspace();
        return await workspace.checkPermission(did, resource, action);
    }

    getDebugStatus() {
        const workspace = this.getWorkspace();
        return {
            isStarted: workspace.isStarted,
            hasIdentities: !!workspace.identities,
            hasSystemOrbitDB: !!workspace.systemOrbitDB,
            hasDIDRegistry: !!workspace.didRegistry,
            hasACLRegistry: !!workspace.aclRegistry,
            hasCurrentIdentity: !!workspace.currentIdentity,
            authenticatedDIDsCount: workspace.authenticatedDIDs ? workspace.authenticatedDIDs.size : 0,
            networks: workspace.networks ? Array.from(workspace.networks.keys()) : [],
            recentActivities: workspace.activityLog ? workspace.activityLog.slice(0, 10) : []
        };
    }

    getRawActivity() {
        const workspace = this.getWorkspace();
        const activities = workspace.activityLog || [];
        return {
            count: activities.length,
            activities: activities.slice(0, 20) // Last 20 activities
        };
    }
}

module.exports = { WorkspaceManager };