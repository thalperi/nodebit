/**
 * Networks API - Network management endpoints
 */

const { WorkspaceManager } = require('../lib/workspace-manager');
const { createErrorResponse, createSuccessResponse } = require('../utils/response-helpers');

function registerNetworkRoutes(RED) {
    // Get all networks
    RED.httpAdmin.get('/nodebit/workspace/:id/api/networks', 
        RED.auth.needsPermission('nb-workspace.read'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                
                if (!manager.isReady()) {
                    return res.status(503).json(createErrorResponse(
                        'Workspace not ready', 
                        {
                            isStarting: node.isStarting,
                            message: node.isStarting ? 'Workspace is starting up...' : 'Workspace not started'
                        }
                    ));
                }
                
                const networks = await manager.getNetworks();
                res.json(networks);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to get networks: ' + error.message));
            }
        }
    );

    // Get specific network details
    RED.httpAdmin.get('/nodebit/workspace/:id/api/networks/:networkId', 
        RED.auth.needsPermission('nb-workspace.read'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                
                if (!manager.isReady()) {
                    return res.status(503).json(createErrorResponse('Workspace not ready'));
                }
                
                const networks = await manager.getNetworks();
                const network = networks.find(n => n.id === req.params.networkId);
                
                if (!network) {
                    return res.status(404).json(createErrorResponse('Network not found'));
                }
                
                res.json(network);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to get network: ' + error.message));
            }
        }
    );

    // Network management operations (future implementation)
    RED.httpAdmin.post('/nodebit/workspace/:id/api/networks/:networkId/start', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                // Future implementation for starting networks
                res.status(501).json(createErrorResponse('Network start operation not yet implemented'));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to start network: ' + error.message));
            }
        }
    );

    RED.httpAdmin.post('/nodebit/workspace/:id/api/networks/:networkId/stop', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                // Future implementation for stopping networks
                res.status(501).json(createErrorResponse('Network stop operation not yet implemented'));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to stop network: ' + error.message));
            }
        }
    );
}

module.exports = { registerNetworkRoutes };