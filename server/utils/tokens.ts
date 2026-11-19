import { randomBytes } from 'node:crypto'

export function generateToken(length = 10): string {
  return randomBytes(length)
    .toString('base64url')
    .slice(0, length)
}
