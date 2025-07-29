
/**
 * Client-side JavaScript for Security Management
 * Implements the new CSS Grid-based ACL interface
 */

function generateClientScripts(workspaceId) {
    return `
        // Global workspace configuration
        const workspaceId = '${workspaceId}';
        
        // Global variables for security management
        let availableDIDs = [];
        let securityRetryCount = 0;
        const maxSecurityRetries = 10;
        let selectedUser = null;
        let selectedResource = null;
        let availableResources = ['workspace', 'files', 'databases', 'networks', 'admin', 'api'];
        
        // Global variables for activity management
        let activityOffset = 0;
        let activityLimit = 50;
        let allActivities = [];
        let filteredActivities = [];
        let clearAction = 'records';
        let displayedActivities = []; // Store currently displayed activities for copy functions
        
        // Tab management function
        function showTab(tabName) {
            // Hide all content panels
            document.querySelectorAll('.content-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected panel
            const panel = document.getElementById(tabName + '-panel');
            if (panel) {
                panel.style.display = 'flex';
            }
            
            // Add active class to selected tab
            const tabs = document.querySelectorAll('.nav-tab');
            tabs.forEach((tab, index) => {
                if ((tabName === 'overview' && index === 0) ||
                    (tabName === 'networks' && index === 1) ||
                    (tabName === 'databases' && index === 2) ||
                    (tabName === 'files' && index === 3) ||
                    (tabName === 'security' && index === 4)) {
                    tab.classList.add('active');
                }
            });
            
            // Load tab-specific data
            if (tabName === 'overview') {
                loadActivity();
                loadStats();
            } else if (tabName === 'security') {
                loadSecurityData();
            } else if (tabName === 'networks') {
                loadNetworks();
            } else if (tabName === 'databases') {
                loadDatabases();
            } else if (tabName === 'files') {
                loadFiles();
            }
        }
        
        // Activity management functions
        function loadActivity() {
            fetch('/nodebit/workspace/' + workspaceId + '/api/activity?offset=' + activityOffset + '&limit=' + activityLimit)
            .then(response => response.json())
            .then(data => {
                // Handle both array format and object format
                if (Array.isArray(data)) {
                    allActivities = data;
                    displayActivities(data);
                } else if (data.activities) {
                    allActivities = data.activities;
                    displayActivities(data.activities);
                } else {
                    document.getElementById('activity-list').innerHTML = '<div style="padding:10px; color:#e74c3c; text-align:center;">No activity data available</div>';
                }
            })
            .catch(error => {
                document.getElementById('activity-list').innerHTML = '<div style="padding:10px; color:#e74c3c; text-align:center;">Error: ' + error.message + '</div>';
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
                (activity.level || activity.type || '').toLowerCase().includes(searchTerm)
            ) : activities;
            
            if (filtered.length === 0) {
                document.getElementById('activity-list').innerHTML = '<div style="padding:10px; color:#999; text-align:center;">No activity matches search</div>';
                return;
            }
            
            const html = filtered.map((activity, index) => {
                const time = new Date(activity.timestamp).toLocaleTimeString();
                const level = activity.level || activity.type || 'info';
                const levelColor = level === 'error' ? '#e74c3c' : 
                                 level === 'warn' ? '#f39c12' : '#27ae60';
                
                const detailsContent = activity.data && activity.data !== '{}' ? 
                    '<pre style="margin:0; white-space:pre-wrap; padding-right:80px;">' + activity.data + '</pre>' : 
                    '<div style="color:#999; font-style:italic; padding-right:80px;">No additional data</div>';
                
                return '<div class="activity-row" data-activity-index="' + index + '" onclick="toggleActivityRow(' + index + ')" style="padding:4px 8px; border-bottom:1px solid #eee; line-height:1.3;">' +
                       '<div style="display:flex; justify-content:space-between; align-items:center; min-width:0;">' +
                       '<div style="flex:1; min-width:0; overflow:hidden;">' +
                       '<span style="color:' + levelColor + '; font-weight:bold; font-size:10px; margin-right:8px; white-space:nowrap;">' + level.toUpperCase() + '</span>' +
                       '<span class="activity-message" style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:inline-block; max-width:calc(100% - 50px);">' + activity.message + '</span>' +
                       '</div>' +
                       '<span style="color:#666; font-size:10px; white-space:nowrap; margin-left:8px; flex-shrink:0;">' + time + '</span>' +
                       '</div>' +
                       '</div>' +
                       '<div class="activity-details" id="activity-details-' + index + '" style="display:none; background:#f8f9fa; border-top:1px solid #ddd; padding:10px; position:relative; font-size:10px; color:#666; min-height:60px;">' +
                       detailsContent +
                       '</div>';
            }).join('');
            
            document.getElementById('activity-list').innerHTML = html;
            
            // Store displayed activities for copy functions
            displayedActivities = filtered;
            
            // Update record count
            updateRecordCount(filtered.length);
        }
        
        function toggleActivityRow(index) {
            const row = document.querySelector('[data-activity-index="' + index + '"]');
            const details = document.getElementById('activity-details-' + index);
            
            if (row && details) {
                const isExpanded = details.style.display === 'block';
                
                if (isExpanded) {
                    details.style.display = 'none';
                    row.classList.remove('expanded');
                } else {
                    details.style.display = 'block';
                    row.classList.add('expanded');
                }
            }
        }
        
        function updateRecordCount(count) {
            const countElement = document.getElementById('record-count');
            if (countElement) {
                countElement.textContent = (count || 0) + ' records';
            }
        }
        
        function loadStats() {
            fetch('/nodebit/workspace/' + workspaceId + '/api/stats')
            .then(response => response.json())
            .then(data => {
                document.getElementById('networks-count').textContent = data.networks || '0';
                document.getElementById('databases-count').textContent = data.databases || '0';
                document.getElementById('files-count').textContent = data.files || '0';
                document.getElementById('peers-count').textContent = data.peers || '0';
            })
            .catch(error => {
                console.error('Failed to load stats:', error);
                // Set default values on error
                document.getElementById('networks-count').textContent = '0';
                document.getElementById('databases-count').textContent = '0';
                document.getElementById('files-count').textContent = '0';
                document.getElementById('peers-count').textContent = '0';
            });
        }
        
        function loadNetworks() {
            fetch('/nodebit/workspace/' + workspaceId + '/api/networks')
            .then(response => response.json())
            .then(networks => {
                // Store network data globally for copy functions
                window.networkData = networks;
                
                const loadingElement = document.querySelector('#networks-panel .loading');
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                
                // Update networks display (implement proper networks table)
                const networksContainer = document.getElementById('networks-table');
                if (networksContainer) {
                    networksContainer.style.display = 'table';
                    const tbody = document.getElementById('networks-tbody');
                    if (tbody) {
                                            tbody.innerHTML = networks.map((network, index) => 
                        '<tr class="network-row" data-network-index="' + index + '" onclick="toggleNetworkPanel(' + index + ')">' +
                        '<td>' + (network.name || network.id) + '</td>' +
                        '<td>' + network.type + '</td>' +
                        '<td><span class="status-badge status-connected">' + network.status + '</span></td>' +
                        '<td><code>' + (network.peerId || 'Unknown') + '</code></td>' +
                        '<td>' + (network.peers || 0) + '</td>' +
                        '<td><button class="btn btn-primary" onclick="event.stopPropagation();">Manage</button></td>' +
                        '</tr>' +
                        '<tr class="management-panel" id="network-panel-' + index + '">' +
                        '<td colspan="6">' +
                        '<div class="management-content">' +
                        generateNetworkDetailsPanel(network, index) +
                        '</div>' +
                        '</td>' +
                        '</tr>'
                    ).join('');
                    }
                }
                
                // Update overview stats
                const networksCountEl = document.getElementById('networks-count');
                if (networksCountEl) {
                    networksCountEl.textContent = networks.length;
                }
                
                const peersCountEl = document.getElementById('peers-count');
                if (peersCountEl) {
                    peersCountEl.textContent = networks.reduce((sum, n) => sum + (n.peers || 0), 0);
                }
            })
            .catch(error => {
                const loadingElement = document.querySelector('#networks-panel .loading');
                if (loadingElement) {
                    loadingElement.textContent = 'Error loading networks: ' + error.message;
                }
            });
        }
        
        function loadDatabases() {
            // Log database loading attempt
            fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Loading databases...' })
            });
        }
        
        function loadFiles() {
            // Log file loading attempt
            fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Loading files...' })
            });
        }
        
        function loadSecurityData() {
            loadDIDs();
            loadSystemStatus();
            startWidthMonitoring();
        }
        
        function startWidthMonitoring() {
            // Monitor DID grid width and display it
            const updateWidth = () => {
                const didGrid = document.querySelector('#security-panel > div > div:first-child');
                const widthSpan = document.getElementById('did-grid-width');
                if (didGrid && widthSpan) {
                    const width = didGrid.offsetWidth;
                    widthSpan.textContent = 'w:' + width + 'px';
                }
            };
            
            // Update immediately and then on window resize
            updateWidth();
            window.addEventListener('resize', updateWidth);
            
            // Also update periodically to catch any dynamic changes
            setInterval(updateWidth, 1000);
        }
        
        function loadSystemStatus() {
            fetch('/nodebit/workspace/' + workspaceId + '/api/debug/did-status')
            .then(response => response.json())
            .then(status => {
                // Update system status display
                const didSystemStatus = document.getElementById('did-system-status');
                const adminIdentity = document.getElementById('admin-identity');
                const systemOrbitDB = document.getElementById('system-orbitdb-status');
                const authenticatedCount = document.getElementById('authenticated-count');
                
                if (didSystemStatus) {
                    if (status.hasDIDRegistry && status.hasACLRegistry) {
                        didSystemStatus.textContent = 'Active';
                        didSystemStatus.style.color = '#27ae60';
                    } else {
                        didSystemStatus.textContent = 'Initializing...';
                        didSystemStatus.style.color = '#f39c12';
                    }
                }
                
                if (adminIdentity) {
                    adminIdentity.textContent = status.hasCurrentIdentity ? 'nodebit-admin' : 'Loading...';
                }
                
                if (systemOrbitDB) {
                    if (status.hasSystemOrbitDB) {
                        systemOrbitDB.textContent = 'Connected';
                        systemOrbitDB.style.color = '#27ae60';
                    } else {
                        systemOrbitDB.textContent = 'Loading...';
                        systemOrbitDB.style.color = '#f39c12';
                    }
                }
                
                if (authenticatedCount) {
                    authenticatedCount.textContent = status.authenticatedDIDsCount || '0';
                }
            })
            .catch(error => {
                // Log error for debugging
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'System status check failed: ' + error.message })
                });
            });
        }
        
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
                
                if (data.error) {
                    container.innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px; grid-column:1/-1;">DID/ACL system error: ' + data.error + '</div>';
                    return;
                }
                
                if (!Array.isArray(data)) {
                    container.innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px; grid-column:1/-1;">DID/ACL system initializing...</div>';
                    return;
                }
                
                if (data.length === 0) {
                    container.innerHTML = '<div style="padding:10px; color:#666; text-align:center; font-size:12px; grid-column:1/-1;">No DIDs created yet</div>';
                    return;
                }
                
                availableDIDs = data;
                
                const html = data.map((did, index) => {
                    const createdDate = new Date(did.created).toLocaleDateString();
                    const statusColor = did.status === 'active' ? '#27ae60' : '#e74c3c';
                    const username = (did.metadata && did.metadata.username) ? 
                        did.metadata.username : 
                        (did.id || '').replace(/^did:/, '').replace(/^nodebit:/, '').replace(/^user-/, '');
                    
                    return '<div class="did-row" data-did-index="' + index + '">' +
                           '<div style="display:grid; grid-template-columns:70px 70px 1fr 50px; gap:6px; align-items:center; padding:6px 8px; border-bottom:1px solid #eee; font-size:11px; cursor:pointer; overflow:hidden;" onclick="toggleDIDPanel(' + index + ')">' +
                           '<div style="color:#2c3e50; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + username + '">' + username + '</div>' +
                           '<div style="color:#666; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + createdDate + '">' + createdDate + '</div>' +
                           '<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; color:#2c3e50;" title="' + did.id + '">' +
                           '<span style="margin-left:4px;">' + did.id + '</span></div>' +
                           '<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><span style="color:' + statusColor + '; font-weight:bold; font-size:10px;">' + (did.status || 'unknown').toUpperCase() + '</span></div>' +
                           '</div>' +
                           '<div class="did-details-panel" id="did-panel-' + index + '" style="display:none; background:#f8f9fa; border-top:1px solid #ddd; padding:4px; font-size:12px;">' +
                           generateDIDDetailsPanel(did, index) +
                           '</div>' +
                           '</div>';
                }).join('');
                
                container.innerHTML = html;
            })
            .catch(error => {
                document.getElementById('dids-list').innerHTML = '<div style="padding:10px; color:#e74c3c; font-size:12px; grid-column:1/-1;">Error loading DIDs: ' + error.message + '</div>';
            });
        }
        
        function toggleDIDPanel(index) {
            const panel = document.getElementById('did-panel-' + index);
            if (panel) {
                const isExpanded = panel.style.display === 'block';
                
                // Close all panels first
                document.querySelectorAll('.did-details-panel').forEach(p => p.style.display = 'none');
                
                if (!isExpanded) {
                    panel.style.display = 'block';
                }
            }
        }
        
        function deleteDID(didId, index) {
            // Validate DID ID before attempting deletion
            if (!didId || didId === 'undefined' || didId === 'null' || didId.trim() === '') {
                alert('Cannot delete DID: Invalid identifier detected. This DID record may be corrupted.');
                return;
            }
            
            const did = availableDIDs[index];
            const username = (did.metadata && did.metadata.username) ? did.metadata.username : 'Unknown';
            
            if (!confirm('Are you sure you want to permanently delete the DID for user "' + username + '"?\\n\\nThis action cannot be undone and will remove all associated permissions and data.')) {
                return;
            }
            
            // Actually delete the DID via API
            fetch('/nodebit/workspace/' + workspaceId + '/api/dids/' + encodeURIComponent(didId), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // Reload DIDs to reflect the deletion
                    loadDIDs();
                } else {
                    alert('Failed to delete DID: ' + (result.error || 'Unknown error'));
                }
            })
            .catch(error => {
                alert('Error deleting DID: ' + error.message);
            });
        }
        
        function generateDIDDetailsPanel(did, index) {
            const metadata = did.metadata || {};
            return '<div style="background:white; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.1); overflow:hidden;">' +
                   '<div style="background:#34495e; color:white; padding:12px; display:flex; justify-content:space-between; align-items:center;">' +
                   '<h4 style="margin:0; font-size:14px;">DID Account Management</h4>' +
                   '<button onclick="toggleDIDPanel(' + index + ')" style="background:rgba(255,255,255,0.2); border:none; color:white; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:11px;">X Close</button>' +
                   '</div>' +
                   '<div style="padding:11px;">' +
                   '<div style="display:grid; grid-template-columns:2fr 2fr 1fr; gap:20px; margin-bottom:3px;">' +
                   
                   '<div>' +
                   '<h5 style="margin:0 0 12px 0; color:#2c3e50; border-bottom:2px solid #3498db; padding-bottom:4px;">Identity Information</h5>' +
                   '<div style="display:grid; grid-template-columns:80px 1fr; gap:8px; align-items:center; margin-bottom:8px;"><label style="font-size:11px; color:#666;">Username:</label>' +
                   '<input type="text" id="edit-username-' + index + '" value="' + (metadata.username || '') + '" style="padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;"></div>' +
                   '<div style="display:grid; grid-template-columns:80px 1fr; gap:8px; align-items:center; margin-bottom:8px;"><label style="font-size:11px; color:#666;">Display Name:</label>' +
                   '<input type="text" id="edit-displayname-' + index + '" value="' + (metadata.displayName || '') + '" placeholder="Full name" style="padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;"></div>' +
                   '<div style="display:grid; grid-template-columns:80px 1fr; gap:8px; align-items:center; margin-bottom:8px;"><label style="font-size:11px; color:#666;">Email:</label>' +
                   '<input type="email" id="edit-email-' + index + '" value="' + (metadata.email || '') + '" placeholder="user@example.com" style="padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;"></div>' +
                   '<div style="display:grid; grid-template-columns:80px 1fr; gap:8px; align-items:center; margin-bottom:8px;"><label style="font-size:11px; color:#666;">Role:</label>' +
                   '<select id="edit-role-' + index + '" style="padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;">' +
                   '<option value="">Select role...</option>' +
                   '<option value="admin"' + (metadata.role === 'admin' ? ' selected' : '') + '>Administrator</option>' +
                   '<option value="user"' + (metadata.role === 'user' ? ' selected' : '') + '>User</option>' +
                   '<option value="readonly"' + (metadata.role === 'readonly' ? ' selected' : '') + '>Read Only</option>' +
                   '<option value="guest"' + (metadata.role === 'guest' ? ' selected' : '') + '>Guest</option>' +
                   '</select></div>' +
                   '</div>' +
                   
                   '<div>' +
                   '<h5 style="margin:0 0 12px 0; color:#2c3e50; border-bottom:2px solid #e67e22; padding-bottom:4px;">Contact & Organization</h5>' +
                   '<div style="display:grid; grid-template-columns:80px 1fr; gap:8px; align-items:center; margin-bottom:8px;"><label style="font-size:11px; color:#666;">Organization:</label>' +
                   '<input type="text" id="edit-organization-' + index + '" value="' + (metadata.organization || '') + '" placeholder="Company name" style="padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;"></div>' +
                   '<div style="display:grid; grid-template-columns:80px 1fr; gap:8px; align-items:center; margin-bottom:8px;"><label style="font-size:11px; color:#666;">Department:</label>' +
                   '<input type="text" id="edit-department-' + index + '" value="' + (metadata.department || '') + '" placeholder="IT, Sales, etc." style="padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;"></div>' +
                   '<div style="display:grid; grid-template-columns:80px 1fr; gap:8px; align-items:center; margin-bottom:8px;"><label style="font-size:11px; color:#666;">Phone:</label>' +
                   '<input type="tel" id="edit-phone-' + index + '" value="' + (metadata.phone || '') + '" placeholder="+1-555-123-4567" style="padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;"></div>' +
                   '<div style="display:grid; grid-template-columns:80px 1fr; gap:8px; align-items:center; margin-bottom:8px;"><label style="font-size:11px; color:#666;">Location:</label>' +
                   '<input type="text" id="edit-location-' + index + '" value="' + (metadata.location || '') + '" placeholder="City, Country" style="padding:4px; border:1px solid #ddd; border-radius:3px; font-size:11px;"></div>' +
                   '</div>' +
                   
                   '<div>' +
                   '<h5 style="margin:0 0 12px 0; color:#2c3e50; border-bottom:2px solid #27ae60; padding-bottom:4px;">Avatar Management</h5>' +
                   '<div style="margin-bottom:15px; text-align:center;">' +
                   '<div style="margin-bottom:8px;"><strong style="font-size:11px; color:#666;">Current Avatar:</strong></div>' +
                   '<div id="avatar-preview-' + index + '" style="margin-bottom:10px; display:flex; justify-content:center;">' +
                   (metadata.avatar ? 
                       '<img src="' + metadata.avatar + '" style="width:64px; height:64px; border-radius:50%; border:3px solid #ddd; object-fit:cover;">' : 
                       '<div style="width:64px; height:64px; border-radius:50%; border:3px solid #ddd; background:#f8f9fa; display:flex; align-items:center; justify-content:center; color:#666; font-size:10px;">No Avatar</div>') +
                   '</div>' +
                   '<div style="margin-bottom:8px;">' +
                   '<input type="file" id="avatar-input-' + index + '" accept="image/*" style="font-size:10px; width:100%;" onchange="previewAvatarFile(' + index + ')">' +
                   '<div id="avatar-filename-' + index + '" style="font-size:9px; color:#666; margin-top:4px; text-align:center; min-height:12px;">' +
                   (metadata.avatarFilename ? metadata.avatarFilename : '') +
                   '</div>' +
                   '</div>' +
                   '<button onclick="event.stopPropagation(); updateDIDAvatar(\\'' + did.id + '\\', ' + index + ')" style="font-size:10px; padding:6px 12px; background:#3498db; color:white; border:none; border-radius:3px; cursor:pointer; width:80%; margin-bottom:10px;">' +
                   (metadata.avatar ? 'Change Avatar' : 'Choose Avatar') +
                   '</button>' +
                   '</div>' +
                   '</div>' +
                   '</div>' +
                   
                   '<div style="margin-bottom:7px;">' +
                   '<h5 style="margin:0 0 3px 0; color:#2c3e50; border-bottom:2px solid #9b59b6; padding-bottom:1px;">Notes & Description</h5>' +
                   '<textarea id="edit-notes-' + index + '" placeholder="Administrative notes, user description, or other relevant information..." style="width:100%; height:60px; padding:3px; border:1px solid #ddd; border-radius:3px; font-size:11px; resize:vertical; font-family:inherit;">' + (metadata.notes || '') + '</textarea>' +
                   '</div>' +
                   
                   '<div style="display:flex; justify-content:space-between; align-items:center; padding-top:5px; border-top:1px solid #eee;">' +
                   '<div>' +
                   '<button onclick="saveDIDChanges(\\'' + did.id + '\\', ' + index + ')" style="font-size:11px; padding:8px 16px; background:#27ae60; color:white; border:none; border-radius:3px; cursor:pointer; margin-right:8px;">Save Changes</button>' +
                   '<button onclick="resetDIDForm(' + index + ')" style="font-size:11px; padding:8px 16px; background:#95a5a6; color:white; border:none; border-radius:3px; cursor:pointer;">Reset</button>' +
                   '</div>' +
                   '<button onclick="deleteDID(\\'' + did.id + '\\', ' + index + ')" style="font-size:11px; padding:8px 16px; background:#e74c3c; color:white; border:none; border-radius:3px; cursor:pointer;">Delete DID</button>' +
                   '</div>' +
                   '</div>' +
                   '</div>';
        }
        
        function previewAvatarFile(index) {
            const fileInput = document.getElementById('avatar-input-' + index);
            const file = fileInput ? fileInput.files[0] : null;
            const filenameDiv = document.getElementById('avatar-filename-' + index);
            const previewContainer = document.getElementById('avatar-preview-' + index);
            
            // Debug logging
            if (!fileInput) {
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Avatar preview failed: fileInput not found for index ' + index })
                });
                return;
            }
            
            if (!previewContainer) {
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Avatar preview failed: previewContainer not found for index ' + index })
                });
                return;
            }
            
            if (file) {
                // Update filename display
                if (filenameDiv) {
                    filenameDiv.textContent = file.name;
                }
                
                // Preview the image
                const reader = new FileReader();
                reader.onload = function(e) {
                    const avatarData = e.target.result;
                    
                    // Update preview immediately - try multiple approaches
                    const currentImg = previewContainer.querySelector('img');
                    const currentDiv = previewContainer.querySelector('div');
                    
                    if (currentImg) {
                        currentImg.src = avatarData;
                        fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: 'Avatar preview: Updated existing img src' })
                        });
                    } else if (currentDiv) {
                        currentDiv.outerHTML = '<img src="' + avatarData + '" style="width:64px; height:64px; border-radius:50%; border:3px solid #ddd; object-fit:cover;">';
                        fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: 'Avatar preview: Replaced div with img' })
                        });
                    } else {
                        // Fallback: replace entire container content
                        previewContainer.innerHTML = '<img src="' + avatarData + '" style="width:64px; height:64px; border-radius:50%; border:3px solid #ddd; object-fit:cover;">';
                        fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: 'Avatar preview: Replaced entire container content' })
                        });
                    }
                };
                reader.readAsDataURL(file);
            } else {
                if (filenameDiv) {
                    filenameDiv.textContent = '';
                }
            }
        }

        function updateDIDAvatar(didId, index) {
            const fileInput = document.getElementById('avatar-input-' + index);
            const file = fileInput.files[0];
            
            if (!file) {
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const avatarData = e.target.result;
                
                // Update the local data
                const did = availableDIDs.find(d => d.id === didId);
                if (did) {
                    if (!did.metadata) did.metadata = {};
                    did.metadata.avatar = avatarData;
                    did.metadata.avatarFilename = file.name;
                }
                
                // Save avatar to database immediately
                fetch('/nodebit/workspace/' + workspaceId + '/api/dids/' + encodeURIComponent(didId), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        metadata: { 
                            avatar: avatarData,
                            avatarFilename: file.name
                        } 
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        // Update the small avatar in the DID list row if it exists
                        const didRowAvatar = document.querySelector('[data-did-index="' + index + '"] img[style*="width:16px"]');
                        if (didRowAvatar) {
                            didRowAvatar.src = avatarData;
                        } else {
                            // Add avatar to the row if it didn't have one before
                            const didIdSpan = document.querySelector('[data-did-index="' + index + '"] div[style*="font-family:monospace"] span');
                            if (didIdSpan) {
                                didIdSpan.innerHTML = '<img src="' + avatarData + '" style="width:16px; height:16px; border-radius:50%; margin-right:4px; vertical-align:middle;">' + didIdSpan.textContent;
                            }
                        }
                        
                        // Update button text to "Change Avatar"
                        const updateButton = document.querySelector('#did-panel-' + index + ' button[onclick*="updateDIDAvatar"]');
                        if (updateButton) {
                            updateButton.textContent = 'Change Avatar';
                        }
                        
                        // Clear the file input and update filename display
                        fileInput.value = '';
                        const filenameDiv = document.getElementById('avatar-filename-' + index);
                        if (filenameDiv) {
                            filenameDiv.textContent = file.name + ' (saved)';
                        }
                    }
                })
                .catch(error => {
                    console.error('Error saving avatar:', error);
                });
            };
            reader.readAsDataURL(file);
        }
        
        function saveDIDChanges(didId, index) {
            const updatedMetadata = {
                username: document.getElementById('edit-username-' + index).value.trim(),
                displayName: document.getElementById('edit-displayname-' + index).value.trim(),
                email: document.getElementById('edit-email-' + index).value.trim(),
                role: document.getElementById('edit-role-' + index).value,
                organization: document.getElementById('edit-organization-' + index).value.trim(),
                department: document.getElementById('edit-department-' + index).value.trim(),
                phone: document.getElementById('edit-phone-' + index).value.trim(),
                location: document.getElementById('edit-location-' + index).value.trim(),
                notes: document.getElementById('edit-notes-' + index).value.trim()
            };
            
            // Include avatar data if it was updated locally
            const did = availableDIDs.find(d => d.id === didId);
            if (did && did.metadata && did.metadata.avatar) {
                updatedMetadata.avatar = did.metadata.avatar;
                updatedMetadata.avatarFilename = did.metadata.avatarFilename;
            }
            
            // Save to database via API
            fetch('/nodebit/workspace/' + workspaceId + '/api/dids/' + encodeURIComponent(didId), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metadata: updatedMetadata })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // Reload DIDs to show updated data
                    loadDIDs();
                    toggleDIDPanel(index);
                }
            })
            .catch(error => {
                console.error('Error saving DID metadata:', error);
            });
        }
        
        function resetDIDForm(index) {
            const did = availableDIDs[index];
            if (!did) return;
            
            const metadata = did.metadata || {};
            document.getElementById('edit-username-' + index).value = metadata.username || '';
            document.getElementById('edit-displayname-' + index).value = metadata.displayName || '';
            document.getElementById('edit-email-' + index).value = metadata.email || '';
            document.getElementById('edit-role-' + index).value = metadata.role || '';
            document.getElementById('edit-organization-' + index).value = metadata.organization || '';
            document.getElementById('edit-department-' + index).value = metadata.department || '';
            document.getElementById('edit-phone-' + index).value = metadata.phone || '';
            document.getElementById('edit-location-' + index).value = metadata.location || '';
            document.getElementById('edit-notes-' + index).value = metadata.notes || '';
        }
        
        function createNewDID() {
            const username = document.getElementById('new-did-id').value.trim();
            const avatarInput = document.getElementById('did-avatar-input');
            
            if (!username) {
                // Log to activity instead of alert
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'DID creation attempted without username' })
                });
                return;
            }
            
            // Generate a proper DID identifier from the username
            // Use format: user-{username} to be clear and consistent
            const didId = 'user-' + username.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            const metadata = {
                username: username,
                createdBy: 'dashboard',
                description: 'Created via dashboard'
            };
            
            // Handle avatar if selected
            if (avatarInput && avatarInput.files[0]) {
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
                    if (document.getElementById('did-avatar-input')) {
                        document.getElementById('did-avatar-input').value = '';
                    }
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
        
        function clearDIDSearch() {
            const searchInput = document.getElementById('did-search');
            if (searchInput) {
                searchInput.value = '';
                // Trigger search to show all DIDs again
                loadDIDs();
            }
        }
        
        function toggleNetworkPanel(index) {
            const row = document.querySelector('[data-network-index="' + index + '"]');
            const panel = document.getElementById('network-panel-' + index);
            
            if (row && panel) {
                const isExpanded = panel.style.display === 'table-row';
                
                // Close all other panels first
                document.querySelectorAll('.management-panel').forEach(p => {
                    p.style.display = 'none';
                });
                document.querySelectorAll('.network-row').forEach(r => {
                    r.classList.remove('expanded');
                });
                
                if (!isExpanded) {
                    panel.style.display = 'table-row';
                    row.classList.add('expanded');
                }
            }
        }
        
        function generateNetworkDetailsPanel(network, index) {
            const networkType = network.type || 'unknown';
            const peerId = network.peerId || 'Unknown';
            const addresses = network.addresses || [];
            const peers = network.peers || 0;
            
            let detailsHtml = '<div style="font-size:12px; color:#666; max-height:400px; overflow-y:auto;">';
            detailsHtml += '<h4 style="margin:0 0 10px 0; color:#2c3e50;">Network Details</h4>';
            
            detailsHtml += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">';
            
            // Left column - Basic info
            detailsHtml += '<div>';
            detailsHtml += '<strong>Network Type:</strong> ' + networkType + '<br>';
            detailsHtml += '<strong>Peer ID:</strong> <code style="font-size:10px;">' + peerId + '</code><br>';
            detailsHtml += '<strong>Status:</strong> <span class="status-badge status-connected">' + network.status + '</span><br>';
            detailsHtml += '<strong>Connected Peers:</strong> ' + peers + '<br>';
            detailsHtml += '</div>';
            
            // Right column - Addresses with scrollable list and copy buttons
            detailsHtml += '<div>';
            detailsHtml += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">';
            detailsHtml += '<strong>Network Addresses:</strong>';
            if (addresses.length > 0) {
                detailsHtml += '<div style="display:flex; gap:4px;">';
                detailsHtml += '<button onclick="event.stopPropagation(); copyNetworkAddresses(' + index + ', \\'json\\')" class="btn" style="font-size:10px; padding:2px 6px; background:#28a745; color:white;">JSON</button>';
                detailsHtml += '<button onclick="event.stopPropagation(); copyNetworkAddresses(' + index + ', \\'text\\')" class="btn" style="font-size:10px; padding:2px 6px; background:#17a2b8; color:white;">Text</button>';
                detailsHtml += '<button onclick="event.stopPropagation(); copyNetworkAddresses(' + index + ', \\'xml\\')" class="btn" style="font-size:10px; padding:2px 6px; background:#6f42c1; color:white;">XML</button>';
                detailsHtml += '</div>';
            }
            detailsHtml += '</div>';
            
            if (addresses.length > 0) {
                detailsHtml += '<div style="max-height:120px; overflow-y:auto; border:1px solid #ddd; border-radius:3px; padding:5px; background:#f8f9fa; max-width:100px; width:100%; overflow-x:hidden; box-sizing:border-box; word-wrap:break-word;">';
                addresses.forEach(addr => {
                    detailsHtml += '<code style="font-size:10px; display:block; margin:2px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; box-sizing:border-box;" title="' + addr + '">' + addr + '</code>';
                });
                detailsHtml += '</div>';
            } else {
                detailsHtml += '<span style="color:#999; font-style:italic;">No addresses available</span>';
            }
            detailsHtml += '</div>';
            
            detailsHtml += '</div>';
            
            // Management actions
            detailsHtml += '<div style="border-top:1px solid #eee; padding-top:10px; margin-top:10px;">';
            detailsHtml += '<h5 style="margin:0 0 8px 0; color:#2c3e50;">Management Actions</h5>';
            detailsHtml += '<div style="display:flex; gap:8px;">';
            detailsHtml += '<button class="btn btn-primary" onclick="event.stopPropagation();" style="font-size:11px;">Refresh Status</button>';
            detailsHtml += '<button class="btn" onclick="event.stopPropagation();" style="font-size:11px; background:#6c757d; color:white;">View Logs</button>';
            if (networkType === 'kubo') {
                detailsHtml += '<button class="btn" onclick="event.stopPropagation();" style="font-size:11px; background:#dc3545; color:white;">Disconnect</button>';
            }
            detailsHtml += '</div>';
            detailsHtml += '</div>';
            
            detailsHtml += '</div>';
            
            return detailsHtml;
        }
        
        function copyNetworkAddresses(networkIndex, format) {
            const network = window.networkData ? window.networkData[networkIndex] : null;
            if (!network || !network.addresses || network.addresses.length === 0) {
                return;
            }
            
            let content = '';
            const addresses = network.addresses;
            
            switch (format) {
                case 'json':
                    content = JSON.stringify({
                        network: network.name || network.id,
                        type: network.type,
                        addresses: addresses
                    }, null, 2);
                    break;
                case 'text':
                    content = addresses.join('\\n');
                    break;
                case 'xml':
                    content = '<?xml version="1.0" encoding="UTF-8"?>' + '\\n';
                    content += '<network>' + '\\n';
                    content += '  <name>' + (network.name || network.id) + '</name>' + '\\n';
                    content += '  <type>' + network.type + '</type>' + '\\n';
                    content += '  <addresses>' + '\\n';
                    addresses.forEach(addr => {
                        content += '    <address>' + addr + '</address>' + '\\n';
                    });
                    content += '  </addresses>' + '\\n';
                    content += '</network>';
                    break;
            }
            
            // Copy to clipboard
            navigator.clipboard.writeText(content).then(() => {
                // Log success to activity
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Copied network addresses to clipboard (' + format.toUpperCase() + ' format)' })
                });
            }).catch(err => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                // Log success to activity
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Copied network addresses to clipboard (' + format.toUpperCase() + ' format) - fallback method' })
                });
            });
        }
        
        function copyAllActivities() {
            if (!displayedActivities || displayedActivities.length === 0) {
                return;
            }
            
            // Create CSV format of displayed activities
            const csvContent = displayedActivities.map(activity => {
                const time = new Date(activity.timestamp).toLocaleString();
                const level = activity.level || activity.type || 'info';
                const message = activity.message || '';
                const data = activity.data || '';
                
                return '"' + time + '","' + level + '","' + message.replace(/"/g, '""') + '","' + data.replace(/"/g, '""') + '"';
            }).join('\\n');
            
            const header = 'Timestamp,Level,Message,Data\\n';
            const fullContent = header + csvContent;
            
            // Copy to clipboard
            navigator.clipboard.writeText(fullContent).then(() => {
                // Log success to activity
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Copied all displayed activities to clipboard (CSV format)' })
                });
            }).catch(err => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = fullContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                // Log success to activity
                fetch('/nodebit/workspace/' + workspaceId + '/api/test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Copied all displayed activities to clipboard (CSV format) - fallback method' })
                });
            });
        }

        // Initialize dashboard when page loads
        document.addEventListener('DOMContentLoaded', function() {
            showTab('overview');
            
            // Set up activity search functionality
            const activitySearch = document.getElementById('activity-search');
            if (activitySearch) {
                activitySearch.addEventListener('input', function() {
                    displayActivities(allActivities);
                });
            }
            
            // Auto-refresh overview tab every 30 seconds
            setInterval(function() {
                if (document.querySelector('.nav-tab.active').textContent.trim() === 'Overview') {
                    loadActivity();
                    loadStats();
                }
            }, 30000);
        });
    `;
}

module.exports = { generateClientScripts };
