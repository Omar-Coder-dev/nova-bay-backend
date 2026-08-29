import jwt, { SignOptions } from 'jsonwebtoken';

// Creates a signed JWT for a given user ID.
// The frontend will store this token and send it back on future requests
// so the server can verify who's making the request without a DB lookup every time.
const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId }, // payload: the data we're encoding inside the token
    process.env.JWT_SECRET as string, // secret used to sign the token (env vars are typed as "string | undefined" by default, so we assert it's a string since we know it's set)
    {
      // expiresIn also comes from .env as a generic string, but jsonwebtoken's types want
      // a more specific format (like "7d"). SignOptions['expiresIn'] grabs the exact type
      // that field expects, so we can safely tell TypeScript "trust this value."
      expiresIn: process.env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    }
  );
};

export default generateToken;