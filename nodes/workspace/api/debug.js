/**
 * Debug API - Debug and diagnostic endpoints
 */

const { WorkspaceManager } = require('../lib/workspace-manager');
const { createErrorResponse, createSuccessResponse } = require('../utils/response-helpers');

function registerDebugRoutes(RED) {
    // Debug endpoint to check DID/ACL system status
    RED.httpAdmin.get('/nodebit/workspace/:id/api/debug/did-status', 
        RED.auth.needsPermission('nb-workspace.read'), 
        function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const debugStatus = manager.getDebugStatus();
                res.json(debugStatus);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Debug failed: ' + error.message));
            }
        }
    );

    // Raw activity log endpoint for debugging
    RED.httpAdmin.get('/nodebit/workspace/:id/api/debug/raw-activity', 
        RED.auth.needsPermission('nb-workspace.read'), 
        function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const rawActivity = manager.getRawActivity();
                res.json(rawActivity);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to get activities: ' + error.message));
            }
        }
    );

    // System health check
    RED.httpAdmin.get('/nodebit/workspace/:id/api/debug/health', 
        RED.auth.needsPermission('nb-workspace.read'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const workspace = manager.getWorkspace();
                
                const health = {
                    timestamp: new Date().toISOString(),
                    workspace: {
                        isStarted: manager.isReady(),
                        isStarting: node.isStarting,
                        config: node.config
                    },
                    networks: {
                        count: 0,
                        types: []
                    },
                    security: {
                        didSystemActive: !!workspace.didRegistry,
                        aclSystemActive: !!workspace.aclRegistry,
                        hasSystemOrbitDB: !!workspace.systemOrbitDB
                    },
                    activity: {
                        logCount: workspace.activityLog ? workspace.activityLog.length : 0,
                        recentErrors: []
                    }
                };

                if (manager.isReady()) {
                    try {
                        const networks = await manager.getNetworks();
                        health.networks.count = networks.length;
                        health.networks.types = [...new Set(networks.map(n => n.type))];
                    } catch (error) {
                        health.networks.error = error.message;
                    }

                    if (workspace.activityLog) {
                        health.activity.recentErrors = workspace.activityLog
                            .filter(a => a.level === 'error')
                            .slice(0, 5)
                            .map(a => ({ timestamp: a.timestamp, message: a.message }));
                    }
                }
                
                res.json(health);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Health check failed: ' + error.message));
            }
        }
    );

    // Memory usage and performance metrics
    RED.httpAdmin.get('/nodebit/workspace/:id/api/debug/metrics', 
        RED.auth.needsPermission('nb-workspace.read'), 
        function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const workspace = manager.getWorkspace();
                
                const metrics = {
                    timestamp: new Date().toISOString(),
                    memory: process.memoryUsage(),
                    uptime: process.uptime(),
                    workspace: {
                        resourceCount: workspace.resources ? workspace.resources.size : 0,
                        networkCount: workspace.networks ? workspace.networks.size : 0,
                        activityCount: workspace.activityLog ? workspace.activityLog.length : 0
                    },
                    node: {
                        id: node.id,
                        type: node.type,
                        name: node.name || 'Unnamed'
                    }
                };
                
                res.json(metrics);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Metrics collection failed: ' + error.message));
            }
        }
    );

    // Configuration dump for debugging
    RED.httpAdmin.get('/nodebit/workspace/:id/api/debug/config', 
        RED.auth.needsPermission('nb-workspace.read'), 
        function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const configDump = {
                    nodeConfig: node.config,
                    nodeStatus: {
                        isStarted: node.isStarted,
                        isStarting: node.isStarting
                    },
                    environment: {
                        nodeVersion: process.version,
                        platform: process.platform,
                        arch: process.arch
                    }
                };
                
                res.json(configDump);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Config dump failed: ' + error.message));
            }
        }
    );
}

module.exports = { registerDebugRoutes };