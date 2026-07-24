import { PasswordUtil } from '../src/utils/password.util.js';

async function testPasswordHashing(): Promise<void> {
  const rawPassword = 'SuperSecurePassword123!';

  console.log('--- TESTING BCRYPT PASSWORD HASHING ---');
  console.log('Plaintext Password:', rawPassword);

  const hash = await PasswordUtil.hashPassword(rawPassword);
  console.log('Generated Bcrypt Hash:', hash);
  console.log('Hash Length:', hash.length);

  const isMatchCorrect = await PasswordUtil.comparePassword(rawPassword, hash);
  console.log('Comparison with CORRECT password:', isMatchCorrect);

  const isMatchWrong = await PasswordUtil.comparePassword('WrongPassword123!', hash);
  console.log('Comparison with WRONG password:', isMatchWrong);
}

testPasswordHashing().catch(console.error);
