/**
 * Input Validation Utilities
 * Provides secure validation for user inputs
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Strong password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required' };
    }

    const trimmed = email.trim().toLowerCase();

    if (trimmed.length > 254) {
        return { isValid: false, error: 'Email is too long' };
    }

    if (!EMAIL_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
    if (!password || typeof password !== 'string') {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        return { isValid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long' };
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty123', 'letmein', 'welcome'];
    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        return { isValid: false, error: 'Password is too common. Please choose a stronger password.' };
    }

    return { isValid: true };
}

/**
 * Validates password with strict requirements
 */
export function validateStrongPassword(password: string): ValidationResult {
    const basicValidation = validatePassword(password);
    if (!basicValidation.isValid) {
        return basicValidation;
    }

    if (!PASSWORD_REGEX.test(password)) {
        return {
            isValid: false,
            error: 'Password must include uppercase, lowercase, number, and special character'
        };
    }

    return { isValid: true };
}

/**
 * Validates a URL
 */
export function validateUrl(url: string): ValidationResult {
    if (!url || typeof url !== 'string') {
        return { isValid: true }; // Empty URL is valid (optional field)
    }

    const trimmed = url.trim();

    if (trimmed.length > 2048) {
        return { isValid: false, error: 'URL is too long' };
    }

    if (!URL_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid URL (starting with http:// or https://)' };
    }

    return { isValid: true };
}

/**
 * Validates a user name
 */
export function validateName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Name is required' };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
    }

    if (trimmed.length > 100) {
        return { isValid: false, error: 'Name is too long' };
    }

    // Check for invalid characters (allowing unicode letters, spaces, hyphens, apostrophes)
    if (!/^[\p{L}\s'-]+$/u.test(trimmed)) {
        return { isValid: false, error: 'Name contains invalid characters' };
    }

    return { isValid: true };
}

/**
 * Validates project name
 */
export function validateProjectName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Project name is required' };
    }

    const trimmed = name.trim();

    if (trimmed.length < 3) {
        return { isValid: false, error: 'Project name must be at least 3 characters' };
    }

    if (trimmed.length > 100) {
        return { isValid: false, error: 'Project name is too long' };
    }

    return { isValid: true };
}

/**
 * Validates text content length
 */
export function validateTextLength(
    text: string,
    options: { min?: number; max?: number; fieldName?: string } = {}
): ValidationResult {
    const { min = 0, max = 10000, fieldName = 'Text' } = options;

    if (!text && min > 0) {
        return { isValid: false, error: `${fieldName} is required` };
    }

    if (text && text.length < min) {
        return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
    }

    if (text && text.length > max) {
        return { isValid: false, error: `${fieldName} is too long (max ${max} characters)` };
    }

    return { isValid: true };
}

/**
 * Sanitizes text input by removing dangerous characters
 */
export function sanitizeTextInput(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .trim()
        // Remove null bytes
        .replace(/\0/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove control characters except newlines and tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Rate limiting helper for client-side
 */
export function createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts: number[] = [];

    return {
        canAttempt(): boolean {
            const now = Date.now();
            // Remove old attempts
            while (attempts.length > 0 && attempts[0] < now - windowMs) {
                attempts.shift();
            }
            return attempts.length < maxAttempts;
        },

        recordAttempt(): void {
            attempts.push(Date.now());
        },

        getRemainingAttempts(): number {
            const now = Date.now();
            while (attempts.length > 0 && attempts[0] < now - windowMs) {
                attempts.shift();
            }
            return Math.max(0, maxAttempts - attempts.length);
        },

        getResetTime(): number {
            if (attempts.length === 0) return 0;
            return Math.max(0, attempts[0] + windowMs - Date.now());
        }
    };
}
