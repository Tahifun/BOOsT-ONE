// services/tokenService.ts
import jwt from "jsonwebtoken";

type JWTPayload = Record<string, any>;

export default class TokenService {
  private readonly accessTokenExpiry = "15m";
  private readonly refreshTokenExpiry = "7d";

  constructor(private readonly secret = process.env.JWT_SECRET || "dev-secret") {}

  issueAccessToken(payload: JWTPayload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.accessTokenExpiry });
  }

  issueRefreshToken(payload: JWTPayload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.refreshTokenExpiry });
  }

  verify(token: string) {
    return jwt.verify(token, this.secret) as JWTPayload;
  }
}
