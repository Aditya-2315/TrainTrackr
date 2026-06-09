import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import prisma from "../config/prisma.js";

// ── Protect ───────────────────────────────────────────────────
// Verifies JWT token and attaches user to req.user
export const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Not authorized. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError(401, "Token expired. Please log in again.");
      }
      throw new ApiError(401, "Invalid token. Please log in again.");
    }

    // 3. Check user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists.");
    }

    if (user.status === "SUSPENDED") {
      throw new ApiError(403, "Your account has been suspended.");
    }

    if (user.status === "PENDING_APPROVAL") {
      throw new ApiError(403, "Your account is pending approval.");
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// ── RestrictTo ────────────────────────────────────────────────
// Restricts route to specific roles
// Usage: restrictTo("HEAD_TRAINER", "TRAINER")
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to perform this action.")
      );
    }
    next();
  };
};