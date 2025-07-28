/**
 * Nodebit Core Library
 * 
 * This is the heart of Nodebit - a unified abstraction layer that makes IPFS and OrbitDB
 * work together seamlessly. Think of this as the "operating system" for decentralized
 * storage in Node-RED.
 * 
 * Key Concepts for Junior Developers:
 * 
 * 1. RESOURCE-CENTRIC DESIGN
 *    Instead of managing connections, we manage resources (files, folders, databases).
 *    Users think "I want to store a file" not "I need to connect to IPFS first".
 * 
 * 2. UNIFIED ABSTRACTION
 *    Whether it's a file in IPFS or data in OrbitDB, we present a consistent interface.
 *    This reduces cognitive load and makes the system more intuitive.
 * 
 * 3. AUTOMATIC RESOURCE MANAGEMENT
 *    We handle IPFS connections, OrbitDB instances, and resource discovery automatically.
 *    The user focuses on their data, not the infrastructure.
 * 
 * 4. EVENT-DRIVEN ARCHITECTURE
 *    Everything communicates through events, making the system reactive and real-time.
 *    When a file changes, interested parties are notified automatically.
 */

const EventEmitter = require('events')
const path = require('path')
const fs = require('fs').promises
const crypto = require('crypto')

// Dynamic imports for ES modules
let createHelia, createOrbitDB, FsBlockstore, FsDatastore, createLibp2p, tcp, webSockets, noise, yamux, identify, Identities, KeyStore, OrbitDBAccessController

async function loadDependencies() {
    if (createHelia) return // Already loaded
    
    try {
        const heliaModule = await import('helia')
        createHelia = heliaModule.createHelia
        
        const orbitdbModule = await import('@orbitdb/core')
        createOrbitDB = orbitdbModule.createOrbitDB
        Identities = orbitdbModule.Identities
        KeyStore = orbitdbModule.KeyStore
        OrbitDBAccessController = orbitdbModule.OrbitDBAccessController
        
        const blockstoreModule = await import('blockstore-fs')
        FsBlockstore = blockstoreModule.FsBlockstore
        
        const datastoreModule = await import('datastore-fs')
        FsDatastore = datastoreModule.FsDatastore
        
        const libp2pModule = await import('libp2p')
        createLibp2p = libp2pModule.createLibp2p
        
        const tcpModule = await import('@libp2p/tcp')
        tcp = tcpModule.tcp
        
        const wsModule = await import('@libp2p/websockets')
        webSockets = wsModule.webSockets
        
        const noiseModule = await import('@chainsafe/libp2p-noise')
        noise = noiseModule.noise
        
        const yamuxModule = await import('@chainsafe/libp2p-yamux')
        yamux = yamuxModule.yamux
        
        const identifyModule = await import('@libp2p/identify')
        identify = identifyModule.identify
        
    } catch (error) {
        throw new Error(`Failed to load dependencies: ${error.message}`)
    }
}

/**
 * NodebitResource - Unified representation of any resource in the Nodebit ecosystem
 * 
 * This class represents anything that can be stored or managed: files, folders, databases.
 * By having a unified representation, we can build tools that work with any resource type.
 * 
 * Think of this like a "file" in a traditional OS - it has a path, metadata, and content,
 * but in our case it might be distributed across IPFS networks.
 */
class NodebitResource {
  constructor(type, identifier, metadata = {}) {
    this.type = type // 'file', 'folder', 'database'
    this.identifier = identifier // IPFS CID, OrbitDB address, or path
    this.metadata = {
      name: metadata.name || 'Unnamed Resource',
      size: metadata.size || 0,
      created: metadata.created || new Date(),
      modified: metadata.modified || new Date(),
      permissions: metadata.permissions || {},
      tags: metadata.tags || [],
      ...metadata
    }
    this.network = metadata.network || 'default' // Which IPFS network this belongs to
  }

  /**
   * Get a human-readable description of this resource
   * Useful for debugging and user interfaces
   */
  toString() {
    return `${this.type}:${this.metadata.name} (${this.identifier})`
  }

  /**
   * Check if this resource is the same as another
   * Two resources are equal if they have the same identifier
   */
  equals(other) {
    return other instanceof NodebitResource && 
           this.identifier === other.identifier &&
           this.type === other.type
  }
}

/**
 * NodebitWorkspace - The central manager for all IPFS networks and resources
 * 
 * This is like a "workspace" or "project" that contains all your IPFS networks,
 * files, and databases. It handles:
 * - Starting and stopping IPFS nodes
 * - Discovering resources across networks
 * - Managing connections and authentication
 * - Providing a unified view of all resources
 * 
 * For junior developers: Think of this as the "desktop" of your decentralized system.
 * Just like your computer's desktop shows files from different drives, this shows
 * resources from different IPFS networks.
 */
