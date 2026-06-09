import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";

const setupGoogleStrategy = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth credentials not set. Skipping Google strategy.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const googleId = profile.id;
          const name = profile.displayName;

          let user = await prisma.user.findUnique({ where: { googleId } });
          if (user) return done(null, user);

          user = await prisma.user.findUnique({ where: { email } });
          if (user) {
            user = await prisma.user.update({
              where: { email },
              data: { googleId },
            });
            return done(null, user);
          }

          user = await prisma.user.create({
            data: {
              name,
              email,
              googleId,
              role: "CLIENT",
              status: "ACTIVE",
              clientProfile: { create: {} },
            },
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
};

setupGoogleStrategy();

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;