/**
 * Response Helpers - Standard HTTP response utilities
 */

function createErrorResponse(message, details = null) {
    const response = { error: message };
    if (details) {
        response.details = details;
    }
    return response;
}

function createSuccessResponse(data = null) {
    const response = { success: true };
    if (data) {
        Object.assign(response, data);
    }
    return response;
}

function createValidationErrorResponse(field, message) {
    return {
        error: 'Validation failed',
        field: field,
        message: message
    };
}

function createNotFoundResponse(resource) {
    return {
        error: `${resource} not found`
    };
}

function createServiceUnavailableResponse(service, reason = null) {
    const response = {
        error: `${service} not available`
    };
    if (reason) {
        response.reason = reason;
    }
    return response;
}

function createUnauthorizedResponse(action = null) {
    const response = {
        error: 'Unauthorized'
    };
    if (action) {
        response.action = action;
    }
    return response;
}

function createPaginatedResponse(data, pagination = null) {
    const response = {
        success: true,
        data: data
    };
    if (pagination) {
        response.pagination = pagination;
    }
    return response;
}

module.exports = {
    createErrorResponse,
    createSuccessResponse,
    createValidationErrorResponse,
    createNotFoundResponse,
    createServiceUnavailableResponse,
    createUnauthorizedResponse,
    createPaginatedResponse
};