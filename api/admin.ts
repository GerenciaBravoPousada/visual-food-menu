import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const COOKIE = 'visual_food_admin';
const SESSION_DAYS = 30;

type Role = 'master' | 'admin_empresa' | 'editor' | 'visualizador';

type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  company_id: string | null;
  exp: number;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

function optionalEnv(name: string) {
  return process.env[name] || '';
}

function supabaseAdmin() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sessionSecret() {
  return optionalEnv('ADMIN_SESSION_SECRET') || getEnv('SUPABASE_SERVICE_ROLE_KEY');
}

function parseCookies(req: VercelRequest) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(
    raw
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=');
        return [decodeURIComponent(p.slice(0, i)), decodeURIComponent(p.slice(i + 1))];
      })
  );
}

function jsonBody(req: VercelRequest) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return req.body || {};
}

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string) {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function createSession(payload: Omit<SessionPayload, 'exp'>) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const body = b64url(JSON.stringify({ ...payload, exp }));
  return `${body}.${sign(body)}`;
}

function readSession(req: VercelRequest): SessionPayload | null {
  const token = parseCookies(req)[COOKIE];
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (sign(body) !== sig) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function setSessionCookie(res: VercelResponse, token: string) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`
  );
}

function clearSessionCookie(res: VercelResponse) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, hash: string) {
  const candidate = hashPassword(password, salt).hash;
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function requireAuth(req: VercelRequest) {
  const session = readSession(req);
  if (!session) {
    const err: any = new Error('Não autenticado');
    err.status = 401;
    throw err;
  }
  return session;
}

function requireMaster(req: VercelRequest) {
  const session = requireAuth(req);
  if (session.role !== 'master') {
    const err: any = new Error('Acesso permitido apenas ao usuário master');
    err.status = 403;
    throw err;
  }
  return session;
}

function requireCompanyAccess(req: VercelRequest, companyId?: string | null) {
  const session = requireAuth(req);
  if (session.role === 'master') return session;
  if (companyId && session.company_id && companyId !== session.company_id) {
    const err: any = new Error('Usuário não tem acesso a esta empresa');
    err.status = 403;
    throw err;
  }
  return session;
}

async function ensureMasterUser(db: ReturnType<typeof supabaseAdmin>) {
  const email = normalizeEmail(getEnv('ADMIN_MASTER_EMAIL'));
  const password = getEnv('ADMIN_MASTER_PASSWORD');

  const { data: existing, error: findErr } = await db
    .from('app_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (findErr) throw findErr;
  if (existing) return existing;

  const { salt, hash } = hashPassword(password);
  const { data, error } = await db
    .from('app_users')
    .insert({
      name: 'Jean Ballan',
      email,
      role: 'master',
      company_id: null,
      password_salt: salt,
      password_hash: hash,
      active: true,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

function cleanCompanyPayload(body: any) {
  return {
    id: body.id || undefined,
    fantasy_name: body.fantasy_name || body.name || null,
    legal_name: body.legal_name || null,
    cnpj: body.cnpj || null,
    address: body.address || null,
    email: body.email || null,
    phone: body.phone || null,
    logo_url: body.logo_url || null,
    instagram: body.instagram || null,
    site: body.site || body.url || null,
    is_primary: Boolean(body.is_primary),
    active: body.active !== false,
    sort_order: Number(body.sort_order ?? 0),
  };
}

function safeUser(row: any) {
  if (!row) return row;
  const { password_hash, password_salt, ...safe } = row;
  return safe;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const action = String(req.query.action || '');
    const db = supabaseAdmin();

    if (action === 'adminCheck') {
      const session = readSession(req);
      return res.status(200).json({ authed: Boolean(session), user: session });
    }

    if (action === 'adminLogin') {
      await ensureMasterUser(db);
      const body = jsonBody(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');

      const { data: user, error } = await db
        .from('app_users')
        .select('*')
        .eq('email', email)
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
        return res.status(200).json({ ok: false, error: 'E-mail ou senha inválidos' });
      }

      const token = createSession({
        userId: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id || null,
      });

      setSessionCookie(res, token);
      await db.from('app_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
      return res.status(200).json({ ok: true, user: safeUser(user) });
    }

    if (action === 'adminLogout') {
      clearSessionCookie(res);
      return res.status(200).json({ ok: true });
    }

    const session = requireAuth(req);
    const body = req.method === 'GET' ? {} : jsonBody(req);

    if (action === 'me') return res.status(200).json({ user: session });

    if (action === 'listCompaniesAdmin') {
      let query = db.from('companies').select('*').order('sort_order');
      if (session.role !== 'master' && session.company_id) query = query.eq('id', session.company_id);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    if (action === 'upsertCompany') {
      requireMaster(req);
      const payload = cleanCompanyPayload(body);
      if (payload.is_primary) {
        await db.from('companies').update({ is_primary: false }).neq('id', payload.id ?? '00000000-0000-0000-0000-000000000000');
      }
      const { data, error } = await db.from('companies').upsert(payload).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (action === 'deleteCompany') {
      requireMaster(req);
      const { error } = await db.from('companies').delete().eq('id', body.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'listUsersAdmin') {
      requireMaster(req);
      const { data, error } = await db
        .from('app_users')
        .select('id, name, email, role, company_id, active, created_at, updated_at, last_login_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    if (action === 'createUser') {
      requireMaster(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '').trim();
      if (!email || !password) throw new Error('Informe e-mail e senha');
      const { salt, hash } = hashPassword(password);
      const { data, error } = await db
        .from('app_users')
        .insert({
          name: body.name || null,
          email,
          role: body.role || 'visualizador',
          company_id: body.company_id || null,
          password_salt: salt,
          password_hash: hash,
          active: body.active !== false,
        })
        .select('id, name, email, role, company_id, active, created_at, updated_at, last_login_at')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (action === 'updateUser') {
      requireMaster(req);
      const payload: any = {
        name: body.name || null,
        email: normalizeEmail(body.email),
        role: body.role || 'visualizador',
        company_id: body.company_id || null,
        active: body.active !== false,
      };
      const { data, error } = await db
        .from('app_users')
        .update(payload)
        .eq('id', body.id)
        .select('id, name, email, role, company_id, active, created_at, updated_at, last_login_at')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (action === 'resetUserPassword') {
      requireMaster(req);
      const password = String(body.password || '').trim();
      if (!password) throw new Error('Informe a nova senha');
      const { salt, hash } = hashPassword(password);
      const { error } = await db
        .from('app_users')
        .update({ password_salt: salt, password_hash: hash })
        .eq('id', body.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'deleteUser') {
      requireMaster(req);
      const { error } = await db.from('app_users').delete().eq('id', body.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    const tableActions: Record<string, { table: string; mode: 'upsert' | 'delete' }> = {
      upsertProduct: { table: 'products', mode: 'upsert' },
      deleteProduct: { table: 'products', mode: 'delete' },
      upsertCategory: { table: 'categories', mode: 'upsert' },
      deleteCategory: { table: 'categories', mode: 'delete' },
      upsertMarker: { table: 'markers', mode: 'upsert' },
      deleteMarker: { table: 'markers', mode: 'delete' },
      deleteAdditional: { table: 'additionals', mode: 'delete' },
    };

    if (action === 'upsertProduct') {
      requireCompanyAccess(req, body.company_id || null);
      const { marker_ids = [], ...productData } = body;
      const { data: row, error } = await db.from('products').upsert(productData).select().single();
      if (error) throw error;
      await db.from('product_markers').delete().eq('product_id', row.id);
      if (marker_ids.length) {
        const rows = marker_ids.map((marker_id: string) => ({ product_id: row.id, marker_id }));
        const { error: linkErr } = await db.from('product_markers').insert(rows);
        if (linkErr) throw linkErr;
      }
      return res.status(200).json(row);
    }

    if (action === 'upsertAdditional') {
      requireCompanyAccess(req, body.company_id || null);
      const { product_ids = [], ...additionalData } = body;
      const { data: row, error } = await db.from('additionals').upsert(additionalData).select().single();
      if (error) throw error;
      await db.from('product_additionals').delete().eq('additional_id', row.id);
      if (product_ids.length) {
        const rows = product_ids.map((product_id: string) => ({ additional_id: row.id, product_id }));
        const { error: linkErr } = await db.from('product_additionals').insert(rows);
        if (linkErr) throw linkErr;
      }
      return res.status(200).json(row);
    }

    if (action === 'updateTheme') {
      const { data: existing } = await db.from('theme_settings').select('id').limit(1).maybeSingle();
      const q = existing ? db.from('theme_settings').update(body).eq('id', existing.id) : db.from('theme_settings').insert(body);
      const { error } = await q;
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'uploadProductImage') {
      const bytes = Buffer.from(body.base64, 'base64');
      const folder = body.folder ?? 'menu';
      const safe = String(body.fileName || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${folder}/${Date.now()}-${safe}`;
      const { error } = await db.storage.from('product-images').upload(path, bytes, { contentType: body.contentType, upsert: false });
      if (error) throw error;
      const { data } = db.storage.from('product-images').getPublicUrl(path);
      return res.status(200).json({ url: data.publicUrl });
    }

    const config = tableActions[action];
    if (config?.mode === 'delete') {
      const { error } = await db.from(config.table).delete().eq('id', body.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    if (config?.mode === 'upsert') {
      const { data, error } = await db.from(config.table).upsert(body).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(404).json({ error: 'Ação não encontrada' });
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Erro interno' });
  }
}