class NodebitWorkspace extends EventEmitter {
  constructor(options = {}) {
    super()
    
    // Configuration with sensible defaults
    this.config = {
      dataDir: options.dataDir || path.join(process.cwd(), '.nodebit'),
      autoStart: options.autoStart !== false, // Default to true
      networks: options.networks || {},
      ...options
    }
    
    // Internal state
    this.networks = new Map() // networkId -> { helia, orbitdb, config }
    this.resources = new Map() // resourceId -> NodebitResource
    this.isStarted = false
    this.activitiesLoaded = false
    
    // Resource discovery cache
    this.discoveryCache = new Map()
    this.lastDiscovery = null
    
    // DID/ACL Management
    this.identities = null
    this.systemOrbitDB = null
    this.didRegistry = null
    this.aclRegistry = null
    this.currentIdentity = null
    this.authenticatedDIDs = new Set()
    
    // Initialize logging and load activities
    this._initializeAsync()
  }
  
  async _initializeAsync() {
    // Initialize logging
    this.logger = this._createLogger()
    
    // Load activities from file
    await this._loadRecentActivities()
    this.activitiesLoaded = true
    
    this.logger.info('NodebitWorkspace created', { 
      dataDir: this.config.dataDir,
      autoStart: this.config.autoStart 
    })
  }

  /**
   * Start the workspace and initialize default networks
   * 
   * This is the main entry point - it sets up the local IPFS node and
   * connects to any configured remote networks.
   */
  async start() {
    if (this.isStarted) {
      this.logger.warn('Workspace already started')
      return
    }

    this.logger.info('Starting NodebitWorkspace...')
    
    try {
      // Load ES module dependencies
      await loadDependencies()
      
      // Ensure data directory exists
      await this._ensureDataDir()
      
      // Activities are already loaded in _createLogger, don't load again
      
      // Start default local network if configured
      if (this.config.autoStart) {
        try {
          // First try to detect existing Kubo nodes
          await this._detectKuboNodes()
          
          // Then create our own Helia node
          await this.addNetwork('local', {
            type: 'helia',
            config: {
              dataDir: path.join(this.config.dataDir, 'local')
              // Let the system choose random ports to avoid conflicts
            }
          })
          
          // Initialize DID/ACL system after local network is created
          // Wait a bit for the network to be fully ready
          setTimeout(async () => {
            let retryCount = 0
            const maxRetries = 2
            
            const tryInitialize = async () => {
              try {
                await this._initializeDIDACLSystem()
                this.logger.info('DID/ACL system initialized successfully')
              } catch (error) {
                retryCount++
                this.logger.error('DID/ACL system initialization failed', { 
                  error: error.message, 
                  stack: error.stack,
                  retryCount,
                  maxRetries
                })
                
                if (retryCount < maxRetries) {
                  // Retry after 3 seconds
                  setTimeout(tryInitialize, 3000)
                } else {
                  // After max retries, mark as failed but continue
                  this.logger.warn('DID/ACL system initialization failed after retries - continuing without security features')
                  this.didRegistry = null
                  this.aclRegistry = null
                  this.systemOrbitDB = null
                }
              }
            }
            
            tryInitialize()
          }, 3000) // Increased delay to ensure Helia is fully ready
          
        } catch (error) {
          this.logger.error('Failed to start networks', error)
          // Continue anyway - we'll show the error in the UI
        }
      }
      
      // Connect to any pre-configured networks
      for (const [networkId, networkConfig] of Object.entries(this.config.networks)) {
        await this.addNetwork(networkId, networkConfig)
      }
      
      // Start resource discovery
      this._startResourceDiscovery()
      
      this.isStarted = true
      this.emit('started')
      this.logger.info('NodebitWorkspace started successfully')
      
    } catch (error) {
      this.logger.error('Failed to start workspace', error)
      throw error
    }
  }

  /**
   * Stop the workspace and clean up all resources
   * 
   * This gracefully shuts down all IPFS nodes and OrbitDB instances.
   * Always call this when your application is shutting down to prevent data loss.
   */
  async stop() {
    if (!this.isStarted) {
      return
    }

    this.logger.info('Stopping NodebitWorkspace...')
    
    try {
      // Close DID/ACL system databases first
      if (this.didRegistry) {
        try {
          await this.didRegistry.close()
          this.didRegistry = null
          this.logger.info('DID registry closed')
        } catch (error) {
          this.logger.error('Error closing DID registry', error)
        }
      }
      
      if (this.aclRegistry) {
        try {
          await this.aclRegistry.close()
          this.aclRegistry = null
          this.logger.info('ACL registry closed')
        } catch (error) {
          this.logger.error('Error closing ACL registry', error)
        }
      }
      
      // Close system OrbitDB
      if (this.systemOrbitDB) {
        try {
          await this.systemOrbitDB.stop()
          this.systemOrbitDB = null
          this.logger.info('System OrbitDB stopped')
        } catch (error) {
          this.logger.error('Error stopping system OrbitDB', error)
        }
      }
      
      // Clear DID/ACL state
      this.identities = null
      this.currentIdentity = null
      this.authenticatedDIDs.clear()
      
      // Stop all networks
      for (const [networkId, network] of this.networks) {
        await this._stopNetwork(networkId, network)
      }
      
      this.networks.clear()
      this.resources.clear()
      this.isStarted = false
      
      this.emit('stopped')
      this.logger.info('NodebitWorkspace stopped successfully')
      
    } catch (error) {
      this.logger.error('Error stopping workspace', error)
      throw error
    }
  }

