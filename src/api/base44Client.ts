import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Use the SDK's hosted API endpoint rather than the frontend's own origin.
export const base44 = createClient({
  appId: appId!,
  token: token || undefined,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl
});
