import { GoogleAuth } from 'google-auth-library';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let cachedAuth: GoogleAuth | null = null;

function resolveCredentialsPath(): string | null {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath) {
    const fullPath = path.isAbsolute(envPath)
      ? envPath
      : path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) return fullPath;

    // Check relative to server directory if cwd was root
    const serverPath = path.resolve(process.cwd(), 'server', envPath);
    if (fs.existsSync(serverPath)) return serverPath;
  }

  // Check default credentials.json in server root
  const defaultServerKey = path.resolve(process.cwd(), 'credentials.json');
  if (fs.existsSync(defaultServerKey)) return defaultServerKey;

  const serverSubKey = path.resolve(process.cwd(), 'server', 'credentials.json');
  if (fs.existsSync(serverSubKey)) return serverSubKey;

  // Check standard gcloud application_default_credentials.json
  const homedir = os.homedir();
  const adcStandard = path.join(homedir, '.config', 'gcloud', 'application_default_credentials.json');
  if (fs.existsSync(adcStandard)) return adcStandard;

  // Check user gcloud legacy credentials directory
  try {
    const gcloudLegacy = path.join(homedir, '.config', 'gcloud', 'legacy_credentials');
    if (fs.existsSync(gcloudLegacy)) {
      const accounts = fs.readdirSync(gcloudLegacy);
      for (const acc of accounts) {
        const candidate = path.join(gcloudLegacy, acc, 'adc.json');
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  } catch {}

  return null;
}

export function getGoogleAuth(): GoogleAuth | null {
  if (cachedAuth) return cachedAuth;

  const credPath = resolveCredentialsPath();
  if (credPath) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    cachedAuth = new GoogleAuth({
      keyFilename: credPath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    return cachedAuth;
  }

  try {
    cachedAuth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    return cachedAuth;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const auth = getGoogleAuth();
  if (!auth) return null;
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token || null;
  } catch (err) {
    return null;
  }
}

export async function getProjectId(): Promise<string | null> {
  if (process.env.GCP_PROJECT_ID) return process.env.GCP_PROJECT_ID;
  const auth = getGoogleAuth();
  if (auth) {
    try {
      const pid = await auth.getProjectId();
      if (pid) return pid;
    } catch {
      // ignore
    }
  }
  return process.env.GOOGLE_CLOUD_PROJECT || 'nzz-sbx-hckthn07';
}

export async function getAuthStatus(): Promise<{
  configured: boolean;
  type: 'adc' | 'api_key' | 'none';
  projectId: string | null;
  location: string;
}> {
  const location = process.env.GCP_LOCATION || 'us-central1';

  // Check ADC
  const token = await getAccessToken();
  const projectId = await getProjectId();

  if (token && projectId) {
    return {
      configured: true,
      type: 'adc',
      projectId,
      location,
    };
  }

  // Check GEMINI_API_KEY
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return {
      configured: true,
      type: 'api_key',
      projectId: projectId || 'gemini-studio',
      location,
    };
  }

  return {
    configured: false,
    type: 'none',
    projectId: null,
    location,
  };
}
