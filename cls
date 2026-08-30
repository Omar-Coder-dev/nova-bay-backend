[33mcommit 78bdc3d96a245bedf04aabc1045b93afd9356fb1[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m)[m
Author: Omar Hafez <omarhafezhassan3@gmail.com>
Date:   Sun Aug 30 04:00:20 2026 +0300

    proxy solved

[1mdiff --git a/src/server.ts b/src/server.ts[m
[1mindex b3c17cf..0b7c549 100644[m
[1m--- a/src/server.ts[m
[1m+++ b/src/server.ts[m
[36m@@ -19,13 +19,19 @@[m [mconnectDB();[m
 [m
 const app: Express = express();[m
 [m
[32m+[m[32m// Railway (and most cloud hosts) sit behind a reverse proxy and add[m
[32m+[m[32m// an X-Forwarded-For header with the real client IP. Express doesn't[m
[32m+[m[32m// trust that header by default, which made express-rate-limit throw[m
[32m+[m[32m// and hang requests using authLimiter (forgot-password, login, etc).[m
[32m+[m[32m// This tells Express to trust the first proxy hop, so rate limiting[m
[32m+[m[32m// can correctly read the real client IP.[m
[32m+[m[32mapp.set("trust proxy", 1);[m
[32m+[m
 app.use(morgan('dev'));[m
 [m
 // Webhook needs raw body for Stripe signature verification (BEFORE express.json)[m
 app.use("/api/webhook", webhookRoutes);[m
 [m
[31m-// credentials: true lets the browser send/receive cookies cross-origin.[m
[31m-// origin MUST be an exact URL (not "*") for credentials to work.[m
 app.use(cors({[m
   origin: process.env.CLIENT_URL,[m
   credentials: true,[m
