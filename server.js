const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT_DIR = __dirname;
const DEFAULT_PORT = 4173;

loadEnvFile(path.join(ROOT_DIR, '.env'));

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const freezerTokens = {
    paulista: process.env.STOCK_TOKEN_PAULISTA || process.env.STOCK_API_TOKEN || process.env.STOCK_API_TOK || process.env.STOCK_TOKENS,
    barueri: process.env.STOCK_TOKEN_BARUERI || process.env.STOCK_API_TOKEN || process.env.STOCK_API_TOK || process.env.STOCK_TOKENS,
    centro: process.env.STOCK_TOKEN_CENTRO || process.env.STOCK_API_TOKEN || process.env.STOCK_API_TOK || process.env.STOCK_TOKENS
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
        const handled = await handleApi(req, res, url);
        if (handled) return;
        return sendJson(res, 404, { error: 'Not found' });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Method not allowed');
    }

    serveStaticFile(url.pathname, res);
});

const port = Number(process.env.PORT || DEFAULT_PORT);
server.listen(port, () => {
    console.log(`RapChef local server running at http://localhost:${port}`);
});

function loadEnvFile(envPath) {
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) return;
            const key = trimmed.slice(0, eqIndex).trim();
            const rawValue = trimmed.slice(eqIndex + 1).trim();
            const value = rawValue.replace(/^['"]|['"]$/g, '');
            if (key && process.env[key] === undefined) {
                process.env[key] = value;
            }
        });
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn('Unable to read .env file:', err.message);
        }
    }
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
}

async function handleApi(req, res, url) {
    if (url.pathname === '/api/deposits') {
        return await handleDeposits(req, res, url);
    }

    if (url.pathname !== '/api/stock') {
        return false;
    }
    if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return true;
    }

    const freezer = url.searchParams.get('freezer') || 'paulista';
    const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const token = (freezerTokens[freezer] || process.env.STOCK_API_TOKEN || process.env.STOCK_API_TOK || process.env.STOCK_TOKENS || '').trim();
    const baseUrlRaw = (process.env.STOCK_API_BASE_URL || '').trim();
    const baseUrlClean = baseUrlRaw.replace(/\/+$/, '');
    const basicUser = process.env.STOCK_BASIC_USER || process.env.STOCK_BASIC_USERNAME || '';
    const basicPass = process.env.STOCK_BASIC_PASS || process.env.STOCK_BASIC_PASSWORD || '';

    if (!baseUrlClean) {
        sendJson(res, 500, { error: 'STOCK_API_BASE_URL is not configured' });
        return true;
    }
    if (!token) {
        sendJson(res, 400, { error: 'No token configured for this freezer' });
        return true;
    }

    let upstreamUrl;
    // If user provides a full endpoint (already includes path or query), normalize it and override query params.
    try {
        const maybeUrl = new URL(baseUrlRaw);
        // If it already points to products/stock or has query params, treat as full URL.
        if (maybeUrl.search || maybeUrl.pathname.includes('products/stock')) {
            maybeUrl.searchParams.set('tokens', token);
            maybeUrl.searchParams.set('dataFinal', date);
            upstreamUrl = maybeUrl.toString();
        }
    } catch (err) {
        // baseUrlRaw might be missing protocol; fall back to manual build below.
    }

    if (!upstreamUrl) {
        upstreamUrl = `${baseUrlClean}/products/stock?tokens=${encodeURIComponent(token)}&dataFinal=${encodeURIComponent(date)}`;
    }

    try {
        const headers = { Accept: 'application/json' };
        if (basicUser || basicPass) {
            const auth = Buffer.from(`${basicUser}:${basicPass}`).toString('base64');
            headers.Authorization = `Basic ${auth}`;
        }

        const upstream = await fetch(upstreamUrl, { headers });
        const text = await upstream.text();

        let body;
        try {
            body = JSON.parse(text);
        } catch (err) {
            console.error('Invalid JSON from upstream:', err.message);
            sendJson(res, 502, { error: 'Invalid JSON from upstream' });
            return true;
        }

        if (!upstream.ok) {
            console.error('Upstream error', upstream.status, body && body.error ? body.error : body);
            sendJson(res, upstream.status, { error: 'Upstream error', status: upstream.status, details: body });
            return true;
        }

        sendJson(res, 200, {
            data: body,
            meta: {
                freezer,
                date,
                fetchedAt: new Date().toISOString()
            }
        });
        return true;
    } catch (err) {
        let safeUrl = upstreamUrl;
        try {
            const u = new URL(upstreamUrl);
            if (u.searchParams.has('tokens')) {
                u.searchParams.set('tokens', '***');
            }
            safeUrl = u.toString();
        } catch (_) {
            // ignore
        }

        console.error('Failed to fetch stock data:', err.message, 'URL:', safeUrl);
        sendJson(res, 502, { error: 'Failed to reach stock service', details: err.message });
        return true;
    }
}

