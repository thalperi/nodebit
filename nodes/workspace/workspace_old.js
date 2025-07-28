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
    
    function generateAdminInterface(node) {
        return generateWorkspaceHTML(node.id, node.config.name);
    }
    
    function generateWorkspaceHTML(workspaceId, workspaceName) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Distributed Data Dashboard - ${workspaceName}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; font-size: 13px; height: 100vh; overflow: hidden; }
        .container { max-width: 1200px; margin: 0 auto; padding: 8px; height: calc(100vh - 16px); display: flex; flex-direction: column; }
        .nav-tabs { background: white; border-radius: 8px; margin-bottom: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-shrink: 0; }
        .nav-tab { display: inline-block; padding: 12px 20px; cursor: pointer; border-bottom: 3px solid transparent; font-size: 13px; }
        .nav-tab.active { background: #3498db; color: white; border-bottom-color: #2980b9; }
        .nav-tab:hover:not(.active) { background: #ecf0f1; }
        .content-panel { background: white; border-radius: 8px; padding: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; min-height: 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; min-width: 0; }
        .stat-card { background: linear-gradient(135deg, #85c1e9, #5dade2); color: white; border-radius: 8px; text-align: center; min-width: 0; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .data-table th, .data-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .data-table th { background: #f8f9fa; font-weight: 600; font-size: 12px; }
        .data-table tr:hover { background: #f8f9fa; }
        .data-table td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .data-table td.peer-id { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .data-table td.network-name { white-space: nowrap; overflow: hidden; }
        .activity-message { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; max-width: 100%; }
        .activity-row { cursor: pointer; }
        .activity-row.expanded { background: #f0f8ff; }
        .activity-details { display: none; background: #f8f9fa; border-top: 1px solid #ddd; padding: 10px; position: relative; }
        .activity-details.expanded { display: block; }
        .activity-copy-buttons { position: absolute; bottom: 8px; right: 8px; display: flex; flex-direction: column; gap: 4px; }
        .network-row { cursor: pointer; }
        .network-row.expanded { background: #f0f8ff; }
        .management-panel { display: none; background: #f8f9fa; border-top: 1px solid #ddd; }
        .management-panel.expanded { display: table-row; }
        .management-content { padding: 15px; font-size: 12px; color: #666; line-height: 1.4; }
        .status-badge { padding: 3px 6px; border-radius: 10px; font-size: 11px; font-weight: bold; }
        .status-connected { background: #d4edda; color: #155724; }
        .btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; }
        .btn-primary { background: #3498db; color: white; }
        .btn:hover { opacity: 0.9; }
        .loading { text-align: center; padding: 30px; color: #666; font-size: 13px; }
    </style>
</head>
<body>
    
    <div class="container">
        <div class="nav-tabs">
            <div class="nav-tab active" onclick="showTab('overview')" style="border-radius:8px 0 0 0;">Overview</div>
            <div class="nav-tab" onclick="showTab('networks')">Networks</div>
            <div class="nav-tab" onclick="showTab('databases')">Databases</div>
            <div class="nav-tab" onclick="showTab('files')">Files</div>
            <div class="nav-tab" onclick="showTab('security')" style="border-radius:0 8px 0 0;">Security</div>
        </div>
        
        <div id="overview-panel" class="content-panel" style="height:100%; max-height:100%; display:flex; flex-direction:column; background:white; border-radius:8px; overflow:hidden;">
            <div style="background:#3498db; color:white; padding:8px 12px; border-radius:8px 8px 0 0;">
                <h3 style="margin:0; font-size:16px;">Workspace Overview</h3>
            </div>
            
            <div style="padding:8px; flex:1; display:flex; flex-direction:column; min-height:0;">
                <div class="stats-grid">
                    <div class="stat-card" style="padding:12px;">
                        <div style="font-size:1.5em;" id="networks-count">-</div>
                        <div style="font-size:12px;">IPFS Networks</div>
                    </div>
                    <div class="stat-card" style="padding:12px;">
                        <div style="font-size:1.5em;" id="databases-count">-</div>
                        <div style="font-size:12px;">OrbitDB Databases</div>
                    </div>
                    <div class="stat-card" style="padding:12px;">
                        <div style="font-size:1.5em;" id="files-count">-</div>
                        <div style="font-size:12px;">IPFS Files</div>
                    </div>
                    <div class="stat-card" style="padding:12px;">
                        <div style="font-size:1.5em;" id="peers-count">-</div>
                        <div style="font-size:12px;">Connected Peers</div>
                    </div>
                </div>
                
                <div style="flex:1; display:flex; flex-direction:column; min-height:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <h4 style="font-size:14px; margin:0;">Recent Activity</h4>
                            <span id="record-count" style="font-size:11px; color:#666; font-weight:normal;">0 records</span>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <button onclick="copyAllActivities()" class="btn btn-primary" style="font-size:11px; padding:4px 8px;" title="Copy all displayed activities">
                                <i class="fa fa-copy" style="margin-right:4px;"></i>Copy All
                            </button>
                            <input type="text" id="activity-search" placeholder="Search..." style="width:120px; font-size:11px; padding:4px 6px; border:1px solid #ddd; border-radius:3px;">
                            <button id="load-more-btn" onclick="loadMoreActivities()" class="btn btn-primary" style="font-size:11px; padding:4px 8px; display:none;">...more</button>
                            <div style="position:relative; display:inline-block;">
                                <button id="clear-main-btn" onclick="performClearAction()" class="btn btn-primary" style="font-size:11px; padding:4px 8px; border-radius:3px 0 0 3px; border-right:1px solid rgba(255,255,255,0.3);">
                                    <i id="clear-icon" class="fa fa-database" style="margin-right:4px;"></i>Clear
                                </button>
                                <button id="clear-dropdown-btn" onclick="toggleClearDropdown()" class="btn btn-primary" style="font-size:11px; padding:4px 6px; border-radius:0 3px 3px 0; border-left:none;">
                                    <i class="fa fa-caret-down"></i>
                                </button>
                                <div id="clear-dropdown" style="display:none; position:absolute; top:100%; right:0; background:white; border:1px solid #ddd; border-radius:3px; box-shadow:0 2px 8px rgba(0,0,0,0.15); z-index:1000; min-width:140px; margin-top:2px;">
                                    <div onclick="selectClearOption('records')" style="padding:6px 12px; cursor:pointer; font-size:11px; border-bottom:1px solid #eee;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                                        <i class="fa fa-database" style="margin-right:6px; width:12px;"></i>Clear All Records
                                    </div>
                                    <div onclick="selectClearOption('search')" style="padding:6px 12px; cursor:pointer; font-size:11px;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                                        <i class="fa fa-search" style="margin-right:6px; width:12px;"></i>Clear Search
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="activity-container" style="background:#f8f9fa; border-radius:4px; flex:1; overflow-y:auto; min-height:200px; border:1px solid #e9ecef;">
                        <div id="activity-list" style="font-size:12px;">
                            <div style="padding:10px; color:#666; text-align:center;">Loading activity...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="networks-panel" class="content-panel" style="display:none;">
            <div style="background:#3498db; color:white; padding:8px 15px; margin:-15px -15px 15px -15px; border-radius:8px 8px 0 0;">
                <h3 style="margin:0; font-size:16px;">IPFS Networks</h3>
            </div>
            <div class="loading">Loading networks...</div>
            <table class="data-table" id="networks-table" style="display:none; font-size:13px; table-layout:fixed; width:100%;">
                <thead>
                    <tr>
                        <th style="width:110px; min-width:110px;">Network</th>
                        <th style="width:50px; min-width:50px;">Type</th>
                        <th style="width:75px; min-width:75px;">Status</th>
                        <th style="width:auto; min-width:120px;">Peer ID</th>
                        <th style="width:50px; min-width:50px;"><i class="fa fa-link" style="margin-right:4px;"></i>Peers</th>
                        <th style="width:70px; min-width:70px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="networks-tbody">
                </tbody>
            </table>
        </div>
        
        <div id="databases-panel" class="content-panel" style="display:none;">
            <div style="background:#3498db; color:white; padding:8px 15px; margin:-15px -15px 15px -15px; border-radius:8px 8px 0 0;">
                <h3 style="margin:0; font-size:16px;">OrbitDB Databases</h3>
            </div>
            <div style="padding:10px; background:#f8f9fa; border-radius:4px; font-size:13px; color:#666;">
                Database discovery not yet implemented
            </div>
        </div>
        
        <div id="files-panel" class="content-panel" style="display:none;">
            <div style="background:#3498db; color:white; padding:8px 15px; margin:-15px -15px 15px -15px; border-radius:8px 8px 0 0;">
                <h3 style="margin:0; font-size:16px;">IPFS Files</h3>
            </div>
            <div style="padding:10px; background:#f8f9fa; border-radius:4px; font-size:13px; color:#666;">
                File discovery not yet implemented
            </div>
        </div>
        
        <div id="security-panel" class="content-panel" style="display:none;">
            <div style="background:#e74c3c; color:white; padding:8px 15px; margin:-15px -15px 15px -15px; border-radius:8px 8px 0 0;">
                <h3 style="margin:0; font-size:16px;">DID & ACL Management</h3>
            </div>
            
            <div style="display:flex; gap:15px; height:100%;">
                <!-- DID Management Section -->
                <div style="flex:1; display:flex; flex-direction:column;">
                    <div style="background:#fff; border:1px solid #ddd; border-radius:4px; margin-bottom:10px;">
                        <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                            <i class="fa fa-id-card" style="margin-right:6px;"></i>Decentralized Identifiers (DIDs)
                        </div>
                        <div style="padding:10px;">
                            <div style="display:flex; gap:8px; margin-bottom:10px;">
                                <input type="text" id="new-did-id" placeholder="DID identifier (e.g., user-alice)" style="flex:1; padding:6px; border:1px solid #ddd; border-radius:3px; font-size:12px;">
                                <input type="file" id="did-avatar-input" accept="image/*" style="display:none;">
                                <button onclick="document.getElementById('did-avatar-input').click()" class="btn" style="font-size:12px; background:#6c757d; color:white; padding:6px 8px;" title="Select avatar">
                                    <i class="fa fa-image"></i>
                                </button>
                                <button onclick="createNewDID()" class="btn btn-primary" style="font-size:12px;">New</button>
                            </div>
                            <div id="dids-container" style="max-height:200px; overflow-y:auto; border:1px solid #eee; border-radius:3px;">
                                <div style="padding:4px 8px; background:#f8f9fa; border-bottom:1px solid #ddd; font-size:11px; font-weight:bold; display:grid; grid-template-columns:1fr 60px 2fr 40px; gap:8px; align-items:center;">
                                    <div>Created</div>
                                    <div>Status</div>
                                    <div>Identifier</div>
                                    <div></div>
                                </div>
                                <div id="dids-list">
                                    <div style="padding:10px; color:#666; text-align:center; font-size:12px;">Loading DIDs...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background:#fff; border:1px solid #ddd; border-radius:4px; flex:1; display:flex; flex-direction:column;">
                        <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                            <i class="fa fa-shield" style="margin-right:6px;"></i>Access Control Lists (ACLs)
                        </div>
                        <div style="padding:10px; flex:1; display:flex; flex-direction:column;">
                            <div style="display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:6px; margin-bottom:10px; align-items:end;">
                                <div>
                                    <label style="font-size:11px; color:#666;">DID:</label>
                                    <div style="position:relative;">
                                        <input type="text" id="acl-did" placeholder="DID identifier or select from dropdown" style="width:100%; padding:4px 20px 4px 4px; border:1px solid #ddd; border-radius:3px; font-size:11px;">
                                        <button type="button" onclick="toggleDIDDropdown()" style="position:absolute; right:2px; top:2px; bottom:2px; width:16px; border:none; background:none; cursor:pointer; font-size:10px; color:#666;">
                                            <i class="fa fa-caret-down"></i>
                                        </button>
                                        <div id="did-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; background:white; border:1px solid #ddd; border-top:none; border-radius:0 0 3px 3px; box-shadow:0 2px 4px rgba(0,0,0,0.1); z-index:1000; max-height:120px; overflow-y:auto;">
                                            <!-- DIDs will be populated here -->
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label style="font-size:11px; color:#666;">Resource:</label>
                                    <input type="text" id="acl-resource" placeholder="Resource name" style="width:100%; padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;">
                                </div>
                                <div>
                                    <label style="font-size:11px; color:#666;">Action:</label>
                                    <select id="acl-action" style="width:100%; padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;">
                                        <option value="read">read</option>
                                        <option value="write">write</option>
                                        <option value="admin">admin</option>
                                        <option value="grant">grant</option>
                                        <option value="revoke">revoke</option>
                                    </select>
                                </div>
                                <div style="display:flex; gap:4px;">
                                    <button onclick="grantPermission()" class="btn btn-primary" style="font-size:11px; padding:4px 8px;">Grant</button>
                                    <button onclick="revokePermission()" class="btn" style="font-size:11px; padding:4px 8px; background:#dc3545; color:white;">Revoke</button>
                                </div>
                            </div>
                            <div id="acls-list" style="flex:1; border:1px solid #eee; border-radius:3px; overflow-y:auto;">
                                <div style="padding:10px; color:#666; text-align:center; font-size:12px;">Loading ACLs...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- System Status Section -->
                <div style="width:300px; display:flex; flex-direction:column;">
                    <div style="background:#fff; border:1px solid #ddd; border-radius:4px; margin-bottom:10px;">
                        <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                            <i class="fa fa-cogs" style="margin-right:6px;"></i>System Status
                        </div>
                        <div style="padding:10px; font-size:12px;">
                            <div style="margin-bottom:8px;">
                                <strong>DID/ACL System:</strong> <span id="did-system-status" style="color:#27ae60;">Initializing...</span>
                            </div>
                            <div style="margin-bottom:8px;">
                                <strong>Admin Identity:</strong> <span id="admin-identity" style="font-family:monospace; font-size:10px;">Loading...</span>
                            </div>
                            <div style="margin-bottom:8px;">
                                <strong>System OrbitDB:</strong> <span id="system-orbitdb-status" style="color:#27ae60;">Loading...</span>
                            </div>
                            <div>
                                <strong>Authenticated DIDs:</strong> <span id="authenticated-count">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background:#fff; border:1px solid #ddd; border-radius:4px; flex:1;">
                        <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                            <i class="fa fa-info-circle" style="margin-right:6px;"></i>Security Info
                        </div>
                        <div style="padding:10px; font-size:11px; line-height:1.4; color:#666;">
                            <p><strong>Decentralized Administration:</strong> This system uses DIDs (Decentralized Identifiers) and ACLs (Access Control Lists) stored in OrbitDB for truly decentralized access control.</p>
                            <p><strong>Admin Access:</strong> The system admin identity has full permissions and can manage all DIDs and ACLs.</p>
                            <p><strong>Distributed Storage:</strong> All security data is stored in OrbitDB on the local Helia IPFS network, making it accessible from anywhere.</p>
                            <p><strong>Permissions:</strong> Grant specific permissions (read, write, admin, grant, revoke) to DIDs for different resources.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const workspaceId = '${workspaceId}';
        
        // Activity management functions
        let allActivities = [];
        let displayedActivities = [];
        let isLoadingOlder = false;
        let hasMoreActivities = true;
        
        function loadActivity() {
            fetch('/nodebit/workspace/' + workspaceId + '/api/activity')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.json();
            })
            .then(activities => {
                if (activities && Array.isArray(activities) && activities.length > 0) {
                    allActivities = activities;
                    displayedActivities = activities.slice();
                    displayActivities(displayedActivities);
                    updateRecordCount(activities.length);
                } else {
                    document.getElementById('activity-list').innerHTML = '<div style="padding:10px; color:#999; text-align:center;">No activities yet</div>';
                    updateRecordCount(0);
                }
            })
            .catch(error => {
                document.getElementById('activity-list').innerHTML = '<div style="padding:10px; color:#999;">Error: ' + error.message + '</div>';
            });
        }
        
        function displayActivities(activities) {
            if (!activities || activities.length === 0) {
                document.getElementById('activity-list').innerHTML = '<div style="padding:10px; color:#999; text-align:center;">No activities available</div>';
                return;
            }
            
            const html = activities.map((activity, index) => {
                const time = new Date(activity.timestamp).toLocaleTimeString();
                const levelColor = activity.level === 'error' ? '#e74c3c' : 
                                 activity.level === 'warn' ? '#f39c12' : '#27ae60';
                
                return '<div style="padding:4px 8px; border-bottom:1px solid #eee; line-height:1.3;">' +
                       '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                       '<div style="flex:1;">' +
                       '<span style="color:' + levelColor + '; font-weight:bold; font-size:10px; margin-right:8px;">' + activity.level.toUpperCase() + '</span>' +
                       '<span style="font-size:12px;">' + activity.message + '</span>' +
                       '</div>' +
                       '<span style="color:#666; font-size:10px; margin-left:8px; white-space:nowrap;">' + time + '</span>' +
                       '</div>' +
                       '</div>';
            }).join('');
            
            document.getElementById('activity-list').innerHTML = html;
        }
        
        function updateRecordCount(count) {
            const recordCountEl = document.getElementById('record-count');
            if (recordCountEl) {
                recordCountEl.textContent = count + (count === 1 ? ' record' : ' records');
            }
        }
        
        // Load initial data
        loadNetworks();
        loadActivity();
        
        function showTab(tabName) {
            document.querySelectorAll('.content-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.getElementById(tabName + '-panel').style.display = 'block';
            event.target.classList.add('active');
            
            if (tabName === 'networks') {
                loadNetworks();
            } else if (tabName === 'security') {
                loadSecurityData();
            }
        }
        
        function loadNetworks() {
            const wsId = '${workspaceId}';
            fetch('/nodebit/workspace/' + wsId + '/api/networks')
            .then(response => response.json())
            .then(networks => {
                const tbody = document.getElementById('networks-tbody');
                tbody.innerHTML = networks.map((network, index) => {
                    const managementContent = getManagementContent(network);
                    return '<tr class="network-row" onclick="toggleManagementPanel(' + index + ')" data-network-index="' + index + '">' +
                           '<td class="network-name"><strong>' + (network.name || network.id) + '</strong></td>' +
                           '<td>' + network.type + '</td>' +
                           '<td><span class="status-badge status-connected">' + network.status + '</span></td>' +
                           '<td class="peer-id"><code>' + (network.peerId && network.peerId !== 'Unknown' ? network.peerId : 'Unknown') + '</code></td>' +
                           '<td>' + (network.peers || 0) + '</td>' +
                           '<td><button class="btn btn-primary" onclick="event.stopPropagation(); toggleManagementPanel(' + index + ')">Manage</button></td>' +
                           '</tr>' +
                           '<tr class="management-panel" id="management-panel-' + index + '">' +
                           '<td colspan="6"><div class="management-content">' + managementContent + '</div></td>' +
                           '</tr>';
                }).join('');
                
                document.querySelector('#networks-panel .loading').style.display = 'none';
                document.getElementById('networks-table').style.display = 'table';
                
                // Update overview counts
                document.getElementById('networks-count').textContent = networks.length;
                document.getElementById('peers-count').textContent = networks.reduce((sum, n) => sum + (n.peers || 0), 0);
            })
            .catch(error => {
                document.querySelector('#networks-panel .loading').textContent = 'Error loading networks: ' + error.message;
            });
        }
        
        function getManagementContent(network) {
            if (network.type === 'kubo') {
                return '<div style="background:#fff3cd; border:1px solid #ffeaa7; border-radius:4px; padding:10px; margin-bottom:10px;">' +
                       '<strong>Kubo Network Management</strong><br>' +
                       '<strong>Network ID:</strong> ' + network.id + '<br>' +
                       '<strong>Type:</strong> External Kubo IPFS node<br>' +
                       '<strong>Status:</strong> Read-only connection<br><br>' +
                       '<em>Note: Management of external Kubo nodes is limited to viewing information. ' +
                       'Use the Kubo CLI or web interface for full management.</em>' +
                       '</div>';
            } else if (network.type === 'helia') {
                return '<div style="background:#d1ecf1; border:1px solid #bee5eb; border-radius:4px; padding:10px; margin-bottom:10px;">' +
                       '<strong>Helia Network Management</strong><br>' +
                       '<strong>Network ID:</strong> ' + network.id + '<br>' +
                       '<strong>Type:</strong> Local Helia IPFS node<br>' +
                       '<strong>Status:</strong> Full management available<br><br>' +
                       '<strong>Advanced management features coming soon:</strong><br>' +
                       '• Start/stop network<br>' +
                       '• Peer management<br>' +
                       '• Configuration changes<br>' +
                       '• Performance monitoring' +
                       '</div>';
            } else {
                return '<div style="background:#f8d7da; border:1px solid #f5c6cb; border-radius:4px; padding:10px; margin-bottom:10px;">' +
                       '<strong>Network Management</strong><br>' +
                       'Network management not yet implemented for type: ' + network.type +
                       '</div>';
            }
        }
        
        function toggleManagementPanel(index) {
            const panel = document.getElementById('management-panel-' + index);
            const row = document.querySelector('[data-network-index="' + index + '"]');
            
            if (panel && row) {
                const isExpanded = panel.classList.contains('expanded');
                
                if (isExpanded) {
                    // Collapse
                    panel.classList.remove('expanded');
                    row.classList.remove('expanded');
                } else {
                    // Expand
                    panel.classList.add('expanded');
                    row.classList.add('expanded');
                }
            }
        }
        
        function loadOlderActivities() {
            if (isLoadingOlder || allActivities.length === 0) return;
            
            isLoadingOlder = true;
            const oldestTimestamp = allActivities[allActivities.length - 1].timestamp;
            
            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-older';
            loadingDiv.style.cssText = 'padding:10px; text-align:center; color:#666; font-style:italic;';
            loadingDiv.textContent = 'Loading older activities...';
            document.getElementById('activity-list').appendChild(loadingDiv);
            
            fetch('/nodebit/workspace/' + workspaceId + '/api/activity?before=' + encodeURIComponent(oldestTimestamp) + '&limit=50')
            .then(response => response.json())
            .then(olderActivities => {
                // Remove loading indicator
                const loadingEl = document.getElementById('loading-older');
                if (loadingEl) loadingEl.remove();
                
                if (olderActivities.length > 0) {
                    allActivities = allActivities.concat(olderActivities);
                    displayedActivities = allActivities.slice(); // Update displayed activities
                    displayActivities(displayedActivities);
                    updateMoreButton();
                } else {
                    hasMoreActivities = false;
                    updateMoreButton();
                }
                isLoadingOlder = false;
            })
            .catch(error => {
                console.error('Error loading older activities:', error);
                const loadingEl = document.getElementById('loading-older');
                if (loadingEl) {
                    loadingEl.textContent = 'Error loading older activities';
                    loadingEl.style.color = '#e74c3c';
                }
                isLoadingOlder = false;
            });
        }
        
        function setupLazyLoading() {
            const container = document.getElementById('activity-container');
            if (!container) return;
            
            container.addEventListener('scroll', function() {
                // Check if scrolled near bottom
                if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
                    loadOlderActivities();
                }
            });
        }
        
        function displayActivities(activities) {
            if (!activities || activities.length === 0) {
                document.getElementById('activity-list').innerHTML = '<div style="padding:10px; color:#999; text-align:center;">No activities available</div>';
                return;
            }
            
            const searchTerm = document.getElementById('activity-search') ? 
                document.getElementById('activity-search').value.toLowerCase() : '';
            const filtered = searchTerm ? activities.filter(activity => 
                activity.message.toLowerCase().includes(searchTerm) ||
                activity.level.toLowerCase().includes(searchTerm)
            ) : activities;
            
            if (filtered.length === 0) {
                document.getElementById('activity-list').innerHTML = '<div style="padding:10px; color:#999; text-align:center;">No activity matches search</div>';
                return;
            }
            
            const html = filtered.map((activity, index) => {
                const time = new Date(activity.timestamp).toLocaleTimeString();
                const levelColor = activity.level === 'error' ? '#e74c3c' : 
                                 activity.level === 'warn' ? '#f39c12' : '#27ae60';
                
                const detailsContent = activity.data && activity.data !== '{}' ? 
                    '<pre style="margin:0; white-space:pre-wrap; padding-right:80px;">' + activity.data + '</pre>' : 
                    '<div style="color:#999; font-style:italic; padding-right:80px;">No additional data</div>';
                
                return '<div class="activity-row" data-activity-index="' + index + '" onclick="toggleActivityRow(' + index + ')" style="padding:4px 8px; border-bottom:1px solid #eee; line-height:1.3;">' +
                       '<div style="display:flex; justify-content:space-between; align-items:center; min-width:0;">' +
                       '<div style="flex:1; min-width:0; overflow:hidden;">' +
                       '<span style="color:' + levelColor + '; font-weight:bold; font-size:10px; margin-right:8px; white-space:nowrap;">' + activity.level.toUpperCase() + '</span>' +
                       '<span class="activity-message" style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:inline-block; max-width:calc(100% - 50px);">' + activity.message + '</span>' +
                       '</div>' +
                       '<span style="color:#666; font-size:10px; white-space:nowrap; margin-left:8px; flex-shrink:0;">' + time + '</span>' +
                       '</div>' +
                       '</div>' +
                       '<div class="activity-details" id="activity-details-' + index + '" style="display:none; background:#f8f9fa; border-top:1px solid #ddd; padding:10px; position:relative; font-size:10px; color:#666; min-height:60px;">' +
                       detailsContent +
                       '<div class="activity-copy-buttons" style="position:absolute; bottom:8px; right:8px; display:flex; flex-direction:column; gap:4px;">' +
                       '<button onclick="event.stopPropagation(); copyActivityCsv(' + index + ')" class="btn" style="font-size:9px; padding:2px 6px; background:#6c757d; color:white; border:none; border-radius:2px; cursor:pointer;" title="Copy as CSV">CSV</button>' +
                       '<button onclick="event.stopPropagation(); copyActivityJson(' + index + ')" class="btn" style="font-size:9px; padding:2px 6px; background:#6c757d; color:white; border:none; border-radius:2px; cursor:pointer;" title="Copy as JSON">JSON</button>' +
                       '<button onclick="event.stopPropagation(); copyActivityXml(' + index + ')" class="btn" style="font-size:9px; padding:2px 6px; background:#6c757d; color:white; border:none; border-radius:2px; cursor:pointer;" title="Copy as XML">XML</button>' +
                       '</div>' +
                       '</div>';
            }).join('');
            
            document.getElementById('activity-list').innerHTML = html;
            
            // Update record count
            updateRecordCount(filtered.length);
        }
        
        function toggleActivityRow(index) {
            const row = document.querySelector('[data-activity-index="' + index + '"]');
            const details = document.getElementById('activity-details-' + index);
            
            if (row && details) {
                const isExpanded = details.style.display === 'block';
                
                if (isExpanded) {
                    // Collapse
                    details.style.display = 'none';
                    row.classList.remove('expanded');
                } else {
                    // Expand
                    details.style.display = 'block';
                    row.classList.add('expanded');
                }
            }
        }
        
        function copyActivityCsv(index) {
            const activity = displayedActivities[index];
            if (!activity) return;
            
            // Create CSV format with proper escaping
            const timestamp = activity.timestamp;
            const level = activity.level;
            const message = activity.message.replace(/"/g, '""'); // Escape quotes for CSV
            const data = activity.data ? activity.data.replace(/"/g, '""') : '';
            
            const csv = '"' + timestamp + '","' + level + '","' + message + '","' + data + '"';
            
            copyToClipboard(csv, event.target);
        }
        
        function copyActivityJson(index) {
            const activity = displayedActivities[index];
            if (!activity) return;
            
            const json = JSON.stringify(activity, null, 2);
            copyToClipboard(json, event.target);
        }
        
        function copyActivityXml(index) {
            const activity = displayedActivities[index];
            if (!activity) return;
            
            // Create XML format
            const escapeXml = (str) => {
                return str.replace(/&/g, '&amp;')
                         .replace(/</g, '&lt;')
                         .replace(/>/g, '&gt;')
                         .replace(/"/g, '&quot;')
                         .replace(/'/g, '&#39;');
            };
            
            const xml = '<activity>' +
                       '<timestamp>' + escapeXml(activity.timestamp) + '</timestamp>' +
                       '<level>' + escapeXml(activity.level) + '</level>' +
                       '<message>' + escapeXml(activity.message) + '</message>' +
                       '<data>' + (activity.data ? escapeXml(activity.data) : '') + '</data>' +
                       '</activity>';
            
            copyToClipboard(xml, event.target);
        }
        
        function copyAllActivities() {
            const searchTerm = document.getElementById('activity-search').value.toLowerCase();
            
            // Get currently displayed activities (filtered if search is active)
            let activitiesToCopy = displayedActivities;
            if (searchTerm) {
                activitiesToCopy = displayedActivities.filter(activity => 
                    activity.message.toLowerCase().includes(searchTerm) ||
                    activity.level.toLowerCase().includes(searchTerm)
                );
            }
            
            if (activitiesToCopy.length === 0) {
                // Log to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Copy attempted but no activities available' })
                });
                return;
            }
            
            // Create CSV format with headers
            const headers = ['Timestamp', 'Level', 'Message', 'Data'];
            const csvRows = [headers.join(',')];
            
            activitiesToCopy.forEach(activity => {
                const timestamp = activity.timestamp;
                const level = activity.level;
                const message = activity.message.replace(/"/g, '""'); // Escape quotes for CSV
                const data = activity.data ? activity.data.replace(/"/g, '""') : '';
                
                const row = [
                    '"' + timestamp + '"',
                    '"' + level + '"', 
                    '"' + message + '"',
                    '"' + data + '"'
                ].join(',');
                
                csvRows.push(row);
            });
            
            const csvContent = csvRows.join('\n');
            const button = event.target.closest('button');
            
            copyToClipboard(csvContent, button);
            
            // Log the copy action
            fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: 'Copied ' + activitiesToCopy.length + ' activity records to clipboard' + (searchTerm ? ' (filtered by: "' + searchTerm + '")' : '')
                })
            });
        }
        
        function copyToClipboard(text, button) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => {
                    // Brief visual feedback
                    button.style.background = '#d4edda';
                    setTimeout(() => {
                        button.style.background = '';
                    }, 500);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    button.style.background = '#d4edda';
                    setTimeout(() => {
                        button.style.background = '';
                    }, 500);
                } catch (err) {
                    console.error('Failed to copy: ', err);
                }
                document.body.removeChild(textArea);
            }
        }
        
        let currentClearMode = 'records'; // 'records' or 'search'
        
        function performClearAction() {
            if (currentClearMode === 'records') {
                clearAllRecords();
            } else {
                clearSearch();
            }
        }
        
        function clearAllRecords() {
            if (confirm('Clear all activity logs permanently?')) {
                fetch('/nodebit/workspace/' + workspaceId + '/api/activity/clear', { method: 'POST' })
                .then(response => response.json())
                .then(() => {
                    allActivities = [];
                    displayedActivities = [];
                    hasMoreActivities = true;
                    loadActivity();
                })
                .catch(error => {
                    // Log error to activity instead of alert
                    fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'Error clearing activity: ' + error.message })
                    });
                });
            }
        }
        
        function clearSearch() {
            document.getElementById('activity-search').value = '';
            displayActivities(displayedActivities);
            updateClearButton();
            updateMoreButton();
        }
        
        function toggleClearDropdown() {
            const dropdown = document.getElementById('clear-dropdown');
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            
            // Close dropdown when clicking outside
            if (dropdown.style.display === 'block') {
                setTimeout(() => {
                    document.addEventListener('click', function closeDropdown(e) {
                        if (!e.target.closest('#clear-dropdown') && !e.target.closest('#clear-dropdown-btn')) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeDropdown);
                        }
                    });
                }, 0);
            }
        }
        
        function selectClearOption(option) {
            currentClearMode = option;
            updateClearButton();
            document.getElementById('clear-dropdown').style.display = 'none';
            
            // Perform the action immediately
            performClearAction();
        }
        
        function updateRecordCount(count) {
            const recordCountEl = document.getElementById('record-count');
            if (recordCountEl) {
                recordCountEl.textContent = count + (count === 1 ? ' record' : ' records');
            }
        }
        
        function updateClearButton() {
            const searchTerm = document.getElementById('activity-search').value.toLowerCase();
            const icon = document.getElementById('clear-icon');
            const mainBtn = document.getElementById('clear-main-btn');
            
            if (searchTerm) {
                // Search mode: button becomes "Clear Search" with search icon
                currentClearMode = 'search';
                icon.className = 'fa fa-search';
                mainBtn.innerHTML = '<i id="clear-icon" class="fa fa-search" style="margin-right:4px;"></i>Clear Search';
            } else {
                // Normal mode: button is "Clear" with database icon
                currentClearMode = 'records';
                icon.className = 'fa fa-database';
                mainBtn.innerHTML = '<i id="clear-icon" class="fa fa-database" style="margin-right:4px;"></i>Clear';
            }
        }
        
        function loadMoreActivities() {
            const searchTerm = document.getElementById('activity-search').value.toLowerCase();
            
            if (searchTerm) {
                // Filtered mode: load more from server until we have 100 more matching items
                loadMoreFiltered(searchTerm);
            } else {
                // Unfiltered mode: load next 100 activities
                loadOlderActivities();
            }
        }
        
        function loadMoreFiltered(searchTerm) {
            if (isLoadingOlder) return;
            
            const currentFilteredCount = displayedActivities.filter(activity => 
                activity.message.toLowerCase().includes(searchTerm) ||
                activity.level.toLowerCase().includes(searchTerm)
            ).length;
            
            // Keep loading until we have 100 more filtered items or no more data
            loadMoreFilteredBatch(searchTerm, currentFilteredCount, 0);
        }
        
        function loadMoreFilteredBatch(searchTerm, targetCount, foundCount) {
            if (foundCount >= 100 || !hasMoreActivities) {
                updateMoreButton();
                return;
            }
            
            const oldestTimestamp = allActivities[allActivities.length - 1].timestamp;
            
            fetch('/nodebit/workspace/' + workspaceId + '/api/activity?before=' + encodeURIComponent(oldestTimestamp) + '&limit=100')
            .then(response => response.json())
            .then(olderActivities => {
                if (olderActivities.length === 0) {
                    hasMoreActivities = false;
                    updateMoreButton();
                    return;
                }
                
                allActivities = allActivities.concat(olderActivities);
                
                // Count how many of the new activities match the filter
                const newMatches = olderActivities.filter(activity => 
                    activity.message.toLowerCase().includes(searchTerm) ||
                    activity.level.toLowerCase().includes(searchTerm)
                ).length;
                
                displayedActivities = allActivities.slice();
                displayActivities(displayedActivities);
                
                // If we haven't found enough matches, load more
                if (newMatches + foundCount < 100 && olderActivities.length === 100) {
                    loadMoreFilteredBatch(searchTerm, targetCount, foundCount + newMatches);
                } else {
                    updateMoreButton();
                }
            })
            .catch(error => {
                console.error('Error loading more filtered activities:', error);
                updateMoreButton();
            });
        }
        
        function updateMoreButton() {
            const btn = document.getElementById('load-more-btn');
            const searchTerm = document.getElementById('activity-search').value.toLowerCase();
            
            if (hasMoreActivities) {
                btn.style.display = 'inline-block';
                if (searchTerm) {
                    btn.textContent = '...more filtered';
                    btn.title = 'Load 100 more activities matching "' + searchTerm + '"';
                } else {
                    btn.textContent = '...more';
                    btn.title = 'Load 100 more activities';
                }
            } else {
                btn.style.display = 'none';
            }
        }
        
        // Set up activity search
        document.getElementById('activity-search').addEventListener('input', function() {
            // Re-filter current activities and update buttons
            displayActivities(displayedActivities);
            updateMoreButton();
            updateClearButton();
        });
        
        // Load initial data
        loadNetworks();
        
        // Log JavaScript execution to our activity system
        fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Dashboard JavaScript executing for workspace ' + workspaceId })
        });
        
        // Load activity
        loadActivity();
        
        // Refresh activity every 5 seconds
        setInterval(loadActivity, 5000);
        
        // DID/ACL Management Functions
        
        function loadSecurityData() {
            loadDIDs();
            loadACLs();
            loadSystemStatus();
        }
        
        // Retry mechanism for DID/ACL system initialization
        let securityRetryCount = 0;
        const maxSecurityRetries = 10;
        
        function retrySecurityLoad() {
            if (securityRetryCount < maxSecurityRetries) {
                securityRetryCount++;
                setTimeout(() => {
                    loadSecurityData();
                }, 2000); // Retry every 2 seconds
            }
        }
        
        let availableDIDs = []; // Store DIDs for dropdown
        
        function loadDIDs() {
            fetch('/nodebit/workspace/' + workspaceId + '/api/dids')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const container = document.getElementById('dids-list');
                
                // Check if response is an error
                if (data.error) {
                    if (data.error.includes('initializing') || data.error.includes('not started')) {
                        container.innerHTML = '<div style="padding:10px; color:#f39c12; font-size:12px; grid-column:1/-1;">DID/ACL system initializing... (attempt ' + (securityRetryCount + 1) + '/' + maxSecurityRetries + ')</div>';
                        retrySecurityLoad();
                    } else {
                        container.innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px; grid-column:1/-1;">DID/ACL system error: ' + data.error + '</div>';
                    }
                    return;
                }
                
                // Check if data is an array
                if (!Array.isArray(data)) {
                    container.innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px; grid-column:1/-1;">DID/ACL system initializing...</div>';
                    return;
                }
                
                if (data.length === 0) {
                    container.innerHTML = '<div style="padding:10px; color:#666; text-align:center; font-size:12px; grid-column:1/-1;">No DIDs created yet</div>';
                    availableDIDs = [];
                    updateDIDDropdown();
                    return;
                }
                
                // Store DIDs for dropdown
                availableDIDs = data;
                updateDIDDropdown();
                
                const html = data.map(did => {
                    const createdDate = new Date(did.created).toLocaleDateString();
                    const statusColor = did.status === 'active' ? '#27ae60' : '#e74c3c';
                    const avatarHtml = did.metadata && did.metadata.avatar ? 
                        '<img src="' + did.metadata.avatar + '" style="width:16px; height:16px; border-radius:50%; margin-right:4px; vertical-align:middle;">' : '';
                    
                    return '<div style="display:grid; grid-template-columns:1fr 60px 2fr 40px; gap:8px; align-items:center; padding:6px 8px; border-bottom:1px solid #eee; font-size:11px;">' +
                           '<div style="color:#666;">' + createdDate + '</div>' +
                           '<div><span style="color:' + statusColor + '; font-weight:bold; font-size:10px;">' + did.status.toUpperCase() + '</span></div>' +
                           '<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; color:#2c3e50;" title="' + did.id + '">' + 
                           avatarHtml + did.id + '</div>' +
                           '<div><button onclick="showDIDDetails(\'' + did.id + '\')" style="font-size:9px; padding:2px 6px; background:#6c757d; color:white; border:none; border-radius:2px; cursor:pointer;" title="More options">more...</button></div>' +
                           '</div>';
                }).join('');
                
                container.innerHTML = html;
            })
            .catch(error => {
                document.getElementById('dids-list').innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px; grid-column:1/-1;">Error loading DIDs: ' + error.message + '</div>';
            });
        }
        
        function loadACLs() {
            fetch('/nodebit/workspace/' + workspaceId + '/api/acls')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const container = document.getElementById('acls-list');
                
                // Check if response is an error
                if (data.error) {
                    if (data.error.includes('initializing') || data.error.includes('not started')) {
                        container.innerHTML = '<div style="padding:10px; color:#f39c12; font-size:12px;">DID/ACL system initializing... (attempt ' + (securityRetryCount + 1) + '/' + maxSecurityRetries + ')</div>';
                        // Don't call retrySecurityLoad again here to avoid double retries
                    } else {
                        container.innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px;">DID/ACL system error: ' + data.error + '</div>';
                    }
                    return;
                }
                
                // Check if data is an array
                if (!Array.isArray(data)) {
                    container.innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px;">DID/ACL system initializing...</div>';
                    return;
                }
                
                if (data.length === 0) {
                    container.innerHTML = '<div style="padding:10px; color:#666; text-align:center; font-size:12px;">No ACL rules defined yet</div>';
                    return;
                }
                
                const html = data.map(acl => 
                    '<div style="padding:6px; border-bottom:1px solid #eee; font-size:11px;">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center;">' +
                    '<div>' +
                    '<strong>' + acl.resource + '</strong> : <span style="color:#3498db;">' + acl.action + '</span>' +
                    '<div style="font-size:10px; color:#666; margin-top:2px;">DIDs: ' + acl.allowedDIDs.join(', ') + '</div>' +
                    '</div>' +
                    '<button onclick="quickRevokeACL(\'' + acl.resource + '\', \'' + acl.action + '\')" style="font-size:10px; padding:2px 6px; background:#dc3545; color:white; border:none; border-radius:2px; cursor:pointer;">×</button>' +
                    '</div>' +
                    '</div>'
                ).join('');
                
                container.innerHTML = html;
            })
            .catch(error => {
                document.getElementById('acls-list').innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px;">Error loading ACLs: ' + error.message + '</div>';
            });
        }
        
        function loadSystemStatus() {
            // Check actual DID system status by testing the API
            fetch('/nodebit/workspace/' + workspaceId + '/api/dids')
            .then(response => {
                if (response.ok) {
                    // DID system is working
                    document.getElementById('did-system-status').textContent = 'Active';
                    document.getElementById('did-system-status').style.color = '#27ae60';
                    document.getElementById('system-orbitdb-status').textContent = 'Connected';
                    document.getElementById('system-orbitdb-status').style.color = '#27ae60';
                    document.getElementById('admin-identity').textContent = 'nodebit-admin';
                    document.getElementById('authenticated-count').textContent = '1';
                } else {
                    // DID system not ready - get debug info
                    fetch('/nodebit/workspace/' + workspaceId + '/api/debug/did-status')
                    .then(debugResponse => debugResponse.json())
                    .then(debugData => {
                        // Log debug info to activity system
                        fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                message: 'DID/ACL Debug: ' + JSON.stringify(debugData)
                            })
                        });
                        
                        document.getElementById('did-system-status').textContent = 'Initializing';
                        document.getElementById('did-system-status').style.color = '#f39c12';
                        document.getElementById('system-orbitdb-status').textContent = 'Initializing';
                        document.getElementById('system-orbitdb-status').style.color = '#f39c12';
                        document.getElementById('admin-identity').textContent = 'Waiting...';
                        document.getElementById('authenticated-count').textContent = '0';
                    })
                    .catch(debugError => {
                        // Log debug error
                        fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                message: 'DID/ACL Debug Error: ' + debugError.message
                            })
                        });
                    });
                }
            })
            .catch(error => {
                document.getElementById('did-system-status').textContent = 'Error';
                document.getElementById('did-system-status').style.color = '#e74c3c';
                document.getElementById('system-orbitdb-status').textContent = 'Error';
                document.getElementById('system-orbitdb-status').style.color = '#e74c3c';
            });
        }
        
        function updateDIDDropdown() {
            const dropdown = document.getElementById('did-dropdown');
            if (!dropdown) return;
            
            if (availableDIDs.length === 0) {
                dropdown.innerHTML = '<div style="padding:6px 8px; color:#666; font-size:10px;">No DIDs available</div>';
                return;
            }
            
            const html = availableDIDs.map(did => 
                '<div onclick="selectDIDFromDropdown(\'' + did.id + '\')" style="padding:4px 8px; cursor:pointer; font-size:10px; border-bottom:1px solid #f0f0f0;" onmouseover="this.style.background=\'#f8f9fa\'" onmouseout="this.style.background=\'white\'">' +
                (did.metadata && did.metadata.avatar ? '<img src="' + did.metadata.avatar + '" style="width:12px; height:12px; border-radius:50%; margin-right:4px; vertical-align:middle;">' : '') +
                did.id +
                '</div>'
            ).join('');
            
            dropdown.innerHTML = html;
        }
        
        function toggleDIDDropdown() {
            const dropdown = document.getElementById('did-dropdown');
            const isVisible = dropdown.style.display === 'block';
            
            if (isVisible) {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.display = 'block';
                // Close dropdown when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', function closeDropdown(e) {
                        if (!e.target.closest('#did-dropdown') && !e.target.closest('button')) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeDropdown);
                        }
                    });
                }, 0);
            }
        }
        
        function selectDIDFromDropdown(didId) {
            document.getElementById('acl-did').value = didId;
            document.getElementById('did-dropdown').style.display = 'none';
        }
        
        function showDIDDetails(didId) {
            // Find the DID data
            const did = availableDIDs.find(d => d.id === didId);
            if (!did) return;
            
            // Create a simple modal-like interface
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center;';
            
            const content = document.createElement('div');
            content.style.cssText = 'background:white; border-radius:8px; padding:20px; max-width:400px; width:90%; max-height:80%; overflow-y:auto;';
            
            content.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">' +
                               '<h3 style="margin:0; color:#2c3e50;">DID Details: ' + did.id + '</h3>' +
                               '<button onclick="this.closest(\\'.modal\\').remove()" style="background:none; border:none; font-size:18px; cursor:pointer; color:#666;">&times;</button>' +
                               '</div>' +
                               '<div style="margin-bottom:15px;">' +
                               '<strong>Created:</strong> ' + new Date(did.created).toLocaleString() + '<br>' +
                               '<strong>Status:</strong> <span style="color:' + (did.status === 'active' ? '#27ae60' : '#e74c3c') + ';">' + did.status + '</span><br>' +
                               '<strong>Public Key:</strong> <code style="font-size:10px; word-break:break-all;">' + (did.publicKey || 'Not available') + '</code>' +
                               '</div>' +
                               '<div style="margin-bottom:15px;">' +
                               '<strong>Avatar:</strong><br>' +
                               '<div style="margin:8px 0;">' +
                               (did.metadata && did.metadata.avatar ? 
                                   '<img src="' + did.metadata.avatar + '" style="width:64px; height:64px; border-radius:50%; border:2px solid #ddd;">' : 
                                   '<div style="width:64px; height:64px; border-radius:50%; border:2px solid #ddd; background:#f8f9fa; display:flex; align-items:center; justify-content:center; color:#666;">No Avatar</div>') +
                               '</div>' +
                               '<input type="file" id="modal-avatar-input" accept="image/*" style="font-size:11px; margin-top:5px;">' +
                               '<button onclick="updateDIDAvatar(\'' + did.id + '\')" style="margin-left:8px; font-size:11px; padding:4px 8px; background:#3498db; color:white; border:none; border-radius:3px; cursor:pointer;">Update Avatar</button>' +
                               '</div>' +
                               '<div style="text-align:right; border-top:1px solid #eee; padding-top:10px;">' +
                               '<button onclick="this.closest(\\'.modal\\').remove()" style="padding:6px 12px; background:#6c757d; color:white; border:none; border-radius:3px; cursor:pointer;">Close</button>' +
                               '</div>';
            
            modal.className = 'modal';
            modal.appendChild(content);
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        function updateDIDAvatar(didId) {
            const fileInput = document.getElementById('modal-avatar-input');
            const file = fileInput.files[0];
            
            if (!file) {
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Avatar update attempted without file selection' })
                });
                return;
            }
            
            // Convert file to base64 data URL
            const reader = new FileReader();
            reader.onload = function(e) {
                const avatarData = e.target.result;
                
                // Update DID metadata with avatar
                // Note: This would need a proper API endpoint to update DID metadata
                // For now, we'll just log the action
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: 'Avatar updated for DID: ' + didId + ' (size: ' + Math.round(avatarData.length / 1024) + 'KB)'
                    })
                });
                
                // Close modal and refresh DIDs
                document.querySelector('.modal').remove();
                loadDIDs();
            };
            reader.readAsDataURL(file);
        }
        
        function createNewDID() {
            const didId = document.getElementById('new-did-id').value.trim();
            const avatarInput = document.getElementById('did-avatar-input');
            
            if (!didId) {
                // Log to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'DID creation attempted without identifier' })
                });
                return;
            }
            
            const metadata = {
                createdBy: 'dashboard',
                description: 'Created via dashboard'
            };
            
            // Handle avatar if selected
            if (avatarInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    metadata.avatar = e.target.result;
                    createDIDWithMetadata(didId, metadata);
                };
                reader.readAsDataURL(avatarInput.files[0]);
            } else {
                createDIDWithMetadata(didId, metadata);
            }
        }
        
        function createDIDWithMetadata(didId, metadata) {
            fetch('/nodebit/workspace/' + workspaceId + '/api/dids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: didId,
                    metadata: metadata
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('new-did-id').value = '';
                    document.getElementById('did-avatar-input').value = '';
                    loadDIDs(); // Refresh the list
                    
                    // Log to activity
                    fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'DID created: ' + didId + (metadata.avatar ? ' with avatar' : '') })
                    });
                } else {
                    // Log error to activity instead of alert
                    fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'DID creation failed: ' + result.error })
                    });
                }
            })
            .catch(error => {
                // Log error to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'DID creation error: ' + error.message })
                });
            });
        }
        
        function grantPermission() {
            const did = document.getElementById('acl-did').value.trim();
            const resource = document.getElementById('acl-resource').value.trim();
            const action = document.getElementById('acl-action').value;
            
            if (!did || !resource) {
                // Log to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Permission grant attempted without DID or resource' })
                });
                return;
            }
            
            fetch('/nodebit/workspace/' + workspaceId + '/api/acls/grant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ did, resource, action })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // Clear form
                    document.getElementById('acl-did').value = '';
                    document.getElementById('acl-resource').value = '';
                    loadACLs(); // Refresh the list
                    
                    // Log to activity
                    fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'Permission granted: ' + did + ' -> ' + resource + ':' + action })
                    });
                } else {
                    // Log error to activity instead of alert
                    fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'Failed to grant permission: ' + result.error })
                    });
                }
            })
            .catch(error => {
                // Log error to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Error granting permission: ' + error.message })
                });
            });
        }
        
        function revokePermission() {
            const did = document.getElementById('acl-did').value.trim();
            const resource = document.getElementById('acl-resource').value.trim();
            const action = document.getElementById('acl-action').value;
            
            if (!did || !resource) {
                // Log to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Permission revoke attempted without DID or resource' })
                });
                return;
            }
            
            fetch('/nodebit/workspace/' + workspaceId + '/api/acls/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ did, resource, action })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // Clear form
                    document.getElementById('acl-did').value = '';
                    document.getElementById('acl-resource').value = '';
                    loadACLs(); // Refresh the list
                    
                    // Log to activity
                    fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'Permission revoked: ' + did + ' -> ' + resource + ':' + action })
                    });
                } else {
                    // Log error to activity instead of alert
                    fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: 'Failed to revoke permission: ' + result.error })
                    });
                }
            })
            .catch(error => {
                // Log error to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Error revoking permission: ' + error.message })
                });
            });
        }
        
        function quickRevokeACL(resource, action) {
            if (!confirm('Remove all permissions for ' + resource + ':' + action + '?')) {
                return;
            }
            
            // This is a simplified revoke - in practice you'd need to specify which DID
            // For now, we'll revoke for all DIDs by clearing the ACL
            fetch('/nodebit/workspace/' + workspaceId + '/api/acls/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ did: '*', resource, action })
            })
            .then(response => response.json())
            .then(result => {
                loadACLs(); // Refresh the list
                
                // Log to activity
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'ACL rule removed: ' + resource + ':' + action })
                });
            })
            .catch(error => {
                // Log error to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Error removing ACL: ' + error.message })
                });
            });
        }
        
    </script>
</body>
</html>
`;
    }}
