import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

export function distributeEnv(content: string) {
  // Distribute to packages
  const packagesDir = path.join(ROOT_DIR, 'packages');
  if (fs.existsSync(packagesDir)) {
    const packages = fs.readdirSync(packagesDir);
    for (const pkg of packages) {
      const pkgPath = path.join(packagesDir, pkg);
      if (fs.statSync(pkgPath).isDirectory()) {
        const pkgEnvPath = path.join(pkgPath, '.env');
        fs.writeFileSync(pkgEnvPath, content);
      }
    }
  }

  // Distribute to apps
  const appsDir = path.join(ROOT_DIR, 'apps');
  if (fs.existsSync(appsDir)) {
    const apps = fs.readdirSync(appsDir);
    for (const app of apps) {
      const appPath = path.join(appsDir, app);
      if (fs.statSync(appPath).isDirectory()) {
        const appEnvPath = path.join(appPath, '.env.local');
        fs.writeFileSync(appEnvPath, content);
      }
    }
  }
}