  /**
   * Add a new IPFS network to the workspace
   * 
   * Networks can be:
   * - 'helia': A local Helia IPFS node
   * - 'remote': Connection to an existing IPFS daemon
   * - 'cluster': Connection to an IPFS cluster
   * 
   * @param {string} networkId - Unique identifier for this network
   * @param {object} config - Network configuration
   */
  async addNetwork(networkId, config) {
    if (this.networks.has(networkId)) {
      throw new Error(`Network '${networkId}' already exists`)
    }

    this.logger.info('Adding network', { networkId, type: config.type })
    
    try {
      let network
      
      switch (config.type) {
        case 'helia':
          network = await this._createHeliaNetwork(config.config || {})
          break
        case 'remote':
          network = await this._connectRemoteNetwork(config.config || {})
          break
        case 'cluster':
          network = await this._connectClusterNetwork(config.config || {})
          break
        default:
          throw new Error(`Unknown network type: ${config.type}`)
      }
      
      // Store network configuration
      network.config = config
      network.id = networkId
      
      this.networks.set(networkId, network)
      
      // Emit event for UI updates
      this.emit('network.added', { networkId, network })
      
      this.logger.info('Network added successfully', { networkId })
      
      return network
      
    } catch (error) {
      this.logger.error('Failed to add network', { networkId, error })
      throw error
    }
  }

  /**
   * Remove a network from the workspace
   * 
   * This will stop the network and remove all associated resources from the cache.
   * Use with caution - any unsaved data may be lost.
   */
  async removeNetwork(networkId) {
    const network = this.networks.get(networkId)
    if (!network) {
      throw new Error(`Network '${networkId}' not found`)
    }

    this.logger.info('Removing network', { networkId })
    
    try {
      await this._stopNetwork(networkId, network)
      this.networks.delete(networkId)
      
      // Remove resources associated with this network
      for (const [resourceId, resource] of this.resources) {
        if (resource.network === networkId) {
          this.resources.delete(resourceId)
        }
      }
      
      this.emit('network.removed', { networkId })
      this.logger.info('Network removed successfully', { networkId })
      
    } catch (error) {
      this.logger.error('Failed to remove network', { networkId, error })
      throw error
    }
  }

  /**
   * Get information about all networks
   * 
   * Returns a summary of all connected networks, useful for UI display
   */
  getNetworks() {
    const networks = []
    
    for (const [networkId, network] of this.networks) {
      let networkInfo
      
      if (network.type === 'kubo') {
        // Handle Kubo nodes
        networkInfo = {
          id: networkId,
          name: `Kubo IPFS (${network.config.apiPort})`,
          type: 'kubo',
          status: 'connected',
          peerId: network.peerId || 'Unknown',
          addresses: network.addresses || [],
          peers: 0, // We'd need to query Kubo API for this
          databases: []
        }
      } else {
        // Handle Helia nodes
        networkInfo = {
          id: networkId,
          name: networkId.charAt(0).toUpperCase() + networkId.slice(1) + ' Helia',
          type: network.config?.type || 'helia',
          status: network.helia ? 'connected' : 'disconnected',
          peerId: network.helia?.libp2p?.peerId?.toString() || 'Unknown',
          addresses: network.helia?.libp2p?.getMultiaddrs?.()?.map(addr => addr.toString()) || [],
          peers: network.helia?.libp2p?.getPeers?.()?.length || 0,
          databases: []
        }
      }
      
      networks.push(networkInfo)
    }
    
    // Don't log every getNetworks call - too verbose
    return networks
  }

  /**
   * Discover all resources across all networks
   * 
   * This scans all connected IPFS networks and OrbitDB instances to build
   * a comprehensive catalog of available resources.
   */
  async discoverResources(force = false) {
    // Use cache if recent and not forced
    if (!force && this.lastDiscovery && Date.now() - this.lastDiscovery < 30000) {
      return Array.from(this.resources.values())
    }

    this.logger.info('Starting resource discovery...')
    
    try {
      const discoveredResources = []
      
      // Discover resources in each network
      for (const [networkId, network] of this.networks) {
        const networkResources = await this._discoverNetworkResources(networkId, network)
        discoveredResources.push(...networkResources)
      }
      
      // Update resource cache
      this.resources.clear()
      for (const resource of discoveredResources) {
        this.resources.set(resource.identifier, resource)
      }
      
      this.lastDiscovery = Date.now()
      this.emit('resources.discovered', { count: discoveredResources.length })
      
      this.logger.info('Resource discovery completed', { 
        count: discoveredResources.length 
      })
      
      return discoveredResources
      
    } catch (error) {
      this.logger.error('Resource discovery failed', error)
      throw error
    }
  }

