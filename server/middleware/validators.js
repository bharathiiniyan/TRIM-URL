import { body, validationResult } from 'express-validator';

// Middleware to check validation results and return errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return a structured error response
    return res.status(400).json({ errors: errors.array().map(err => ({ field: err.path, message: err.msg })) });
  }
  next();
};

// User Registration Validation Rules
export const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
    .isAlphanumeric().withMessage('Username must contain only letters and numbers'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

// User Login Validation Rules
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// URL Creation Validation Rules
export const validateUrl = [
  body('longUrl')
    .trim()
    .notEmpty().withMessage('Long URL is required')
    .isURL({ require_protocol: true }).withMessage('Please enter a valid URL with HTTP/HTTPS protocol'),
  body('customAlias')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Custom alias must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Custom alias can only contain letters, numbers, underscores, and hyphens'),
  body('expiryDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Expiry date must be a valid ISO8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  handleValidationErrors
];
