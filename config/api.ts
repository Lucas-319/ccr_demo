export const API_BASE_URL = 'demo://local-memory';

type ApiErrorPayload = {
  message: string;
  status?: number;
  action?: 'login';
  details?: string[];
};

type Shift = 'MORNING' | 'NIGHT';
type Role = 'ADMIN' | 'USER';

type DemoUser = {
  id: string;
  name: string;
  login: string;
  role: Role;
  active: boolean;
  password: string;
};

type DemoChild = {
  id: string;
  name: string;
  responsibleName: string;
  responsibleContact: string;
  allergies?: string;
  createdAt: string;
  updatedAt: string;
};

type DemoAttendance = {
  childId: string;
  date: string;
  shift: Shift;
  present: boolean;
  markedByUserId: string;
  createdAt: string;
  updatedAt: string;
};

type DemoAvailability = {
  userId: string;
  date: string;
  shift: Shift;
};

type DemoDB = {
  users: DemoUser[];
  children: DemoChild[];
  attendances: DemoAttendance[];
  availabilities: DemoAvailability[];
};

const DEMO_DB_KEY = 'ccr_demo_db';
const SLOT_LIMIT = 2;

const emitApiError = (payload: ApiErrorPayload) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ApiErrorPayload>('api-error', { detail: payload }));
};

const formatDate = (date: Date): string => new Intl.DateTimeFormat('pt-BR').format(date);

const parsePtDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const buildSundaysOfMonth = (monthYear: string): string[] => {
  const [monthRaw, yearRaw] = monthYear.split('/').map(Number);
  const month = monthRaw - 1;
  const year = yearRaw;
  const cursor = new Date(year, month, 1);
  const result: string[] = [];
  while (cursor.getMonth() === month) {
    if (cursor.getDay() === 0) result.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

const nowIso = () => new Date().toISOString();

const seedDb = (): DemoDB => {
  const baseUsers: DemoUser[] = [
    { id: 'u-guest', name: 'Usuário Demo', login: 'guest', role: 'ADMIN', active: true, password: 'demo' },
    { id: 'u-ana', name: 'Ana Paula', login: 'ana', role: 'USER', active: true, password: '123' },
    { id: 'u-joao', name: 'João Marcos', login: 'joao', role: 'USER', active: true, password: '123' },
  ];
  const createdAt = nowIso();
  return {
    users: baseUsers,
    children: [
      {
        id: 'c-1',
        name: 'Miguel Silva',
        responsibleName: 'Carla Silva',
        responsibleContact: '(11) 99999-0001',
        allergies: 'N/A',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'c-2',
        name: 'Ester Souza',
        responsibleName: 'Paulo Souza',
        responsibleContact: '(11) 99999-0002',
        allergies: 'Intolerância à lactose',
        createdAt,
        updatedAt: createdAt,
      },
    ],
    attendances: [],
    availabilities: [],
  };
};

const readDb = (): DemoDB => {
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (!raw) {
      const seeded = seedDb();
      localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as DemoDB;
  } catch {
    const seeded = seedDb();
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const writeDb = (db: DemoDB) => {
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
};

class ApiService {
  private static instance: ApiService;
  private token: string | null = localStorage.getItem('ccr_token');

  private constructor() { }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('ccr_token', token);
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem('ccr_token');
  }

  public getToken(): string | null {
    return this.token;
  }

  private getCurrentUser(db: DemoDB): DemoUser | null {
    if (!this.token) return null;
    return db.users.find((user) => user.id === this.token && user.active) || null;
  }

  private requireAuth(db: DemoDB): DemoUser {
    const user = this.getCurrentUser(db);
    if (!user) {
      emitApiError({ message: 'Sessão expirada. Faça login novamente.', status: 401, action: 'login' });
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    return user;
  }

  private toPublicUser(user: DemoUser) {
    return { id: user.id, name: user.name, login: user.login, role: user.role, active: user.active };
  }

  private buildCalendar(db: DemoDB, month: string) {
    const sundays = buildSundaysOfMonth(month).map((date) => {
      const reports = (['MORNING', 'NIGHT'] as Shift[]).map((shift) => {
        const availableUsers = db.availabilities
          .filter((item) => item.date === date && item.shift === shift)
          .map((item) => db.users.find((user) => user.id === item.userId))
          .filter((user): user is DemoUser => !!user && user.active)
          .map((user) => ({ id: user.id, name: user.name }));

        const attendances = db.attendances
          .filter((item) => item.date === date && item.shift === shift)
          .map((item) => {
            const child = db.children.find((entry) => entry.id === item.childId);
            const marker = db.users.find((entry) => entry.id === item.markedByUserId);
            if (!child || !marker) return null;
            return {
              date: item.date,
              shift: item.shift,
              present: item.present,
              child: { id: child.id, name: child.name },
              markedBy: { id: marker.id, name: marker.name },
            };
          })
          .filter(Boolean);

        return {
          date,
          shift,
          availableUsers,
          remainingSlots: Math.max(0, SLOT_LIMIT - availableUsers.length),
          attendances,
        };
      });

      return { date, reports };
    });

    return { monthYear: month, sundays };
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const db = readDb();

    try {
      if (endpoint === '/auth/login' && method === 'POST') {
        const body = JSON.parse(String(options.body || '{}')) as { login?: string; password?: string };
        if ((body.login || '').trim().toLowerCase() !== 'guest') {
          emitApiError({ message: 'Credenciais inválidas.', status: 401 });
          throw new Error('Credenciais inválidas.');
        }
        const guest = db.users.find((user) => user.login === 'guest' && user.active);
        if (!guest) {
          emitApiError({ message: 'Usuário demo indisponível.', status: 500 });
          throw new Error('Usuário demo indisponível.');
        }
        return { token: guest.id } as T;
      }

      if (endpoint === '/users/health' && method === 'GET') {
        this.requireAuth(db);
        return {} as T;
      }

      if (endpoint === '/users/me' && method === 'GET') {
        const currentUser = this.requireAuth(db);
        return this.toPublicUser(currentUser) as T;
      }

      if (endpoint === '/children' && method === 'GET') {
        this.requireAuth(db);
        return db.children as T;
      }

      if (endpoint === '/children' && method === 'POST') {
        this.requireAuth(db);
        const body = JSON.parse(String(options.body || '{}'));
        const createdAt = nowIso();
        db.children.push({
          id: `c-${Date.now()}`,
          name: body.name || '',
          responsibleName: body.responsibleName || '',
          responsibleContact: body.responsibleContact || '',
          allergies: body.allergies || 'N/A',
          createdAt,
          updatedAt: createdAt,
        });
        writeDb(db);
        return {} as T;
      }

      if (/^\/children\/[^/]+$/.test(endpoint) && method === 'PUT') {
        this.requireAuth(db);
        const id = endpoint.split('/')[2];
        const body = JSON.parse(String(options.body || '{}'));
        const target = db.children.find((child) => child.id === id);
        if (!target) {
          emitApiError({ message: 'Criança não encontrada.', status: 404 });
          throw new Error('Criança não encontrada.');
        }
        target.name = body.name ?? target.name;
        target.responsibleName = body.responsibleName ?? target.responsibleName;
        target.responsibleContact = body.responsibleContact ?? target.responsibleContact;
        target.allergies = body.allergies ?? target.allergies;
        target.updatedAt = nowIso();
        writeDb(db);
        return {} as T;
      }

      if (endpoint.startsWith('/children/attendance?') && method === 'GET') {
        this.requireAuth(db);
        const url = new URL(`http://demo.local${endpoint}`);
        const date = url.searchParams.get('start') || '';
        const shift = (url.searchParams.get('shift') || 'MORNING') as Shift;
        const result = db.attendances
          .filter((item) => item.date === date && item.shift === shift)
          .map((item) => {
            const child = db.children.find((entry) => entry.id === item.childId);
            const marker = db.users.find((entry) => entry.id === item.markedByUserId);
            if (!child || !marker) return null;
            return {
              date: item.date,
              shift: item.shift,
              present: item.present,
              child: { id: child.id, name: child.name },
              markedBy: { id: marker.id, name: marker.name },
            };
          })
          .filter(Boolean);
        return result as T;
      }

      if (/^\/children\/[^/]+\/attendance$/.test(endpoint) && (method === 'POST' || method === 'PUT')) {
        const currentUser = this.requireAuth(db);
        const childId = endpoint.split('/')[2];
        const body = JSON.parse(String(options.body || '{}')) as { date: string; shift: Shift; present: boolean };
        const child = db.children.find((entry) => entry.id === childId);
        if (!child) {
          emitApiError({ message: 'Criança não encontrada.', status: 404 });
          throw new Error('Criança não encontrada.');
        }

        const existing = db.attendances.find(
          (item) => item.childId === childId && item.date === body.date && item.shift === body.shift,
        );

        if (method === 'POST' && existing) {
          emitApiError({ message: 'Presença já registrada para esta criança nesta data/turno.', status: 409 });
          throw new Error('Presença já registrada para esta criança nesta data/turno.');
        }

        if (!existing) {
          db.attendances.push({
            childId,
            date: body.date,
            shift: body.shift,
            present: !!body.present,
            markedByUserId: currentUser.id,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
        } else {
          existing.present = !!body.present;
          existing.markedByUserId = currentUser.id;
          existing.updatedAt = nowIso();
        }

        writeDb(db);
        return {} as T;
      }

      if (endpoint.startsWith('/sundays/calendar?') && method === 'GET') {
        this.requireAuth(db);
        const url = new URL(`http://demo.local${endpoint}`);
        const month = url.searchParams.get('month') || formatDate(new Date());
        return this.buildCalendar(db, month) as T;
      }

      if (endpoint.startsWith('/sundays/report?') && method === 'GET') {
        this.requireAuth(db);
        const url = new URL(`http://demo.local${endpoint}`);
        const start = url.searchParams.get('start') || '';
        const shift = (url.searchParams.get('shift') || 'MORNING') as Shift;
        const month = `${String(parsePtDate(start).getMonth() + 1).padStart(2, '0')}/${parsePtDate(start).getFullYear()}`;
        const calendar = this.buildCalendar(db, month);
        const report = calendar.sundays.find((item) => item.date === start)?.reports.find((item) => item.shift === shift);
        return (report ? [report] : []) as T;
      }

      if (endpoint === '/sundays' && method === 'POST') {
        const currentUser = this.requireAuth(db);
        const body = JSON.parse(String(options.body || '{}')) as { date: string; shift: Shift };
        const exists = db.availabilities.some(
          (item) => item.userId === currentUser.id && item.date === body.date && item.shift === body.shift,
        );
        if (exists) {
          emitApiError({ message: 'Você já marcou disponibilidade para este turno.', status: 409 });
          throw new Error('Você já marcou disponibilidade para este turno.');
        }
        const currentCount = db.availabilities.filter((item) => item.date === body.date && item.shift === body.shift).length;
        if (currentCount >= SLOT_LIMIT) {
          emitApiError({ message: 'Não há mais vagas disponíveis para este turno.', status: 409 });
          throw new Error('Não há mais vagas disponíveis para este turno.');
        }
        db.availabilities.push({ userId: currentUser.id, date: body.date, shift: body.shift });
        writeDb(db);
        return {} as T;
      }

      if (endpoint.startsWith('/sundays?') && method === 'DELETE') {
        const currentUser = this.requireAuth(db);
        const url = new URL(`http://demo.local${endpoint}`);
        const date = url.searchParams.get('date') || '';
        const shift = (url.searchParams.get('shift') || 'MORNING') as Shift;
        const targetUserId = url.searchParams.get('userId') || currentUser.id;
        db.availabilities = db.availabilities.filter(
          (item) => !(item.userId === targetUserId && item.date === date && item.shift === shift),
        );
        writeDb(db);
        return {} as T;
      }

      if (endpoint === '/users' && method === 'GET') {
        this.requireAuth(db);
        return db.users.map((user) => this.toPublicUser(user)) as T;
      }

      if (endpoint === '/users' && method === 'POST') {
        this.requireAuth(db);
        const body = JSON.parse(String(options.body || '{}')) as {
          name: string;
          login: string;
          password: string;
          role: Role;
        };
        if (db.users.some((user) => user.login.toLowerCase() === body.login.toLowerCase())) {
          emitApiError({ message: 'Login já existente.', status: 409 });
          throw new Error('Login já existente.');
        }
        db.users.push({
          id: `u-${Date.now()}`,
          name: body.name,
          login: body.login,
          password: body.password,
          role: body.role,
          active: true,
        });
        writeDb(db);
        return {} as T;
      }

      if (/^\/users\/[^/]+$/.test(endpoint) && method === 'PUT') {
        this.requireAuth(db);
        const userId = endpoint.split('/')[2];
        const body = JSON.parse(String(options.body || '{}'));
        const target = db.users.find((user) => user.id === userId);
        if (!target) {
          emitApiError({ message: 'Voluntário não encontrado.', status: 404 });
          throw new Error('Voluntário não encontrado.');
        }
        target.name = body.name ?? target.name;
        target.login = body.login ?? target.login;
        target.role = body.role ?? target.role;
        if (body.password) target.password = body.password;
        writeDb(db);
        return {} as T;
      }

      if (/^\/users\/[^/]+\/status$/.test(endpoint) && method === 'PUT') {
        this.requireAuth(db);
        const userId = endpoint.split('/')[2];
        const body = JSON.parse(String(options.body || '{}')) as { active: boolean };
        const target = db.users.find((user) => user.id === userId);
        if (!target) {
          emitApiError({ message: 'Voluntário não encontrado.', status: 404 });
          throw new Error('Voluntário não encontrado.');
        }
        target.active = !!body.active;
        writeDb(db);
        return {} as T;
      }

      if (endpoint === '/users/me/password' && method === 'PUT') {
        const currentUser = this.requireAuth(db);
        const body = JSON.parse(String(options.body || '{}')) as { currentPassword: string; newPassword: string };
        if (currentUser.password !== body.currentPassword) {
          emitApiError({ message: 'Senha atual incorreta.', status: 400 });
          throw new Error('Senha atual incorreta.');
        }
        currentUser.password = body.newPassword;
        writeDb(db);
        return {} as T;
      }

      emitApiError({ message: 'Recurso não encontrado.', status: 404 });
      throw new Error('Recurso não encontrado.');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      emitApiError({ message: 'Ocorreu um erro inesperado.' });
      throw new Error('Ocorreu um erro inesperado.');
    }
  }
}

export const api = ApiService.getInstance();
