const express = require('express');
const { z } = require('zod');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateAccessToken, generateRefreshToken, protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

// Zod Schemas
const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
  role: z.enum(['Admin', 'HR', 'Viewer']).optional().default('Admin'),
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new company and primary administrative user
 */
router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { fullName, email, password, organizationName, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create or find Organization slug
    let baseSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let slug = baseSlug;
    let count = 1;
    while (await Organization.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const org = await Organization.create({
      name: organizationName,
      slug,
      defaultJurisdiction: 'US-CA',
    });

    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'Admin',
      organizationId: org._id,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        organization: {
          id: org._id,
          name: org.name,
          slug: org.slug,
          defaultJurisdiction: org.defaultJurisdiction,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Log in user & obtain tokens
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('organizationId');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        organization: user.organizationId,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in user profile
 */
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
      organization: req.organization,
    },
  });
});

module.exports = router;
