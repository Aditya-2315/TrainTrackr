import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import generateToken from "../utils/generateToken.js";

// ── Register (Client only) ────────────────────────────────────
// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email and password are required.");
    }

    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters.");
    }

    // 2. Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create user + client profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CLIENT",
        status: "ACTIVE",
        clientProfile: {
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // 5. Generate token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ── Register Trainer (invite token required) ──────────────────
// POST /api/auth/trainer/register
export const registerTrainer = async (req, res, next) => {
  try {
    const { name, email, password, token: inviteToken } = req.body;

    // 1. Validate input
    if (!name || !email || !password || !inviteToken) {
      throw new ApiError(
        400,
        "Name, email, password and invite token are required."
      );
    }

    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters.");
    }

    // 2. Validate invite token
    const invitation = await prisma.trainerInvitation.findUnique({
      where: { token: inviteToken },
    });

    if (!invitation) {
      throw new ApiError(400, "Invalid invitation token.");
    }

    if (invitation.used) {
      throw new ApiError(400, "This invitation has already been used.");
    }

    if (invitation.expiresAt < new Date()) {
      throw new ApiError(400, "This invitation has expired.");
    }

    if (invitation.email !== email) {
      throw new ApiError(
        400,
        "This invitation was sent to a different email address."
      );
    }

    // 3. Check email not already taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create trainer user + profile + mark invite as used
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "TRAINER",
          status: "ACTIVE",
          trainerProfile: {
            create: { isApproved: true },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.trainerInvitation.update({
        where: { token: inviteToken },
        data: { used: true },
      }),
    ]);

    // 6. Generate token
    const jwtToken = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: "Trainer account created successfully.",
      token: jwtToken,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────
// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required.");
    }

    // 2. Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        trainerProfile: { select: { isApproved: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(401, "Invalid email or password.");
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password.");
    }

    // 4. Check account status
    if (user.status === "SUSPENDED") {
      throw new ApiError(403, "Your account has been suspended.");
    }

    if (user.status === "PENDING_APPROVAL") {
      throw new ApiError(
        403,
        "Your account is pending approval from the head trainer."
      );
    }

    // 5. Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Google OAuth Callback ─────────────────────────────────────
// GET /api/auth/google/callback
export const googleCallback = (req, res) => {
  // User is attached by passport at this point
  const token = generateToken(req.user.id, req.user.role);

  // In production redirect to frontend with token
  // For now return JSON
  res.json({
    success: true,
    message: "Google login successful.",
    token,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
  });
};

// ── Get Me ────────────────────────────────────────────────────
// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        trainerProfile: true,
        clientProfile: true,
      },
    });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ── Update Me ─────────────────────────────────────────────────
// PATCH /api/auth/me
export const updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Check new email isn't already taken by someone else
    if (email && email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ApiError(409, "This email is already in use.");
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    res.json({ success: true, message: "Profile updated.", user });
  } catch (err) {
    next(err);
  }
};

// ── Change Password ───────────────────────────────────────────
// PATCH /api/auth/me/password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(
        400,
        "Current password and new password are required."
      );
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters.");
    }

    // 1. Get user with password hash
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.passwordHash) {
      throw new ApiError(
        400,
        "This account uses Google login. No password to change."
      );
    }

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, "Current password is incorrect.");
    }

    // 3. Hash and save new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
};

// ── Invite Trainer (Head Trainer only) ───────────────────────
// POST /api/auth/invite-trainer
export const inviteTrainer = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required.");
    }

    // 1. Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "A user with this email already exists.");
    }

    // 2. Check if unused invite already sent
    const existingInvite = await prisma.trainerInvitation.findFirst({
      where: { email, used: false, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) {
      throw new ApiError(
        409,
        "An active invitation has already been sent to this email."
      );
    }

    // 3. Generate token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    // 4. Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.trainerInvitation.create({
      data: {
        email,
        token,
        expiresAt,
        invitedById: req.user.id,
      },
    });

    // TODO: Send email with invite link when email service is added
    // For now return the token directly for testing
    res.status(201).json({
      success: true,
      message: `Invitation created for ${email}.`,
      inviteToken: token, // remove this in production
      inviteLink: `${process.env.FRONTEND_URL || "http://localhost:3000"}/register/trainer?token=${token}`,
    });
  } catch (err) {
    next(err);
  }
};