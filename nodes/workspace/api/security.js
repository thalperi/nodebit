/**
 * Security API - DID/ACL management endpoints
 */

const { WorkspaceManager } = require('../lib/workspace-manager');
const { createErrorResponse, createSuccessResponse } = require('../utils/response-helpers');
const { validateDIDInput, validateACLInput } = require('../utils/validation');

function registerSecurityRoutes(RED) {
    // Get all DIDs
    RED.httpAdmin.get('/nodebit/workspace/:id/api/dids', 
        RED.auth.needsPermission('nb-workspace.read'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const dids = await manager.getAllDIDs();
                res.json(dids);
                
            } catch (error) {
                if (error.message.includes('not started')) {
                    res.status(503).json(createErrorResponse(error.message));
                } else {
                    // Return empty array instead of error for DID/ACL system issues
                    res.json([]);
                }
            }
        }
    );

    // Create a new DID
    RED.httpAdmin.post('/nodebit/workspace/:id/api/dids', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const { id, metadata } = req.body;
                
                const validation = validateDIDInput(id, metadata);
                if (!validation.valid) {
                    return res.status(400).json(createErrorResponse(validation.error));
                }
                
                const manager = new WorkspaceManager(node);
                const identity = await manager.createDID(id, metadata || {});
                
                res.json(createSuccessResponse({
                    did: {
                        id: identity.id,
                        publicKey: identity.publicKey
                    }
                }));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to create DID: ' + error.message));
            }
        }
    );

    // Authenticate a DID
    RED.httpAdmin.post('/nodebit/workspace/:id/api/dids/:didId/authenticate', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const { didId } = req.params;
                const { signature } = req.body;
                
                const authenticated = await manager.authenticateDID(didId, signature);
                res.json({ success: authenticated });
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Authentication failed: ' + error.message));
            }
        }
    );

    // Get all ACL rules
    RED.httpAdmin.get('/nodebit/workspace/:id/api/acls', 
        RED.auth.needsPermission('nb-workspace.read'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const manager = new WorkspaceManager(node);
                const acls = await manager.getAllACLs();
                res.json(acls);
                
            } catch (error) {
                if (error.message.includes('not started')) {
                    res.status(503).json(createErrorResponse(error.message));
                } else {
                    // Return empty array instead of error for DID/ACL system issues
                    res.json([]);
                }
            }
        }
    );

    // Grant permission
    RED.httpAdmin.post('/nodebit/workspace/:id/api/acls/grant', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const { did, resource, action } = req.body;
                
                const validation = validateACLInput(did, resource, action);
                if (!validation.valid) {
                    return res.status(400).json(createErrorResponse(validation.error));
                }
                
                const manager = new WorkspaceManager(node);
                await manager.grantPermission(did, resource, action);
                res.json(createSuccessResponse());
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to grant permission: ' + error.message));
            }
        }
    );

    // Revoke permission
    RED.httpAdmin.post('/nodebit/workspace/:id/api/acls/revoke', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const { did, resource, action } = req.body;
                
                const validation = validateACLInput(did, resource, action);
                if (!validation.valid) {
                    return res.status(400).json(createErrorResponse(validation.error));
                }
                
                const manager = new WorkspaceManager(node);
                await manager.revokePermission(did, resource, action);
                res.json(createSuccessResponse());
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to revoke permission: ' + error.message));
            }
        }
    );

    // Update DID metadata
    RED.httpAdmin.put('/nodebit/workspace/:id/api/dids/:didId', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const { didId } = req.params;
                const { metadata } = req.body;
                
                if (!didId) {
                    return res.status(400).json(createErrorResponse('DID ID is required'));
                }
                
                const manager = new WorkspaceManager(node);
                const updatedDID = await manager.updateDIDMetadata(didId, metadata || {});
                
                res.json(createSuccessResponse({
                    did: updatedDID
                }));
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to update DID: ' + error.message));
            }
        }
    );

    // Delete a DID
    RED.httpAdmin.delete('/nodebit/workspace/:id/api/dids/:didId', 
        RED.auth.needsPermission('nb-workspace.write'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const didId = decodeURIComponent(req.params.didId);
                
                // Validate DID ID - reject undefined, null, or empty values
                if (!didId || didId === 'undefined' || didId === 'null' || didId.trim() === '') {
                    return res.status(400).json(createErrorResponse('Invalid DID identifier: ' + didId));
                }
                
                const manager = new WorkspaceManager(node);
                const success = await manager.deleteDID(didId);
                
                if (success) {
                    res.json(createSuccessResponse('DID deleted successfully'));
                } else {
                    res.status(400).json(createErrorResponse('Failed to delete DID'));
                }
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to delete DID: ' + error.message));
            }
        }
    );

    // Check permission
    RED.httpAdmin.post('/nodebit/workspace/:id/api/acls/check', 
        RED.auth.needsPermission('nb-workspace.read'), 
        async function(req, res) {
            try {
                const node = RED.nodes.getNode(req.params.id);
                if (!node) {
                    return res.status(404).json(createErrorResponse('Workspace not found'));
                }
                
                const { did, resource, action } = req.body;
                
                const validation = validateACLInput(did, resource, action);
                if (!validation.valid) {
                    return res.status(400).json(createErrorResponse(validation.error));
                }
                
                const manager = new WorkspaceManager(node);
                const hasPermission = await manager.checkPermission(did, resource, action);
                res.json({ hasPermission });
                
            } catch (error) {
                res.status(500).json(createErrorResponse('Failed to check permission: ' + error.message));
            }
        }
    );
}

module.exports = { registerSecurityRoutes };