import jwt from 'jsonwebtoken';

export function generateApprovalToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '10m' });
}
