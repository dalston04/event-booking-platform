import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export class PasswordUtil {
  /**
   * Hashes a plaintext password using bcrypt with salt rounds = 10
   * @param password Plaintext user password
   * @returns Promise resolving to the 60-character bcrypt hash
   */
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a candidate plaintext password against a stored bcrypt hash in constant time
   * @param candidatePassword Plaintext password supplied during login attempt
   * @param hashedPassword Stored 60-character bcrypt hash from database
   * @returns Promise resolving to true if matched, false otherwise
   */
  public static async comparePassword(
    candidatePassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
}
