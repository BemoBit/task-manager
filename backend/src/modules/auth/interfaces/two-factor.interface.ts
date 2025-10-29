export interface TwoFactorSecret {
  secret: string;
  otpAuthUrl: string;
  qrCode: string;
}