  /**
   * Get a specific resource by identifier
   * 
   * @param {string} identifier - IPFS CID, OrbitDB address, or resource path
   * @returns {NodebitResource|null} The resource if found
   */
  getResource(identifier) {
    return this.resources.get(identifier) || null
  }

  /**
   * Search for resources by criteria
   * 
   * @param {object} criteria - Search criteria (name, type, tags, etc.)
   * @returns {NodebitResource[]} Matching resources
   */
  searchResources(criteria = {}) {
    const results = []
    
    for (const resource of this.resources.values()) {
      let matches = true
      
      // Check each criteria
      if (criteria.type && resource.type !== criteria.type) {
        matches = false
      }
      
      if (criteria.name && !resource.metadata.name.toLowerCase().includes(criteria.name.toLowerCase())) {
        matches = false
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        const hasAllTags = criteria.tags.every(tag => 
          resource.metadata.tags.includes(tag)
        )
        if (!hasAllTags) {
          matches = false
        }
      }
      
      if (criteria.network && resource.network !== criteria.network) {
        matches = false
      }
      
      if (matches) {
        results.push(resource)
      }
    }
    
    return results
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  /**
   * Create a local Helia IPFS network
   * 
   * This sets up a full IPFS node running locally. It's like running your own
   * personal IPFS server that can connect to the global IPFS network.
   */
  async _createHeliaNetwork(config) {
    const dataDir = config.dataDir || path.join(this.config.dataDir, 'helia')
    
    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true })
    
    // Find available ports or use random ones
    const basePort = config.swarmPort || this._getRandomPort()
    
    // Try multiple port ranges to avoid conflicts
    let libp2p = null
    let attempts = 0
    const maxAttempts = 5
    
