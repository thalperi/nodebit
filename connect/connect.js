module.exports = function(RED) {
    const path = require('path');
    const os = require('os'); // For home directory
    const fs = require('fs').promises; // For file system operations

    function NodebitConnectNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Configuration properties
        node.ipfsApiUrl = config.ipfsApiUrl; // For external IPFS
        node.orbitDbPath = config.orbitDbPath; // Path for OrbitDB storage

        // Set initial status based on configuration
        if (!node.ipfsApiUrl) {
            node.status({fill:"blue",shape:"dot",text:"waiting for IPFS"});
        }

        node.ipfs = null;
        node.orbitdb = null;

        // Declare variables for dynamically imported modules
        let createOrbitDB, createHeliaHTTP; // Changed from createIpfsHttpClient
        let modulesLoadedPromise; // Promise to track module loading
        const { initializeIdentities, getOrCreateIdentity } = require('../utils/did-acl');

        // Perform dynamic imports when the node is instantiated
        modulesLoadedPromise = (async () => {
            try {
                ({ createOrbitDB } = await import('@orbitdb/core'));
                ({ createHeliaHTTP } = await import('@helia/http')); // Changed from ipfs-http-client
                return true; // Modules loaded successfully
            } catch (e) {
                node.error(`Failed to load IPFS/OrbitDB modules: ${e.message}`);
                node.status({fill:"red",shape:"ring",text:"Module load error"});
                return false; // Modules failed to load
            }
        })();

        async function initializeIpfs() {
            if (!node.ipfsApiUrl) {
                node.status({fill:"blue",shape:"dot",text:"waiting for IPFS"});
                return false; // No API URL configured, so no connection attempt
            }
            try {
                node.status({fill:"blue",shape:"dot",text:"connecting to external IPFS..."});
                const loaded = await modulesLoadedPromise;
                if (!loaded || !createHeliaHTTP) {
                    node.error("Helia HTTP Client module not loaded. Check Node-RED logs for import errors.");
                    return false;
                }
                node.ipfs = await createHeliaHTTP({
                    url: node.ipfsApiUrl
                });
                node.log(`Attempting to connect to IPFS API at: ${node.ipfsApiUrl}`);

                const idResponse = await fetch(`${node.ipfsApiUrl}/id`, { method: 'POST' });
                if (!idResponse.ok) {
                    throw new Error(`Failed to fetch /id: ${idResponse.statusText}`);
                }
                const idInfo = await idResponse.json();
                node.log(`Successfully fetched /id. Data: ${JSON.stringify(idInfo)}`);
                node.ipfs.peerId = idInfo.ID;

                node.peerId = idInfo.ID;
                node.ipfsAgentVersion = idInfo.AgentVersion;
                node.ipfsProtocolVersion = idInfo.ProtocolVersion;
                node.ipfsAddresses = idInfo.Addresses;
                node.ipfsPublicKey = idInfo.PublicKey;
                node.log(`Assigned node properties from /id: peerId=${node.peerId}, agentVersion=${node.ipfsAgentVersion}`);

                const versionResponse = await fetch(`${node.ipfsApiUrl}/version`, { method: 'POST' });
                if (!versionResponse.ok) {
                    throw new Error(`Failed to fetch /version: ${versionResponse.statusText}`);
                }
                const versionInfo = await versionResponse.json();
                node.log(`Successfully fetched /version. Data: ${JSON.stringify(versionInfo)}`);
                node.ipfsKuboVersion = versionInfo.Version;
                node.ipfsRepoVersion = versionInfo.Repo;
                node.ipfsSystemVersion = versionInfo.System;
                node.ipfsGolangVersion = versionInfo.Golang;
                node.log(`Assigned node properties from /version: kuboVersion=${node.ipfsKuboVersion}`);

                node.ipfsMaxMemory = "16 GB (default)";
                node.ipfsMaxFileDescriptors = 524288;

                node.ipfsSwarmListeningAddresses = idInfo.Addresses.filter(addr => addr.includes('/ip4/') || addr.includes('/ip6/'));
                node.ipfsRpcApiServer = node.ipfsApiUrl;
                node.ipfsGatewayServer = node.ipfsApiUrl.replace('5001', '8080');
                node.ipfsWebUi = node.ipfsApiUrl.replace('5001', '5001/webui');
                node.log(`Assigned server properties: RpcApi=${node.ipfsRpcApiServer}, Gateway=${node.ipfsGatewayServer}, WebUi=${node.ipfsWebUi}`);


                node.status({fill:"green",shape:"dot",text:`Connected to ${node.ipfsApiUrl}`});
                node.log("IPFS connection successful.");
                return true;
            } catch (error) {
                node.status({fill:"red",shape:"ring",text:"external IPFS error"});
                node.error(`Failed to connect to external IPFS: ${error.message}`);
                node.log(`IPFS connection failed: ${error.message}`);
                return false;
            }
        }

        // Initialize IPFS
        initializeIpfs().then((success) => {
            if (!success && node.ipfsApiUrl) { // Only log error if connection was attempted and failed
                node.error("IPFS connection failed.");
            }
        });

        node.on('close', async function(done) {
            node.status({fill:"blue",shape:"dot",text:"closing..."});
            if (node.orbitdb) {
                await node.orbitdb.stop();
            }
            node.status({});
            done();
        });
        // Function to discover local IPFS nodes
        async function discoverIpfsNodes() {
            const detectedNodes = new Map(); // Use a Map to store unique nodes by API URL

            // Method 1: Check .ipfs/api file
            const ipfsApiPath = path.join(os.homedir(), '.ipfs', 'api');
            try {
                const apiContent = await fs.readFile(ipfsApiPath, 'utf8');
                const apiAddress = apiContent.trim();
                if (apiAddress) {
                    // Convert multiaddr to HTTP URL if necessary
                    let httpUrl = apiAddress;
                    if (apiAddress.startsWith('/ip4/') || apiAddress.startsWith('/ip6/')) {
                        const parts = apiAddress.split('/');
                        const ip = parts[2];
                        const port = parts[4];
                        httpUrl = `http://${ip}:${port}`;
                    }
                    detectedNodes.set(httpUrl, { apiAddress: httpUrl, source: '.ipfs/api' });
                }
            } catch (e) {
                // File not found or unreadable, ignore
                node.warn(`Could not read .ipfs/api file: ${e.message}`);
            }

            // Method 2: Probe Common Local Addresses and Ports
            const commonApiUrls = [
                'http://localhost:5001',
                'http://127.0.0.1:5001',
                'http://127.0.0.1:5002'
            ];

            for (const url of commonApiUrls) {
                if (detectedNodes.has(url)) continue; // Already found via .ipfs/api
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

                    const response = await fetch(`${url}/api/v0/id`, { method: 'POST', signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const idInfo = await response.json();
                        if (idInfo.ID) { // Check if it's a valid IPFS ID response
                            detectedNodes.set(url, {
                                apiAddress: url,
                                source: 'probe',
                                id: idInfo.ID,
                                agentVersion: idInfo.AgentVersion,
                                protocolVersion: idInfo.ProtocolVersion,
                                addresses: idInfo.Addresses,
                                publicKey: idInfo.PublicKey
                            });
                        }
                    }
                } catch (e) {
                    // Connection failed or timed out, ignore
                    node.warn(`Failed to probe IPFS API at ${url}: ${e.message}`);
                }
            }

            // Convert Map values to an array
            return Array.from(detectedNodes.values());
        }

        // Add a custom endpoint to retrieve node properties
        RED.httpAdmin.get("/nb-connect/:id/properties", RED.auth.needsPermission("nb-connect.read"), function(req, res) {
            var node = RED.nodes.getNode(req.params.id);
            if (node) {
                res.json({
                    peerId: node.peerId,
                    ipfsAgentVersion: node.ipfsAgentVersion,
                    ipfsProtocolVersion: node.ipfsProtocolVersion,
                    ipfsAddresses: node.ipfsAddresses,
                    ipfsPublicKey: node.ipfsPublicKey,
                    ipfsKuboVersion: node.ipfsKuboVersion,
                    ipfsRepoVersion: node.ipfsRepoVersion,
                    ipfsSystemVersion: node.ipfsSystemVersion,
                    ipfsGolangVersion: node.ipfsGolangVersion,
                    ipfsMaxMemory: node.ipfsMaxMemory,
                    ipfsMaxFileDescriptors: node.ipfsMaxFileDescriptors,
                    ipfsSwarmListeningAddresses: node.ipfsSwarmListeningAddresses,
                    ipfsRpcApiServer: node.ipfsRpcApiServer,
                    ipfsGatewayServer: node.ipfsGatewayServer,
                    ipfsWebUi: node.ipfsWebUi
                });
            } else {
                res.status(404).send("Node not found");
            }
        });

        // New endpoint for IPFS node discovery
        RED.httpAdmin.get("/nb-connect/discover-ipfs-nodes", RED.auth.needsPermission("nb-connect.read"), async function(req, res) {
            try {
                const detectedNodes = await discoverIpfsNodes();

                // Filter out already "flowing" instances
                const flowingInstances = new Set();
                RED.nodes.eachNode(function(node) {
                    if (node.type === "nb-connect" && node.ipfsApiUrl) {
                        flowingInstances.add(node.ipfsApiUrl);
                    }
                });

                const availableNodes = detectedNodes.filter(node => !flowingInstances.has(node.apiAddress));

                res.json(availableNodes);
            } catch (error) {
                RED.log.error(`Error during IPFS node discovery: ${error.message}`);
                res.status(500).json({ error: "Failed to discover IPFS nodes", details: error.message });
            }
        });

    }
    RED.nodes.registerType('nb-connect', NodebitConnectNode);
}
