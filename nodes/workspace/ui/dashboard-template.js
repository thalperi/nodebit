/**
 * Dashboard Template - Overview tab HTML generation
 */

function generateDashboardTemplate() {
    return `
        <div id="overview-panel" class="content-panel" style="height:100%; max-height:100%; background:white; border-radius:8px; overflow:hidden; display:grid; grid-template-rows:auto 1fr; grid-template-columns:1fr;">
            <div class="overview-main-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); grid-template-rows:auto 1fr; gap:16px; width:100%; height:100%; min-height:0; padding:16px; box-sizing:border-box;">
                ${generateStatsGrid()}
                <div style="grid-column:1 / span 4; min-height:0; display:flex; flex-direction:column;">
                    ${generateActivitySection()}
                </div>
            </div>
        </div>
    `;
}

function generateStatsGrid() {
    return `
        <div class="stat-card" style="padding:16px; background:linear-gradient(135deg, #85c1e9, #5dade2); color:white; border-radius:8px; text-align:center; min-width:0;">
            <div style="font-size:1.5em;" id="networks-count">-</div>
            <div style="font-size:12px;">IPFS Networks</div>
        </div>
        <div class="stat-card" style="padding:16px; background:linear-gradient(135deg, #85c1e9, #5dade2); color:white; border-radius:8px; text-align:center; min-width:0;">
            <div style="font-size:1.5em;" id="databases-count">-</div>
            <div style="font-size:12px;">OrbitDB Databases</div>
        </div>
        <div class="stat-card" style="padding:16px; background:linear-gradient(135deg, #85c1e9, #5dade2); color:white; border-radius:8px; text-align:center; min-width:0;">
            <div style="font-size:1.5em;" id="files-count">-</div>
            <div style="font-size:12px;">IPFS Files</div>
        </div>
        <div class="stat-card" style="padding:16px; background:linear-gradient(135deg, #85c1e9, #5dade2); color:white; border-radius:8px; text-align:center; min-width:0;">
            <div style="font-size:1.5em;" id="peers-count">-</div>
            <div style="font-size:12px;">Connected Peers</div>
        </div>
    `;
}

function generateActivitySection() {
    return `
        <div style="flex:1; display:flex; flex-direction:column; min-height:0;">
            ${generateActivityHeader()}
            ${generateActivityContainer()}
        </div>
    `;
}

function generateActivityHeader() {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <h4 style="font-size:14px; margin:0;">Recent Activity</h4>
                <span id="record-count" style="font-size:11px; color:#666; font-weight:normal;">0 records</span>
            </div>
            ${generateActivityControls()}
        </div>
    `;
}

function generateActivityControls() {
    return `
        <div style="display:flex; gap:6px; align-items:center;">
            <button onclick="copyAllActivities()" class="btn btn-primary" style="font-size:11px; padding:4px 8px;" title="Copy all displayed activities">
                <i class="fa fa-copy" style="margin-right:4px;"></i>Copy All
            </button>
            <input type="text" id="activity-search" placeholder="Search..." style="width:120px; font-size:11px; padding:4px 6px; border:1px solid #ddd; border-radius:3px;">
            <button id="load-more-btn" onclick="loadMoreActivities()" class="btn btn-primary" style="font-size:11px; padding:4px 8px; display:none;">...more</button>
            ${generateClearDropdown()}
        </div>
    `;
}

function generateClearDropdown() {
    return `
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
    `;
}

function generateActivityContainer() {
    return `
        <div id="activity-container" style="background:#f8f9fa; border-radius:4px; flex:1; overflow-y:auto; min-height:200px; border:1px solid #e9ecef;">
            <div id="activity-list" style="font-size:12px;">
                <div style="padding:10px; color:#666; text-align:center;">Loading activity...</div>
            </div>
        </div>
    `;
}

function generateOverviewSystemStatusCard() {
    return `
        <div style="background:#fff; border:1px solid #ddd; border-radius:4px;">
            <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                <i class="fa fa-cogs" style="margin-right:6px;"></i>System Status
            </div>
            <div style="padding:10px; font-size:12px;">
                <div style="margin-bottom:8px;">
                    <strong>Workspace State:</strong> <span id="workspace-status" style="color:#27ae60;">Loading...</span>
                </div>
                <div style="margin-bottom:8px;">
                    <strong>IPFS Networks:</strong> <span id="networks-count-sidebar">-</span>
                </div>
                <div style="margin-bottom:8px;">
                    <strong>OrbitDB Databases:</strong> <span id="databases-count-sidebar">-</span>
                </div>
                <div style="margin-bottom:8px;">
                    <strong>IPFS Files:</strong> <span id="files-count-sidebar">-</span>
                </div>
                <div>
                    <strong>Connected Peers:</strong> <span id="peers-count-sidebar">-</span>
                </div>
            </div>
        </div>
    `;
}

function generateOverviewInfoCard() {
    return `
        <div style="background:#fff; border:1px solid #ddd; border-radius:4px; flex:1;">
            <div style="background:#f8f9fa; padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; font-size:14px;">
                <i class="fa fa-info-circle" style="margin-right:6px;"></i>Workspace Info
            </div>
            <div style="padding:10px; font-size:11px; line-height:1.4; color:#666;">
                <p><strong>Overview:</strong> This dashboard provides a summary of your distributed workspace, including network, database, file, and peer statistics, as well as recent activity.</p>
                <p><strong>Tip:</strong> Use the navigation tabs above to explore networks, databases, files, and security settings.</p>
            </div>
        </div>
    `;
}

module.exports = { generateDashboardTemplate };