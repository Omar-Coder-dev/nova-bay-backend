import { OAuth2Client } from "google-auth-library";

// This client is used to VERIFY tokens Google sends us - not to log in
// ourselves. The frontend talks to Google directly; our backend's only
// job is confirming a token it receives really came from Google.
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default googleClient;