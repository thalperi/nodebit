/**
 * Files API - File operation endpoints
 */

const { WorkspaceManager } = require('../lib/workspace-manager');
const { createErrorResponse, createSuccessResponse } = require('../utils/response-helpers');

function registerFileRoutes(RED) {
    // Test upload endpoint for configuration UI
    RED.httpAdmin.post('/nodebit/workspace/:id/api/test-upload', 
        RED.auth.needsPermission('nb-workspace.write'), 
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
                
                const { content, filename } = req.body;
                if (!content) {
                    return res.status(400).json(createErrorResponse('No content provided'));
                }
                
                // Get the first available Helia network
                const workspace = manager.getWorkspace();
                const networks = workspace.getNetworks();
                
                let heliaNetwork = null;
                for (const network of networks) {
                    if (network.helia) {
                        heliaNetwork = network;
                        break;
                    }
                }
                
                if (!heliaNetwork) {
                    return res.status(503).json(createErrorResponse('No Helia networks available'));
                }
                
                // Load UnixFS and upload
                const { unixfs } = await import('@helia/unixfs');
                const fs = unixfs(heliaNetwork.helia);
                
                const contentBytes = new TextEncoder().encode(content);
                const cid = await fs.addBytes(contentBytes);
                const cidString = cid.toString();
                
                res.json(createSuccessResponse({
                    cid: cidString,
                    file: {
                        name: filename || 'test-file.txt',
                        size: contentBytes.length,
                        type: 'text/plain'
                    },
                    links: {
                        ipfs: 'https://ipfs.io/ipfs/' + cidString,
                        gateway: 'https://gateway.ipfs.io/ipfs/' + cidString
                    }
                }));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Upload failed: ' + error.message));
            }
        }
    );

    // Get file information
    RED.httpAdmin.get('/nodebit/workspace/:id/api/files/:cid', 
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
                
                // Future implementation for file metadata retrieval
                res.status(501).json(createErrorResponse('File information retrieval not yet implemented'));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to get file info: ' + error.message));
            }
        }
    );

    // Download file content
    RED.httpAdmin.get('/nodebit/workspace/:id/api/files/:cid/content', 
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
                
                // Future implementation for file content retrieval
                res.status(501).json(createErrorResponse('File download not yet implemented'));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to download file: ' + error.message));
            }
        }
    );

    // List files (future implementation)
    RED.httpAdmin.get('/nodebit/workspace/:id/api/files', 
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
                
                // Future implementation for file listing
                res.json([]);
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to list files: ' + error.message));
            }
        }
    );

    // Pin file (future implementation)
    RED.httpAdmin.post('/nodebit/workspace/:id/api/files/:cid/pin', 
        RED.auth.needsPermission('nb-workspace.write'), 
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
                
                // Future implementation for file pinning
                res.status(501).json(createErrorResponse('File pinning not yet implemented'));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to pin file: ' + error.message));
            }
        }
    );

    // Unpin file (future implementation)
    RED.httpAdmin.delete('/nodebit/workspace/:id/api/files/:cid/pin', 
        RED.auth.needsPermission('nb-workspace.write'), 
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
                
                // Future implementation for file unpinning
                res.status(501).json(createErrorResponse('File unpinning not yet implemented'));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to unpin file: ' + error.message));
            }
        }
    );
}

module.exports = { registerFileRoutes };