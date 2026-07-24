import { PasswordUtil } from '../../utils/password.util.js';

describe('PasswordUtil Unit Tests', () => {
  it('should hash a password and return a 60-character bcrypt string', async () => {
    const rawPassword = 'MySecretPassword123!';
    const hash = await PasswordUtil.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(60);
    expect(hash.startsWith('$2b$10$')).toBe(true);
  });

  it('should verify correct password match as true', async () => {
    const rawPassword = 'MySecretPassword123!';
    const hash = await PasswordUtil.hashPassword(rawPassword);

    const isMatch = await PasswordUtil.comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);
  });

  it('should reject incorrect password as false', async () => {
    const rawPassword = 'MySecretPassword123!';
    const hash = await PasswordUtil.hashPassword(rawPassword);

    const isMatch = await PasswordUtil.comparePassword('WrongPassword!', hash);
    expect(isMatch).toBe(false);
  });
});
