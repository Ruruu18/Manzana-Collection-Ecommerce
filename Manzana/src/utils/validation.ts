/**
 * Validation utilities for forms and user input
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Calculate strength
  if (errors.length === 0) {
    // All requirements met
    if (password.length >= 12) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number (Philippine format)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Philippine phone numbers: 10 digits (09XXXXXXXXX) or 11 digits with country code
  return digitsOnly.length === 10 || digitsOnly.length === 11 || digitsOnly.length === 12;
};

/**
 * Sanitize user input to prevent XSS and SQL injection
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove SQL injection attempts
    .replace(/['";\\]/g, '')
    // Remove script tags and event handlers
    .replace(/on\w+\s*=/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * Sanitize text input (allows some special characters for names, addresses, etc)
 */
export const sanitizeText = (input: string): string => {
  if (!input) return '';

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Allow common punctuation but remove dangerous characters
    .replace(/[<>{}]/g, '');
};

/**
 * Validate and sanitize name
 */
export const validateName = (name: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(name);

  if (!sanitized || sanitized.length < 2) {
    return {
      isValid: false,
      sanitized,
      error: 'Name must be at least 2 characters long',
    };
  }

  if (sanitized.length > 100) {
    return {
      isValid: false,
      sanitized,
      error: 'Name is too long (maximum 100 characters)',
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-'\.]+$/.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Name contains invalid characters',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
};

/**
 * Validate and sanitize address
 */
export const validateAddress = (address: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(address);

  if (!sanitized || sanitized.length < 5) {
    return {
      isValid: false,
      sanitized,
      error: 'Address must be at least 5 characters long',
    };
  }

  if (sanitized.length > 500) {
    return {
      isValid: false,
      sanitized,
      error: 'Address is too long (maximum 500 characters)',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
};

/**
 * Validate order notes
 */
export const validateNotes = (notes: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(notes);

  if (sanitized.length > 1000) {
    return {
      isValid: false,
      sanitized,
      error: 'Notes are too long (maximum 1000 characters)',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
};

/**
 * Check if input contains potential XSS
 */
export const containsXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Check if input contains SQL injection attempts
 */
export const containsSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\bor\b|\band\b).*[=<>]/i,
    /union.*select/i,
    /insert.*into/i,
    /delete.*from/i,
    /drop.*table/i,
    /update.*set/i,
    /exec(\s|\()/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
};