    while (!libp2p && attempts < maxAttempts) {
      const tryPort = this._getRandomPort()
      attempts++
      
      try {
        // Create libp2p configuration with better error handling
        libp2p = await createLibp2p({
          addresses: {
            listen: [
              `/ip4/127.0.0.1/tcp/${tryPort}`,
              `/ip4/127.0.0.1/tcp/${tryPort + 1}/ws`
            ]
          },
          transports: [tcp(), webSockets()],
          connectionEncryption: [noise()],
          streamMuxers: [yamux()],
          services: {
            identify: identify()
          },
          transportManager: {
            faultTolerance: 'NO_FATAL' // Allow startup even if some addresses fail
          }
        })
        
        this.logger.info('Helia libp2p created successfully', { port: tryPort })
        break
        
      } catch (error) {
        this.logger.warn(`Failed to create libp2p on port ${tryPort}, attempt ${attempts}`, error.message)
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to create libp2p after ${maxAttempts} attempts: ${error.message}`)
        }
      }
    }
    
    // Create Helia instance
    const helia = await createHelia({
      libp2p,
      blockstore: new FsBlockstore(path.join(dataDir, 'blocks')),
      datastore: new FsDatastore(path.join(dataDir, 'datastore'))
    })
    
    // Create OrbitDB instance
    const orbitdb = await createOrbitDB({
      ipfs: helia,
      directory: path.join(dataDir, 'orbitdb')
    })
    
    this.logger.info('Helia network created', {
      peerId: helia.libp2p.peerId.toString(),
      addresses: helia.libp2p.getMultiaddrs().map(addr => addr.toString()),
      dataDir
    })
    
    return { helia, orbitdb, type: 'helia' }
  }
  
  /**
   * Get a random port number for IPFS
   */
  _getRandomPort() {
    return Math.floor(Math.random() * (65535 - 49152) + 49152)
  }
  
  /**
   * Load recent activities from file on startup
   */
  async _loadRecentActivities() {
    try {
      await fs.mkdir(path.dirname(this.activityLogFile), { recursive: true })
      
      if (await fs.access(this.activityLogFile).then(() => true).catch(() => false)) {
        const data = await fs.readFile(this.activityLogFile, 'utf8')
        const lines = data.trim().split('\n').filter(line => line.length > 0)
        
        // Load last 100 activities into memory
        const recentLines = lines.slice(-100)
        this.activityLog = recentLines.map(line => {
          try {
            return JSON.parse(line)
          } catch (e) {
            console.warn('Failed to parse activity line:', line)
            return null
          }
        }).filter(activity => activity !== null).reverse() // Newest first
        
        // Activities loaded successfully (don't log to console)
      }
    } catch (error) {
      // Loading failed (don't log to console)
    }
  }
  
  /**
   * Persist activity to file
   */
  async _persistActivity(activity) {
    try {
      const line = JSON.stringify(activity) + '\n'
      await fs.appendFile(this.activityLogFile, line)
    } catch (error) {
      // Don't log this error to avoid infinite loops
      console.warn('Failed to persist activity:', error.message)
    }
  }
  
  /**
   * Load older activities for lazy loading (returns activities before a given timestamp)
   */
  async loadOlderActivities(beforeTimestamp, limit = 50) {
    try {
      if (!await fs.access(this.activityLogFile).then(() => true).catch(() => false)) {
        return []
      }
      
      const data = await fs.readFile(this.activityLogFile, 'utf8')
      const lines = data.trim().split('\n').filter(line => line.length > 0)
      
      const activities = []
      // Read from end backwards to find activities before the timestamp
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const activity = JSON.parse(lines[i])
          if (activity.timestamp < beforeTimestamp) {
            activities.push(activity)
            if (activities.length >= limit) break
          }
        } catch (e) {
          // Skip invalid lines
        }
      }
      
      return activities // Already in reverse chronological order
    } catch (error) {
      this.logger.warn('Failed to load older activities', { error: error.message })
      return []
    }
  }
  
  /**
   * Detect existing Kubo IPFS nodes on the system
   */
  async _detectKuboNodes() {
    const commonPorts = [5001, 5002, 5003, 5004, 5005]
    
    for (const port of commonPorts) {
      try {
        // Try to connect to Kubo API
        const response = await fetch(`http://127.0.0.1:${port}/api/v0/id`, {
          method: 'POST',
          timeout: 2000
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Add as a remote network
          const networkId = `kubo-${port}`
          if (!this.networks.has(networkId)) {
            this.networks.set(networkId, {
              config: { type: 'kubo', apiPort: port },
              kuboApi: `http://127.0.0.1:${port}`,
              peerId: data.ID,
              addresses: data.Addresses || [],
              type: 'kubo',
              id: networkId
            })
            
            this.logger.info('Detected Kubo IPFS node', { 
              networkId, 
              port, 
              peerId: data.ID 
            })
            
            this.emit('network.added', { networkId, network: this.networks.get(networkId) })
          }
        }
      } catch (error) {
        // Ignore connection errors - just means no Kubo on this port
      }
    }
  }

  /**
   * Connect to a remote IPFS daemon
   * 
   * This connects to an existing IPFS node (like go-ipfs or js-ipfs) running
   * somewhere else. Useful for connecting to shared IPFS infrastructure.
   */
  async _connectRemoteNetwork(config) {
    // Implementation for remote IPFS connection
    // This would use ipfs-http-client to connect to a remote daemon
    throw new Error('Remote network connection not yet implemented')
  }

  /**
   * Connect to an IPFS cluster
   * 
   * IPFS clusters provide high availability and load balancing for IPFS.
   * This would connect to cluster endpoints.
   */
  async _connectClusterNetwork(config) {
    // Implementation for IPFS cluster connection
    throw new Error('Cluster network connection not yet implemented')
  }

  /**
   * Stop a specific network and clean up resources
   */
  async _stopNetwork(networkId, network) {
    this.logger.info('Stopping network', { networkId })
    
    try {
      if (network.orbitdb) {
        await network.orbitdb.stop()
      }
      
      if (network.helia) {
        await network.helia.stop()
      }
      
    } catch (error) {
      this.logger.error('Error stopping network', { networkId, error })
      // Don't throw - we want to continue cleanup
    }
  }

  /**
   * Discover resources within a specific network
   */
  async _discoverNetworkResources(networkId, network) {
    const resources = []
    
    try {
      // Discover OrbitDB databases
      if (network.orbitdb) {
        const databases = await this._getNetworkDatabases(network.orbitdb)
        for (const db of databases) {
          resources.push(new NodebitResource('database', db.address, {
            name: db.name,
            type: db.type,
            network: networkId
          }))
        }
      }
      
      // TODO: Discover IPFS files and folders
      // This would involve scanning pinned content, MFS, etc.
      
    } catch (error) {
      this.logger.error('Error discovering network resources', { networkId, error })
    }
    
    return resources
  }

  /**
   * Get all databases in an OrbitDB instance
   */
  async _getNetworkDatabases(orbitdb) {
    // This is a placeholder - OrbitDB doesn't have a built-in way to list all databases
    // In practice, we'd maintain our own registry or use naming conventions
    return []
  }

  /**
   * Ensure the data directory exists
   */
  async _ensureDataDir() {
    try {
      await fs.mkdir(this.config.dataDir, { recursive: true })
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }

  /**
   * Start periodic resource discovery
   */
  _startResourceDiscovery() {
    // Discover resources every 5 minutes
    setInterval(() => {
      this.discoverResources().catch(error => {
        this.logger.error('Periodic resource discovery failed', error)
      })
    }, 5 * 60 * 1000)
  }

  /**
   * Initialize the DID/ACL management system
   */
  async _initializeDIDACLSystem() {
    try {
      this.logger.info('Initializing DID/ACL management system...')
      
      // Ensure dependencies are loaded
      if (!createOrbitDB || !KeyStore || !Identities) {
        throw new Error('OrbitDB dependencies not loaded yet')
      }
      
      // Clean up any existing databases first
      if (this.didRegistry) {
        try {
          await this.didRegistry.close()
          this.didRegistry = null
          this.logger.info('Closed existing DID registry')
        } catch (error) {
          this.logger.warn('Error closing existing DID registry', error)
        }
      }
      
      if (this.aclRegistry) {
        try {
          await this.aclRegistry.close()
          this.aclRegistry = null
          this.logger.info('Closed existing ACL registry')
        } catch (error) {
          this.logger.warn('Error closing existing ACL registry', error)
        }
      }
      
      if (this.systemOrbitDB) {
        try {
          await this.systemOrbitDB.stop()
          this.systemOrbitDB = null
          this.logger.info('Closed existing system OrbitDB')
        } catch (error) {
          this.logger.warn('Error closing existing system OrbitDB', error)
        }
      }
      
      // Get the local Helia network for system OrbitDB
      const localNetwork = this.networks.get('local')
      if (!localNetwork || !localNetwork.helia) {
        throw new Error('Local Helia network required for DID/ACL system')
      }
      
      // Initialize identities with persistent keystore
      const keystorePath = path.join(this.config.dataDir, 'keystore')
      await fs.mkdir(keystorePath, { recursive: true })
      
      const keystore = await KeyStore({ path: keystorePath })
      this.identities = await Identities({ keystore })
      
      // Create system OrbitDB instance for DID/ACL management
      this.logger.info('Creating system OrbitDB instance...')
      
      // Wait for Helia to be fully ready
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Use unique ID to avoid conflicts
      const uniqueId = `nodebit-system-${Date.now()}`
      
      this.systemOrbitDB = await createOrbitDB({
        ipfs: localNetwork.helia,
        directory: path.join(this.config.dataDir, 'system-orbitdb'),
        id: uniqueId
      })
      this.logger.info('System OrbitDB created successfully', { 
        id: this.systemOrbitDB.id,
        directory: path.join(this.config.dataDir, 'system-orbitdb')
      })
      
      // Initialize system identity (admin identity)
      this.logger.info('Creating system identity...')
      this.currentIdentity = await this.identities.createIdentity({ id: 'nodebit-admin' })
      this.logger.info('System identity created successfully', { 
        id: this.currentIdentity.id,
        publicKey: this.currentIdentity.publicKey ? 'present' : 'missing'
      })
      
      try {
        // Create DID registry database with simpler approach
        this.logger.info('Creating DID registry database...')
        
        // Add another delay before database creation
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Use unique database name to avoid conflicts
        const didDbName = `did-registry-${Date.now()}`
        
        this.didRegistry = await this.systemOrbitDB.open(didDbName, {
          type: 'documents'
        })
        
        // Wait for database to be ready
        await new Promise(resolve => setTimeout(resolve, 500))
        
        this.logger.info('DID registry created successfully', { 
          address: this.didRegistry.address,
          type: this.didRegistry.type,
          name: didDbName
        })
      } catch (error) {
        this.logger.error('Failed to create DID registry', { 
          error: error.message, 
          stack: error.stack,
          identityId: this.currentIdentity.id,
          code: error.code,
          cause: error.cause
        })
        // Don't throw - continue with limited functionality
        this.didRegistry = null
      }
      
      try {
        // Create ACL registry database with simpler approach
        this.logger.info('Creating ACL registry database...')
        
        // Add another delay before database creation
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Use unique database name to avoid conflicts
        const aclDbName = `acl-registry-${Date.now()}`
        
        this.aclRegistry = await this.systemOrbitDB.open(aclDbName, {
          type: 'documents'
        })
        
        // Wait for database to be ready
        await new Promise(resolve => setTimeout(resolve, 500))
        
        this.logger.info('ACL registry created successfully', { 
          address: this.aclRegistry.address,
          type: this.aclRegistry.type,
          name: aclDbName
        })
      } catch (error) {
        this.logger.error('Failed to create ACL registry', { 
          error: error.message, 
          stack: error.stack,
          identityId: this.currentIdentity.id,
          code: error.code,
          cause: error.cause
        })
        // Don't throw - continue with limited functionality
        this.aclRegistry = null
      }
      
      // Add admin identity to authenticated DIDs
      this.authenticatedDIDs.add(this.currentIdentity.id)
      
      // Log final status
      if (this.didRegistry && this.aclRegistry) {
        this.logger.info('DID/ACL system initialized successfully', {
          adminIdentity: this.currentIdentity.id,
          didRegistryAddress: this.didRegistry.address,
          aclRegistryAddress: this.aclRegistry.address
        })
      } else {
        this.logger.warn('DID/ACL system partially initialized', {
          adminIdentity: this.currentIdentity.id,
          didRegistry: !!this.didRegistry,
          aclRegistry: !!this.aclRegistry,
          message: 'Some OrbitDB databases failed to create - system running with limited functionality'
        })
      }
      
    } catch (error) {
      this.logger.error('Failed to initialize DID/ACL system', error)
      throw error
    }
  }
  
  /**
   * Create or retrieve a DID identity
   */
  async createDID(id, metadata = {}) {
    if (!this.identities) {
      throw new Error('DID/ACL system not initialized')
    }
    
    try {
      const identity = await this.identities.createIdentity({ id })
      
      // Store DID metadata in registry
      await this.didRegistry.put({
        _id: identity.id,
        id: identity.id,
        publicKey: identity.publicKey,
        created: new Date().toISOString(),
        metadata,
        status: 'active'
      })
      
      this.logger.info('DID created', { id: identity.id })
      
      return identity
    } catch (error) {
      this.logger.error('Failed to create DID', { id, error })
      throw error
    }
  }

  /**
   * Update DID metadata
   */
  async updateDIDMetadata(didId, metadata = {}) {
    if (!this.didRegistry) {
      throw new Error('DID/ACL system not initialized')
    }
    
    try {
      // Get existing DID record first (OrbitDB requirement)
      const existingRecord = await this.didRegistry.get(didId)
      if (!existingRecord) {
        throw new Error(`DID ${didId} not found`)
      }
      
      // OrbitDB documents database: get() returns document without _id, but put() requires _id for updates
      // We need to explicitly set _id to the document key (didId)
      const updatedRecord = {
        _id: didId, // Explicitly set _id to the document key
        ...existingRecord, // This preserves all existing fields
        metadata: {
          ...existingRecord.metadata,
          ...metadata,
          lastModified: new Date().toISOString(),
          modifiedBy: 'dashboard-admin'
        }
      }
      
      // Put the updated document back - OrbitDB uses _id to recognize this as an update
      await this.didRegistry.put(updatedRecord)
      
      this.logger.info('DID metadata updated successfully', { 
        id: didId, 
        updatedFields: Object.keys(metadata) 
      })
      
      return updatedRecord
    } catch (error) {
      this.logger.error('Failed to update DID metadata', { 
        id: didId, 
        error: error.message,
        stack: error.stack 
      })
      throw error
    }
  }
  
  /**
   * Authenticate a DID
   */
  async authenticateDID(id, signature = null) {
    if (!this.didRegistry) {
      throw new Error('DID/ACL system not initialized')
    }
    
    try {
      // Get DID from registry
      const didRecord = await this.didRegistry.get(id)
      if (!didRecord) {
        throw new Error(`DID ${id} not found`)
      }
      
      if (didRecord.status !== 'active') {
        throw new Error(`DID ${id} is not active`)
      }
      
      // TODO: Implement proper signature verification
      // For now, we'll use a simplified authentication
      
      this.authenticatedDIDs.add(id)
      this.logger.info('DID authenticated', { id })
      
      return true
    } catch (error) {
      this.logger.error('DID authentication failed', { id, error })
      throw error
    }
  }
  
  /**
   * Check if a DID has permission for a specific action
   */
  async checkPermission(did, resource, action) {
    if (!this.aclRegistry) {
      throw new Error('DID/ACL system not initialized')
    }
    
    try {
      // Admin always has permission
      if (did === this.currentIdentity.id) {
        return true
      }
      
      // Check if DID is authenticated
      if (!this.authenticatedDIDs.has(did)) {
        return false
      }
      
      // Look up ACL rules
      const aclKey = `${resource}:${action}`
      const aclRecord = await this.aclRegistry.get(aclKey)
      
      if (!aclRecord) {
        // No specific rule, check default permissions
        return false
      }
      
      return aclRecord.allowedDIDs.includes(did) || aclRecord.allowedDIDs.includes('*')
      
    } catch (error) {
      this.logger.error('Permission check failed', { did, resource, action, error })
      return false
    }
  }
  
  /**
   * Grant permission to a DID for a specific resource/action
   */
  async grantPermission(did, resource, action, granterDID = null) {
    if (!this.aclRegistry) {
      throw new Error('DID/ACL system not initialized')
    }
    
    const granter = granterDID || this.currentIdentity.id
    
    // Check if granter has permission to grant
    if (granter !== this.currentIdentity.id) {
      const canGrant = await this.checkPermission(granter, resource, 'grant')
      if (!canGrant) {
        throw new Error('Insufficient permissions to grant access')
      }
    }
    
    try {
      const aclKey = `${resource}:${action}`
      let aclRecord = await this.aclRegistry.get(aclKey)
      
      if (!aclRecord) {
        aclRecord = {
          _id: aclKey,
          resource,
          action,
          allowedDIDs: [],
          created: new Date().toISOString(),
          createdBy: granter
        }
      }
      
      if (!aclRecord.allowedDIDs.includes(did)) {
        aclRecord.allowedDIDs.push(did)
        aclRecord.modified = new Date().toISOString()
        aclRecord.modifiedBy = granter
        
        await this.aclRegistry.put(aclRecord)
        
        this.logger.info('Permission granted', { did, resource, action, granter })
      }
      
      return true
    } catch (error) {
      this.logger.error('Failed to grant permission', { did, resource, action, error })
      throw error
    }
  }
  
  /**
   * Revoke permission from a DID
   */
  async revokePermission(did, resource, action, revokerDID = null) {
    if (!this.aclRegistry) {
      throw new Error('DID/ACL system not initialized')
    }
    
    const revoker = revokerDID || this.currentIdentity.id
    
    // Check if revoker has permission to revoke
    if (revoker !== this.currentIdentity.id) {
      const canRevoke = await this.checkPermission(revoker, resource, 'revoke')
      if (!canRevoke) {
        throw new Error('Insufficient permissions to revoke access')
      }
    }
    
    try {
      const aclKey = `${resource}:${action}`
      const aclRecord = await this.aclRegistry.get(aclKey)
      
      if (aclRecord && aclRecord.allowedDIDs.includes(did)) {
        aclRecord.allowedDIDs = aclRecord.allowedDIDs.filter(id => id !== did)
        aclRecord.modified = new Date().toISOString()
        aclRecord.modifiedBy = revoker
        
        await this.aclRegistry.put(aclRecord)
        
        this.logger.info('Permission revoked', { did, resource, action, revoker })
      }
      
      return true
    } catch (error) {
      this.logger.error('Failed to revoke permission', { did, resource, action, error })
      throw error
    }
  }
  
  /**
   * Get all DIDs in the registry
   */
  async getAllDIDs() {
    if (!this.didRegistry) {
      // Return empty array if DID system is not available
      this.logger.warn('DID registry not available - returning empty list')
      return []
    }
    
    try {
      const dids = []
      
      for await (const record of this.didRegistry.iterator()) {
        const did = record.value
        
        // Remove any records that don't conform to our design
        if (!did.id || did.id === 'undefined' || did.id === 'null' || did.id.trim() === '') {
          this.logger.info('Removing non-conforming DID record', { 
            key: record.key, 
            idValue: did.id 
          })
          
          try {
            await this.didRegistry.del(record.key)
          } catch (deleteError) {
            this.logger.error('Failed to delete non-conforming DID record', { 
              key: record.key, 
              error: deleteError.message 
            })
          }
        } else {
          dids.push(did)
        }
      }
      
      return dids
    } catch (error) {
      this.logger.error('Failed to get DIDs', { error: error.message, stack: error.stack })
      // Return empty array on error instead of throwing
      return []
    }
  }
  
  /**
   * Delete a DID from the registry
   */
  async deleteDID(didId) {
    if (!this.didRegistry) {
      throw new Error('DID/ACL system not initialized')
    }
    
    // Validate DID ID
    if (!didId || didId === 'undefined' || didId === 'null' || didId.trim() === '') {
      throw new Error(`Invalid DID identifier: ${didId}`)
    }
    
    try {
      // Check if DID exists
      const existingRecord = await this.didRegistry.get(didId)
      if (!existingRecord) {
        throw new Error(`DID ${didId} not found`)
      }
      
      // Delete the DID record
      await this.didRegistry.del(didId)
      
      // Remove from authenticated DIDs if present
      this.authenticatedDIDs.delete(didId)
      
      this.logger.info('DID deleted successfully', { id: didId })
      
      return true
    } catch (error) {
      this.logger.error('Failed to delete DID', { id: didId, error })
      throw error
    }
  }

  /**
   * Get all ACL rules
   */
  async getAllACLs() {
    if (!this.aclRegistry) {
      // Return empty array if ACL system is not available
      this.logger.warn('ACL registry not available - returning empty list')
      return []
    }
    
    try {
      const acls = []
      for await (const record of this.aclRegistry.iterator()) {
        acls.push(record.value)
      }
      return acls
    } catch (error) {
      this.logger.error('Failed to get ACLs', { error: error.message, stack: error.stack })
      // Return empty array on error instead of throwing
      return []
    }
  }

  /**
   * Create a logger instance with activity tracking and file persistence
   */
  _createLogger() {
    // Initialize activity log if not exists
    if (!this.activityLog) {
      this.activityLog = [];
    }
    
    // Set up activity log file path
    this.activityLogFile = path.join(this.config.dataDir, 'activity.jsonl');
    
    const addActivity = (level, message, data = {}) => {
      const activity = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data: typeof data === 'object' ? JSON.stringify(data) : data
      };
      
      this.activityLog.unshift(activity); // Add to beginning
      
      // Keep only last 100 activities in memory
      if (this.activityLog.length > 100) {
        this.activityLog = this.activityLog.slice(0, 100);
      }
      
      // Persist to file asynchronously
      this._persistActivity(activity);
      
      // Emit activity event for UI updates
      this.emit('activity', activity);
    };
    
    return {
      info: (message, data = {}) => {
        // Only log critical startup/shutdown to console, everything else goes to activity log
        if (message.includes('NodebitWorkspace started successfully') || message.includes('NodebitWorkspace stopped successfully')) {
          // Don't log to console anymore - let Node-RED handle its own messages
        }
        addActivity('info', message, data);
      },
      warn: (message, data = {}) => {
        // Don't log warnings to console anymore
        addActivity('warn', message, data);
      },
      error: (message, error = {}) => {
        // Don't log errors to console anymore - they'll be in activity log
        addActivity('error', message, error);
      }
    }
  }
}

// Export the main classes
module.exports = {
  NodebitWorkspace,
  NodebitResource
}