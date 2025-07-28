/**
 * Validation - Input validation helpers
 */

function validateDIDInput(id, metadata = {}) {
    if (!id) {
        return { valid: false, error: 'DID id is required' };
    }

    if (typeof id !== 'string') {
        return { valid: false, error: 'DID id must be a string' };
    }

    if (id.length < 1) {
        return { valid: false, error: 'DID id cannot be empty' };
    }

    if (id.length > 100) {
        return { valid: false, error: 'DID id cannot exceed 100 characters' };
    }

    // Basic character validation - alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        return { valid: false, error: 'DID id can only contain letters, numbers, hyphens, and underscores' };
    }

    if (metadata && typeof metadata !== 'object') {
        return { valid: false, error: 'Metadata must be an object' };
    }

    return { valid: true };
}

function validateACLInput(did, resource, action) {
    if (!did) {
        return { valid: false, error: 'DID is required' };
    }

    if (!resource) {
        return { valid: false, error: 'Resource is required' };
    }

    if (!action) {
        return { valid: false, error: 'Action is required' };
    }

    if (typeof did !== 'string') {
        return { valid: false, error: 'DID must be a string' };
    }

    if (typeof resource !== 'string') {
        return { valid: false, error: 'Resource must be a string' };
    }

    if (typeof action !== 'string') {
        return { valid: false, error: 'Action must be a string' };
    }

    // Validate action is one of the allowed values
    const allowedActions = ['read', 'write', 'admin', 'grant', 'revoke'];
    if (!allowedActions.includes(action)) {
        return { 
            valid: false, 
            error: `Action must be one of: ${allowedActions.join(', ')}` 
        };
    }

    // Basic length validation
    if (did.length > 100) {
        return { valid: false, error: 'DID cannot exceed 100 characters' };
    }

    if (resource.length > 200) {
        return { valid: false, error: 'Resource cannot exceed 200 characters' };
    }

    return { valid: true };
}

function validateFileUpload(content, filename = null) {
    if (!content) {
        return { valid: false, error: 'Content is required' };
    }

    if (typeof content !== 'string') {
        return { valid: false, error: 'Content must be a string' };
    }

    // Check content size (limit to 10MB for safety)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (content.length > maxSize) {
        return { valid: false, error: 'Content exceeds maximum size of 10MB' };
    }

    if (filename) {
        if (typeof filename !== 'string') {
            return { valid: false, error: 'Filename must be a string' };
        }

        if (filename.length > 255) {
            return { valid: false, error: 'Filename cannot exceed 255 characters' };
        }

        // Basic filename validation - no path separators or dangerous characters
        if (/[<>:"|?*\\/]/.test(filename)) {
            return { valid: false, error: 'Filename contains invalid characters' };
        }
    }

    return { valid: true };
}

function validateNetworkId(networkId) {
    if (!networkId) {
        return { valid: false, error: 'Network ID is required' };
    }

    if (typeof networkId !== 'string') {
        return { valid: false, error: 'Network ID must be a string' };
    }

    if (networkId.length > 100) {
        return { valid: false, error: 'Network ID cannot exceed 100 characters' };
    }

    return { valid: true };
}

function validatePaginationParams(before, limit) {
    const result = { valid: true, params: {} };

    if (before !== undefined && before !== null) {
        if (typeof before !== 'string') {
            return { valid: false, error: 'Before parameter must be a string' };
        }
        result.params.before = before;
    }

    if (limit !== undefined && limit !== null) {
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
            return { valid: false, error: 'Limit must be a number between 1 and 1000' };
        }
        result.params.limit = parsedLimit;
    } else {
        result.params.limit = 50; // Default limit
    }

    return result;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }

    // Basic HTML/script tag removal for safety
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
}

module.exports = {
    validateDIDInput,
    validateACLInput,
    validateFileUpload,
    validateNetworkId,
    validatePaginationParams,
    sanitizeInput
};