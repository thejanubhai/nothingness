import { Knock } from '@knocklabs/node';

const apiKey = process.env.KNOCK_SECRET_API_KEY;

if (!apiKey) {
  console.warn("Knock API key is missing. Notifications will fail.");
}

export const knock = new Knock(apiKey ? { apiKey } : { apiKey: 'missing_key' });
