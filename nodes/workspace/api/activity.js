/**
 * Activity API - Activity logging and management endpoints
 */

const { WorkspaceManager } = require('../lib/workspace-manager');
const { createErrorResponse, createSuccessResponse } = require('../utils/response-helpers');

function registerActivityRoutes(RED) {
    // Get activity log with lazy loading support
    RED.httpAdmin.get('/nodebit/workspace/:id/api/activity', 
        RED.auth.needsPermission('nb-workspace.read'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const beforeTimestamp = req.query.before;
                const limit = parseInt(req.query.limit) || 50;
                
                const activities = await manager.getActivity(beforeTimestamp, limit);
                res.json(activities);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to get activity log: ' + error.message));
            }
        }
    );

    // Test logging endpoint
    RED.httpAdmin.post('/nodebit/workspace/:id/api/test-log', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                await manager.logMessage(req.body.message);
                res.json(createSuccessResponse());
                
            } catch (error) {
                res.status(500).json(createErrorResponse(error.message));
            }
        }
    );

    // Clear activity log endpoint
    RED.httpAdmin.post('/nodebit/workspace/:id/api/activity/clear', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const result = await manager.clearActivity();
                res.json(result);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to clear activity log: ' + error.message));
            }
        }
    );

    // Debug logging endpoint
    RED.httpAdmin.post('/nodebit/workspace/:id/api/log-debug', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const { message } = req.body;
                
                await manager.logDebugMessage(message);
                res.json(createSuccessResponse());
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to log debug message: ' + error.message));
            }
        }
    );

    // Get activity statistics
    RED.httpAdmin.get('/nodebit/workspace/:id/api/activity/stats', 
        RED.auth.needsPermission('nb-workspace.read'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const activities = await manager.getActivity();
                
                const stats = {
                    total: activities.length,
                    byLevel: {
                        info: activities.filter(a => a.level === 'info').length,
                        warn: activities.filter(a => a.level === 'warn').length,
                        error: activities.filter(a => a.level === 'error').length
                    },
                    recent: activities.slice(0, 10)
                };
                
                res.json(stats);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to get activity stats: ' + error.message));
            }
        }
    );
}

module.exports = { registerActivityRoutes };