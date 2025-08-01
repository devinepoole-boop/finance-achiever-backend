import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./simple-storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_ENVIRONMENT === 'production';
  
  // Use PostgreSQL for session storage in all environments
  const PgSession = connectPgSimple(session);
  const sessionStore = new PgSession({
    pool: pool as any, // TypeScript workaround for Neon Pool compatibility
    tableName: 'sessions', // Will be created automatically
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    errorLog: (error: Error) => {
      console.error('Session store error:', error.message);
    },
  });
  
  return session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'finlearn-dev-secret-2024-secure-key',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: 'finlearn.sid',
    cookie: {
      httpOnly: true,
      secure: isProduction, 
      maxAge: sessionTtl,
      sameSite: 'lax',
      domain: isProduction ? '.financeachiever.net' : undefined,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  try {
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
    console.log("User upserted successfully:", claims["sub"]);
  } catch (error) {
    console.error("User upsert failed, continuing with session-only auth:", error);
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  try {
    const config = await getOidcConfig();
    console.log("✅ Authentication system initialized");

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      try {
        const user = {};
        updateUserSession(user, tokens);
        await upsertUser(tokens.claims());
        verified(null, user);
      } catch (error) {
        console.error("Error in auth verify:", error);
        verified(error);
      }
    };

    // Register strategies for Replit domains and also for the custom domain
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const allDomains = [...domains, "financeachiever.net"];
    
    for (const domain of allDomains) {
      try {
        const strategy = new Strategy(
          {
            name: `replitauth:${domain}`,
            config,
            scope: "openid email profile offline_access",
            callbackURL: `https://${domain}/api/callback`,
          },
          verify,
        );
        passport.use(strategy);
      } catch (strategyError) {
        console.error(`Failed to register strategy for ${domain}:`, strategyError);
      }
    }
    
  } catch (configError) {
    console.error("Failed to setup authentication:", configError);
    throw configError;
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", async (req, res, next) => {
    // Temporary workaround for custom domain - redirect to platform
    if (req.hostname === 'financeachiever.net') {
      return res.redirect('/');
    }
    
    try {
      // Use authentication for Replit domains
      const strategyName = `replitauth:${req.hostname}`;
      
      // Check if strategy exists
      const strategy = (passport as any)._strategy(strategyName);
      
      if (!strategy) {
        return res.status(500).json({ 
          message: `Authentication not configured for domain: ${req.hostname}`,
          availableDomains: process.env.REPLIT_DOMAINS?.split(",") || []
        });
      }
      
      passport.authenticate(strategyName, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Authentication error", error: errorMessage });
    }
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "https://financeachiever.net/",
      failureRedirect: "/api/login",
      failureFlash: false,
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res) => {
    req.logout(() => {
      // Get config for logout URL
      getOidcConfig().then(config => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      }).catch(() => {
        // Fallback logout - just redirect to home
        res.redirect('/');
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};