/**
 * nb-workspace Configuration Node
 * 
 * This is the central hub for managing IPFS networks and OrbitDB resources.
 * It provides a Distributed Data Dashboard for browsing and managing decentralized data.
 * 
 * MODULARIZED VERSION - Main logic moved to separate modules for better maintainability
 */

const { createWorkspaceNode } = require('./lib/node-factory');
const { registerAPIRoutes } = require('./api');

module.exports = function(RED) {
    // Register the node type using the modular factory
    RED.nodes.registerType("nb-workspace", createWorkspaceNode(RED));
    
    // Register HTTP API routes using the modular system
    if (RED.httpAdmin) {
        registerAPIRoutes(RED);
    }
};