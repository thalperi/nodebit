/**
 * API Index - Route registration coordinator
 */

const { registerNetworkRoutes } = require('./networks');
const { registerActivityRoutes } = require('./activity');
const { registerSecurityRoutes } = require('./security');
const { registerFileRoutes } = require('./files');
const { registerDebugRoutes } = require('./debug');
const { generateAdminInterface } = require('../ui/html-generator');

function registerAPIRoutes(RED) {
    if (!RED.httpAdmin) {
        return;
    }

    // Main workspace management interface
    RED.httpAdmin.get('/nodebit/workspace/:id/ddd', 
        RED.auth.needsPermission('nb-workspace.read'), 
        function(req, res) {
            const node = RED.nodes.getNode(req.params.id);
            
            if (!node) {
                return res.status(404).send('Workspace not found');
            }
            
            // Serve the Distributed Data Dashboard interface
            const adminHTML = generateAdminInterface(node);
            res.send(adminHTML);
        }
    );

    // Status endpoint for workspace initialization check
    RED.httpAdmin.get('/nodebit/workspace/:id/api/status', 
        RED.auth.needsPermission('nb-workspace.read'), 
        function(req, res) {
            const node = RED.nodes.getNode(req.params.id);
            
            if (!node) {
                return res.status(404).json({ error: 'Workspace not found' });
            }
            
            // Return workspace status
            const status = {
                isStarted: node.isStarted || false,
                isStarting: node.isStarting || false,
                isReady: node.isReady ? node.isReady() : false,
                config: node.config || {},
                timestamp: new Date().toISOString()
            };
            
            res.json(status);
        }
    );

    // Stats endpoint for dashboard overview
    RED.httpAdmin.get('/nodebit/workspace/:id/api/stats', 
        RED.auth.needsPermission('nb-workspace.read'), 
        function(req, res) {
            const node = RED.nodes.getNode(req.params.id);
            
            if (!node) {
                return res.status(404).json({ error: 'Workspace not found' });
            }
            
            // Return basic stats - can be enhanced later
            const stats = {
                networks: 1,
                databases: 0,
                files: 0,
                peers: 0
            };
            
            res.json(stats);
        }
    );

    // Register all API route modules
    registerNetworkRoutes(RED);
    registerActivityRoutes(RED);
    registerSecurityRoutes(RED);
    registerFileRoutes(RED);
    registerDebugRoutes(RED);
}

module.exports = { registerAPIRoutes };