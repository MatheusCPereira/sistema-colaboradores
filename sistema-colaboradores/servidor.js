/**
 * servidor.js - Sistema de Colaboradores QLP IPAUSSU
 * Servidor HTTP puro Node.js (zero dependencias externas)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
};

const sessions = new Map();

function createSession(user) {
  const id = crypto.randomBytes(32).toString('hex');
  sessions.set(id, { user, expires: Date.now() + SESSION_MAX_AGE });
  return id;
}

function getSession(id) {
  if (!id) return null;
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() > s.expires) { sessions.delete(id); return null; }
  s.expires = Date.now() + SESSION_MAX_AGE;
  return s;
}

function destroySession(id) { sessions.delete(id); }

setInterval(() => {
  for (const [k, v] of sessions) {
    if (Date.now() > v.expires) sessions.delete(k);
  }
}, 60 * 60 * 1000);

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(v.join('='));
  });
  return cookies;
}

function setCookie(res, name, value, opts) {
  opts = opts || {};
  let cookie = name + '=' + encodeURIComponent(value) + '; Path=/; HttpOnly';
  if (opts.maxAge) cookie += '; Max-Age=' + Math.floor(opts.maxAge / 1000);
  if (opts.delete) cookie = name + '=; Path=/; HttpOnly; Max-Age=0';
  res.setHeader('Set-Cookie', cookie);
}

function pyCall(action, params) {
  params = params || {};
  const payload = JSON.stringify(Object.assign({ action: action }, params));
  const dbPath  = path.join(__dirname, 'db.py');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

  var result = spawnSync(pythonCmd, [dbPath], {
    input: payload,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    timeout: 30000
  });

  if (result.error) {
    console.error('pyCall error:', result.error.message);
    return { error: 'Erro ao chamar Python: ' + result.error.message };
  }

  var stderr = result.stderr ? result.stderr.trim() : '';
  var stdout = result.stdout ? result.stdout.trim() : '';

  if (result.status !== 0) {
    console.error('pyCall stderr:', stderr);
    return { error: 'Erro Python: ' + (stderr.split('\n').pop() || 'desconhecido') };
  }

  if (!stdout) {
    console.error('pyCall: saida vazia. stderr:', stderr);
    return { error: 'Python nao retornou dados' };
  }

  try {
    return JSON.parse(stdout);
  } catch(e) {
    console.error('pyCall JSON parse error:', e.message, 'stdout:', stdout.substring(0, 200));
    return { error: 'Erro ao processar resposta do Python' };
  }
}

function readBody(req) {
  return new Promise(function(resolve, reject) {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch(e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status) {
  status = status || 200;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function redirect(res, url) {
  res.writeHead(302, { Location: url });
  res.end();
}

function serveFile(res, filePath) {
  var ext = path.extname(filePath);
  var mime = MIME[ext] || 'application/octet-stream';
  try {
    var content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch(e) {
    res.writeHead(404);
    res.end('Not found');
  }
}

var server = http.createServer(function(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  var url      = new URL(req.url, 'http://localhost:' + PORT);
  var pathname = url.pathname;
  var method   = req.method;
  var cookies  = parseCookies(req);
  var session  = getSession(cookies['sid']);
  var user     = session ? session.user : null;

  if (method === 'GET' && !pathname.startsWith('/api/')) {
    var protectedPages = ['/dashboard.html', '/colaboradores.html', '/cadastro.html', '/usuarios.html'];
    var adminPages     = ['/usuarios.html'];

    if (pathname === '/' || pathname === '') {
      return redirect(res, user ? '/dashboard.html' : '/login.html');
    }

    if (protectedPages.indexOf(pathname) !== -1) {
      if (!user) return redirect(res, '/login.html');
      if (adminPages.indexOf(pathname) !== -1 && user.role !== 'admin') return redirect(res, '/dashboard.html');
    }

    var filePath = path.join(PUBLIC, pathname === '/' ? 'login.html' : pathname);
    return serveFile(res, filePath);
  }

  readBody(req).then(function(body) {

    if (pathname === '/api/auth/login' && method === 'POST') {
      var username = body.username;
      var password = body.password;
      if (!username || !password) return json(res, { error: 'Usuario e senha obrigatorios' }, 400);
      var result = pyCall('login', { username: username, password: password });
      if (result.ok) {
        var sid = createSession(result.user);
        setCookie(res, 'sid', sid, { maxAge: SESSION_MAX_AGE });
        return json(res, { success: true, user: result.user });
      }
      return json(res, { error: result.error || 'Credenciais invalidas' }, 401);
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      if (cookies['sid']) { destroySession(cookies['sid']); setCookie(res, 'sid', '', { delete: true }); }
      return json(res, { success: true });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      if (!user) return json(res, { error: 'Nao autorizado' }, 401);
      return json(res, user);
    }

    if (!user) return json(res, { error: 'Nao autorizado - faca login' }, 401);

    if (pathname === '/api/colaboradores' && method === 'GET') {
      var p = url.searchParams;
      var result = pyCall('get_colaboradores', {
        search: p.get('search') || '',
        status: p.get('status') || '',
        page:   parseInt(p.get('page')  || '1'),
        limit:  parseInt(p.get('limit') || '25'),
      });
      return json(res, result.error ? { error: result.error } : result, result.error ? 500 : 200);
    }

    if (pathname === '/api/colaboradores' && method === 'POST') {
      if (user.role === 'viewer') return json(res, { error: 'Sem permissao para cadastrar' }, 403);
      var result = pyCall('create_colaborador', { data: body });
      return json(res, result, result.error ? 500 : 201);
    }

    var matchColabId = pathname.match(/^\/api\/colaboradores\/(\d+)$/);
    if (matchColabId) {
      var id = matchColabId[1];
      if (method === 'GET') {
        var result = pyCall('get_colaborador', { id: id });
        return json(res, result, result.error ? 404 : 200);
      }
      if (method === 'PUT') {
        if (user.role === 'viewer') return json(res, { error: 'Sem permissao para editar' }, 403);
        var result = pyCall('update_colaborador', { id: id, data: body });
        return json(res, result, result.error ? 404 : 200);
      }
      if (method === 'DELETE') {
        if (user.role !== 'admin') return json(res, { error: 'Somente administradores podem excluir' }, 403);
        var result = pyCall('delete_colaborador', { id: id });
        return json(res, result.error ? { error: result.error } : { success: true });
      }
    }

    if (pathname === '/api/estatisticas' && method === 'GET') {
      return json(res, pyCall('get_estatisticas'));
    }

    if (pathname.startsWith('/api/usuarios')) {
      if (user.role !== 'admin') return json(res, { error: 'Acesso restrito a administradores' }, 403);

      if (pathname === '/api/usuarios' && method === 'GET') {
        return json(res, pyCall('get_users'));
      }
      if (pathname === '/api/usuarios' && method === 'POST') {
        var result = pyCall('create_user', { data: body });
        return json(res, result, result.error ? 400 : 201);
      }

      var matchUserId = pathname.match(/^\/api\/usuarios\/(.+)$/);
      if (matchUserId) {
        var uid = matchUserId[1];
        if (method === 'PUT') {
          var result = pyCall('update_user', { id: uid, data: body });
          return json(res, result, result.error ? 404 : 200);
        }
        if (method === 'DELETE') {
          if (uid === user.id) return json(res, { error: 'Nao pode excluir a si mesmo' }, 400);
          var result = pyCall('delete_user', { id: uid });
          return json(res, result.error ? { error: result.error } : { success: true });
        }
      }
    }

    json(res, { error: 'Rota nao encontrada' }, 404);

  }).catch(function(err) {
    json(res, { error: 'Erro interno: ' + err.message }, 500);
  });
});

server.listen(PORT, function() {
  console.log('');
  console.log('  ================================================');
  console.log('   Sistema de Colaboradores QLP - IPAUSSU 2026');
  console.log('  ================================================');
  console.log('');
  console.log('  Acesse:  http://localhost:' + PORT);
  console.log('  Login:   admin  /  Senha: admin123');
  console.log('');
  console.log('  Para encerrar: feche esta janela');
  console.log('');
});