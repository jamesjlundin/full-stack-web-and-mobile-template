import fs from 'node:fs';
import path from 'node:path';

import { distributeEnv } from './env-utils';

const ROOT_DIR = process.cwd();
const ENV_FILE = path.join(ROOT_DIR, '.env');

function setEnv() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: pnpm env:set KEY=VALUE [KEY2=VALUE2 ...]');
    process.exit(1);
  }

  if (!fs.existsSync(ENV_FILE)) {
    console.error('.env file not found. Please run pnpm env:init first.');
    process.exit(1);
  }

  let envContent = fs.readFileSync(ENV_FILE, 'utf8');
  let hasChanges = false;

  for (const arg of args) {
    const match = arg.match(/^([^=]+)=(.*)$/);
    if (!match) {
      console.warn(`Skipping invalid argument: ${arg}. Expected KEY=VALUE`);
      continue;
    }

    const key = match[1].trim();
    const value = match[2].trim();

    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // If it's a new variable, add it at the end
      if (!envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `${key}=${value}\n`;
    }
    hasChanges = true;
    console.log(`✅ Set ${key}`);
  }

  if (hasChanges) {
    const finalContent = envContent.trim() + '\n';
    fs.writeFileSync(ENV_FILE, finalContent);
    distributeEnv(finalContent);
    console.log('✨ Environment files updated across the workspace.');
  }
}

setEnv();