function serveStaticFile(requestPath, res) {
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(ROOT_DIR, safePath);
    if (filePath.endsWith(path.sep)) {
        filePath = path.join(filePath, 'index.html');
    }
    if (!path.extname(filePath)) {
        filePath += '.html';
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Not found');
        }

        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': mime,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Internal server error');
        });
    });
}

async function handleDeposits(req, res, url) {
    if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return true;
    }

    const token = (process.env.STOCK_API_TOKEN || process.env.STOCK_API_TOK || process.env.STOCK_TOKENS || '').trim();
    const baseUrlRaw = (process.env.STOCK_API_BASE_URL || '').trim();
    const baseUrlClean = baseUrlRaw.replace(/\/+$/, '');
    const basicUser = process.env.STOCK_BASIC_USER || process.env.STOCK_BASIC_USERNAME || '';
    const basicPass = process.env.STOCK_BASIC_PASS || process.env.STOCK_BASIC_PASSWORD || '';

    if (!baseUrlClean) {
        sendJson(res, 500, { error: 'STOCK_API_BASE_URL is not configured' });
        return true;
    }
    if (!token) {
        sendJson(res, 400, { error: 'No token configured' });
        return true;
    }

    let upstreamUrl;
    try {
        const maybeUrl = new URL(baseUrlRaw);
        // Normalize path to deposits
        if (maybeUrl.pathname.includes('/products/stock')) {
            maybeUrl.pathname = maybeUrl.pathname.replace(/\/products\/stock\/?$/, '/deposits');
        } else {
            maybeUrl.pathname = maybeUrl.pathname.replace(/\/$/, '') + '/deposits';
        }
        maybeUrl.search = '';
        maybeUrl.searchParams.set('tokens', token);
        upstreamUrl = maybeUrl.toString();
    } catch (err) {
        upstreamUrl = `${baseUrlClean}/deposits?tokens=${encodeURIComponent(token)}`;
    }

    try {
        const headers = { Accept: 'application/json' };
        if (basicUser || basicPass) {
            const auth = Buffer.from(`${basicUser}:${basicPass}`).toString('base64');
            headers.Authorization = `Basic ${auth}`;
        }

        const upstream = await fetch(upstreamUrl, { headers });
        const text = await upstream.text();

        let body;
        try {
            body = JSON.parse(text);
        } catch (err) {
            console.error('Invalid JSON from upstream (deposits):', err.message);
            sendJson(res, 502, { error: 'Invalid JSON from upstream' });
            return true;
        }

        if (!upstream.ok) {
            console.error('Upstream error (deposits)', upstream.status, body && body.error ? body.error : body);
            sendJson(res, upstream.status, { error: 'Upstream error', status: upstream.status, details: body });
            return true;
        }

        sendJson(res, 200, {
            data: body,
            meta: {
                fetchedAt: new Date().toISOString()
            }
        });
        return true;
    } catch (err) {
        let safeUrl = upstreamUrl;
        try {
            const u = new URL(upstreamUrl);
            if (u.searchParams.has('tokens')) u.searchParams.set('tokens', '***');
            safeUrl = u.toString();
        } catch (_) {}
        console.error('Failed to fetch deposits:', err.message, 'URL:', safeUrl);
        sendJson(res, 502, { error: 'Failed to reach deposits service', details: err.message });
        return true;
    }
}
