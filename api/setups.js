// API de la bibliothèque partagée : GET (liste ou ?id=&v=), POST (nouvelle version), DELETE ?id=. Protégée par middleware.js.
// Stockage : Vercel Blob privé relié au projet (BLOB_READ_WRITE_TOKEN ou OIDC, ajoutés par Vercel). Logique : api/_lib/setups-store.js
import { put, list, get } from '@vercel/blob';
import { setupsHandler } from './_lib/setups-store.js';

const handle = setupsHandler({ put, list, get });
export const GET = handle, POST = handle, DELETE = handle;
