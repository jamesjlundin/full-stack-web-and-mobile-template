import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { distributeEnv } from './env-utils';

const ROOT_DIR = process.cwd();
const ENV_EXAMPLE = path.join(ROOT_DIR, '.env.example');
const ENV_FILE = path.join(ROOT_DIR, '.env');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateHexSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function initEnv() {
  if (!fs.existsSync(ENV_EXAMPLE)) {
    console.error('.env.example not found');
    process.exit(1);
  }

  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  } else {
    envContent = fs.readFileSync(ENV_EXAMPLE, 'utf8');
  }

  const exampleContent = fs.readFileSync(ENV_EXAMPLE, 'utf8');
  const exampleLines = exampleContent.split('\n');
  const currentLines = envContent.split('\n');
  const currentVars = new Map<string, string>();

  for (const line of currentLines) {
    const match = line.match(/^([^#\s][^=]*)=(.*)$/);
    if (match) {
      currentVars.set(match[1].trim(), match[2].trim());
    }
  }

  let updatedContent = '';
  let hasChanges = false;

  for (const line of exampleLines) {
    const match = line.match(/^([^#\s][^=]*)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const defaultValue = match[2].trim();
      let value = currentVars.get(key);

      if (
        key === 'BETTER_AUTH_SECRET' &&
        (!value || value === 'your_secret_key_here_needs_to_be_32_chars' || value === '')
      ) {
        value = generateSecret();
        hasChanges = true;
      } else if (key === 'CRON_SECRET' && (!value || value === '')) {
        value = generateHexSecret();
        hasChanges = true;
      } else if (
        (key === 'UPSTASH_REDIS_REST_URL' || key === 'UPSTASH_REDIS_REST_TOKEN') &&
        (!value || value === '')
      ) {
        value = defaultValue;
        hasChanges = true;
      } else if (value === undefined) {
        value = defaultValue;
        hasChanges = true;
      }

      updatedContent += `${key}=${value}\n`;
    } else {
      updatedContent += `${line}\n`;
    }
  }

  if (hasChanges || !fs.existsSync(ENV_FILE)) {
    fs.writeFileSync(ENV_FILE, updatedContent.trim() + '\n');
    console.log('✅ Updated .env file with generated secrets.');
  }

  const finalContent = fs.readFileSync(ENV_FILE, 'utf8');
  distributeEnv(finalContent);

  console.log('✨ Environment files initialized across the workspace.');
}

initEnv();
