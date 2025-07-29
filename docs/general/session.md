# AI Agent Instructions - Prime Directive

**When engaging in any conversations via chat or whenever updating any documentation, you must:**
- Follow all documented preferences and guidelines without exception
- Avoid frivolous language like "Perfect", "Excellent", "Finished", "Complete", "Working", "Operational"
- Prioritize user observations over theoretical analysis
- Verify issues rather than assume problems exist
- Maintain professional, direct communication focused on facts
- Respect established documentation structure and organization
- Throughout the entire development lifecycle, always propose modifications to the documentation structure affecting even folders, files, logical layout, and compositional formatting, to ensure it always best reflects the current and actual codebase. This doesn't permit you to create new documentation, but you can recommend.

---

# Current Session Summary

## Session Status: UI Layout Issues - Development Paused

### Current State
- **UI Layout Problems**: Dashboard tabs have inconsistent and non-intuitive layout behavior
- **Grid Layout Issues**: CSS Grid implementation is not working as intended across all tabs
- **Title Removal**: Attempted to remove title banners from all 5 tabs but caused layout problems
- **Row Height Issues**: Network grid rows are expanding to full height instead of normal row sizing

### Technical Issues Identified
1. **CSS Grid Template Rows**: Changed from `auto 1fr` to `1fr` but this didn't resolve the underlying layout problems
2. **Content Panel Structure**: Removing title divs affected the grid structure in unexpected ways
3. **Network Table Layout**: Table rows are taking up full container height instead of normal table row sizing
4. **Inconsistent Behavior**: Different tabs are behaving differently with the same CSS changes

### Development Status
- **UI Layout**: Not working as desired - lacks intuitive behavior
- **CSS Grid Implementation**: Incomplete and problematic
- **User Experience**: Poor - layout is not meeting user requirements
- **Next Steps**: Continue development in new session with fresh approach

### Files Modified
- `nodes/workspace/ui/html-generator.js` - CSS Grid template rows and panel structures
- `nodes/workspace/ui/dashboard-template.js` - Overview panel title removal
- `nodes/workspace/ui/security-template.js` - Security panel title removal

### Session Outcome
The current UI implementation does not meet the user's requirements for intuitive layout behavior. The CSS Grid approach needs to be reconsidered and implemented properly in a new development session.

## UI Freeze Notice
- UI development for the Workspace and Security tabs is now frozen; both are sufficiently styled for their current feature sets.
- The next session will focus on connectivity issues for all IPFS instances (local and remote) and OrbitDB databases, including DIDs and ACLs.