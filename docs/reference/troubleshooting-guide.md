# Troubleshooting Guide

**Warning: Nodebit is in early development. Most features are incomplete or demo-only. This guide covers known issues in the current implementation.**

## Common Issues and Solutions

### Client Scripts Function Export Errors

#### Issue: `TypeError: generateClientScripts is not a function`
**Symptoms**: Dashboard fails to load, Node-RED shows function export error
**Cause**: Missing or corrupted function export in `nodes/workspace/ui/client-scripts.js`
**Solution**: 
1. Verify the file ends with `module.exports = { generateClientScripts };`
2. Ensure `generateClientScripts(workspaceId)` function is properly defined
3. Check that the function returns a complete JavaScript string
4. Restart Node-RED after fixing exports

**Prevention**: Always test function exports immediately after modifications

### Activity Loading Issues

#### Issue: Recent Activity Shows "Activity loading not implemented"
**Symptoms**: Activity panel shows placeholder text instead of real data
**Cause**: Missing or incomplete `loadActivity()` function implementation
**Solution**:
1. Restore complete `loadActivity()` function that fetches from `/api/activity`
2. Ensure `displayActivities()` function is implemented
3. Add `toggleActivityRow()` and `updateRecordCount()` functions
4. Set up activity search event listeners in DOMContentLoaded

### DID Deletion Errors

#### Issue: `DELETE .../api/dids/undefined 500 (Internal Server Error)`
**Symptoms**: DID deletion fails with 500 error, "undefined" appears in URL
**Cause**: DID records with undefined `id` fields in OrbitDB
**Solution**:
1. Modified `getAllDIDs()` to automatically remove corrupted records
2. Added validation in deletion API to reject invalid identifiers
3. Added client-side validation before making deletion requests
4. No manual repair needed - corrupted records are automatically cleaned up

### Dashboard Initialization Problems

#### Issue: `workspaceId is not defined` Error
**Symptoms**: Browser console shows JavaScript errors, dashboard fails to load data
**Solution**: This has been fixed in the latest version. The workspace ID is now properly injected into client scripts.

**Technical Details**:
- `generateClientScripts(workspaceId)` now accepts workspace ID parameter
- Global variable `const workspaceId = '${workspaceId}';` is injected at script start
- All API calls now have proper workspace context

#### Issue: Activity Not Loading
**Symptoms**: "Loading activity..." message persists, no activity records appear
**Solution**: Fixed with proper `loadActivity()` function restoration and initialization.

**Verification Steps**:
1. Check browser console for JavaScript errors
2. Verify workspace node has been saved with an ID
3. Confirm API endpoints are responding at `/nodebit/workspace/{id}/api/activity`

### CSS Grid Layout Issues

#### Issue: Components Not Organized Properly
**Symptoms**: Panels overlap, sidebar doesn't maintain fixed width, layout appears broken
**Solution**: CSS Grid system has been implemented with proper constraints.

**Layout Structure**:
```css
.security-grid {
    grid-template-columns: 1fr 330px; /* Content + Fixed sidebar */
    grid-template-rows: 2fr 1fr; /* DID panel twice as tall as ACL */
}
```

#### Issue: DID Panel Not Expanding
**Symptoms**: Clicking "more..." button doesn't show DID details
**Solution**: All DID management functions have been restored.

**Functions Added**:
- `toggleDIDPanel(index)` - Panel expand/collapse
- `generateDIDDetailsPanel(did, index)` - Panel content generation
- `updateDIDAvatar(didId, index)` - Avatar management
- `saveDIDChanges(didId, index)` - Form submission
- `resetDIDForm(index)` - Form reset
- `deleteDID(didId, index)` - DID deletion

### Search and Filtering Problems

#### Issue: Search Not Working
**Symptoms**: Typing in search boxes doesn't filter results
**Solution**: Event listeners are now properly set up during initialization.

**Implementation**:
- Activity search: Real-time filtering of activity records
- DID search: Filters across username, identifier, and status
- Automatic setup during `DOMContentLoaded` event

### Performance Issues

#### Issue: Dashboard Slow to Load
**Solutions**:
1. **Periodic Refresh**: Limited to 30-second intervals for Overview tab only
2. **Efficient Rendering**: CSS Grid provides hardware-accelerated layout
3. **Proper Event Handling**: Minimal DOM manipulation and efficient updates

#### Issue: Memory Leaks
**Prevention Measures**:
- Event listeners properly cleaned up
- Interval timers scoped to active tabs
- Efficient data structures for activity and DID storage

## Debugging Steps

### 1. Browser Console Check
Open browser developer tools and check for:
- JavaScript errors (should be none)
- Network requests failing
- Workspace ID properly set

### 2. API Endpoint Verification
Test these endpoints manually:
- `/nodebit/workspace/{id}/api/activity` - Activity data
- `/nodebit/workspace/{id}/api/dids` - DID list
- `/nodebit/workspace/{id}/api/stats` - Overview statistics

### 3. Node-RED Flow Verification
Ensure:
- Workspace node is saved and has an ID
- HTTP routes are properly registered
- Workspace manager is initialized

### 4. Activity System Check
Verify activity logging works:
- Create a test DID
- Check if creation is logged
- Verify activity appears in Recent Activity

## Error Codes and Messages

### JavaScript Errors (Fixed)
- ❌ `workspaceId is not defined` → ✅ Fixed with proper parameter injection
- ❌ `showTab is not defined` → ✅ Fixed with function restoration
- ❌ `loadActivity is not defined` → ✅ Fixed with complete implementation

### API Errors
- `HTTP 404`: Workspace not found or routes not registered
- `HTTP 500`: Server error, check Node-RED debug output
- `Connection refused`: IPFS/OrbitDB not running

### Layout Errors
- Panels not rendering: Check CSS Grid browser support
- Fixed widths not working: Verify CSS Grid implementation
- Overflow issues: Check container constraints

## Performance Optimization

### Best Practices
1. **Limit Refresh Frequency**: 30-second intervals for active data
2. **Efficient Search**: Client-side filtering for small datasets
3. **Lazy Loading**: Load data only when tabs are active
4. **Memory Management**: Clean up event listeners and intervals

### Monitoring
- Use browser performance tools to monitor memory usage
- Check network tab for excessive API calls
- Monitor CSS Grid rendering performance

## Recovery Procedures

### Complete Reset
If dashboard is completely broken:
1. Delete workspace node
2. Create new workspace node
3. Save and deploy
4. Refresh browser

### Partial Reset
For specific issues:
1. Clear browser cache
2. Hard refresh (Ctrl+F5)
3. Check Node-RED debug output
4. Restart Node-RED if necessary

## Support Information

### Browser Compatibility
- **Recommended**: Chrome 88+, Firefox 87+, Safari 14+
- **CSS Grid Support**: Required for layout
- **JavaScript ES6**: Required for modern syntax

### System Requirements
- **Node-RED**: 3.0+ recommended
- **IPFS**: Helia or Kubo
- **OrbitDB**: Latest version
- **Memory**: 512MB+ available

This troubleshooting guide covers the major issues that have been identified and resolved in the current early development version of Nodebit.