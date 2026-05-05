export default async function handler(req, res) {
  const backendOrigin = process.env.BACKEND_ORIGIN;

  if (!backendOrigin) {
    return res.status(500).json({
      message:
        'BACKEND_ORIGIN is not set in Vercel environment variables (expected e.g. https://hospital-management-system-nc71.onrender.com)'
    });
  }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const path = pathParts.join('/');

  const queryIndex = req.url.indexOf('?');
  const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : '';

  const targetBase = backendOrigin.replace(/\/$/, '');
  const targetUrl = `${targetBase}/api/${path}${queryString}`;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];

  const init = {
    method: req.method,
    headers
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    init.body = Buffer.concat(chunks);
  }

  try {
    const upstream = await fetch(targetUrl, init);

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'transfer-encoding' || lower === 'content-encoding') return;
      res.setHeader(key, value);
    });

    const arrayBuffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(502).json({ message: 'Upstream request failed', error: String(error) });
  }
}
