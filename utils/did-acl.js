// utils/did-acl.js
// This file will contain modularized functions for DID/ACL management

import { Identities, KeyStore, IPFSAccessController, OrbitDBAccessController } from '@orbitdb/core';
import path from 'path';

/**
 * Initializes OrbitDB Identities with a persistent KeyStore.
 * @param {object} RED - The Node-RED runtime object.
 * @param {string} baseDir - The base directory for the keystore.
 * @returns {Promise<Identities>} The initialized Identities instance.
 */
export async function initializeIdentities(RED, baseDir) {
    const keystorePath = path.join(RED.settings.userDir, baseDir, 'keystore');
    const keystore = await KeyStore({ path: keystorePath });
    return Identities({ keystore });
}

/**
 * Creates or retrieves an OrbitDB identity.
 * @param {Identities} identities - The initialized Identities instance.
 * @param {string} id - The ID for the identity (e.g., 'admin', 'service-account-1').
 * @returns {Promise<object>} The created or retrieved identity.
 */
export async function getOrCreateIdentity(identities, id) {
    return identities.createIdentity({ id });
}

/**
 * Returns an IPFSAccessController instance.
 * @param {string[]} writeAccess - Array of identity IDs or '*' for public write access.
 * @returns {Function} The IPFSAccessController function.
 */
export function getIPFSAccessController(writeAccess) {
    return IPFSAccessController({ write: writeAccess });
}

/**
 * Returns an OrbitDBAccessController instance.
 * This controller allows mutable access control.
 * @param {string[]} writeAccess - Initial array of identity IDs for write access.
 * @returns {Function} The OrbitDBAccessController function.
 */
export function getOrbitDBAccessController(writeAccess) {
    return OrbitDBAccessController({ write: writeAccess });
}

// You can add more utility functions here for DID/ACL management,
// such as functions to generate new DIDs, manage groups, etc.