
export interface UserSession {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: 'advisor' | 'employee';
}

const USERS_KEY = 'ftc_portal_users';
const SESSION_KEY = 'ftc_session';

export interface UserAuthData {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: 'advisor' | 'employee';
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const seedInitialUsers = () => {
  const existing = localStorage.getItem(USERS_KEY);
  let initialUsers: UserAuthData[] = [
    { id: '1', organizationId: 'ftc-paris', email: 'h.duboc@example.fr', name: 'Hubert Duboc', role: 'employee' },
    { id: '2', organizationId: 'ftc-paris', email: 'm.lebrin@example.fr', name: 'Malo Lebrin', role: 'employee' },
    { id: 'advisor-1', organizationId: 'ftc-paris', email: 'expert@ftc.fr', name: 'Consultant Expert', role: 'advisor' }
  ];

  if (!existing) {
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  } else {
    // Ensure the demo advisor is always present and correct even if storage exists
    const users = JSON.parse(existing);
    const expertIndex = users.findIndex((u: any) => u.email.toLowerCase() === 'expert@ftc.fr');
    if (expertIndex === -1) {
      users.push(initialUsers[2]);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } else if (users[expertIndex].id !== 'advisor-1' || users[expertIndex].organizationId !== 'ftc-paris') {
      users[expertIndex] = initialUsers[2];
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
};

export const authService = {
  async login(email: string, password: string): Promise<UserSession> {
    seedInitialUsers();
    await delay(1000);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      if (email.endsWith('@ftc.fr')) {
        return this.register(email, password, "Consultant FTC", 'advisor');
      }
      throw new Error("Compte introuvable.");
    }

    const session: UserSession = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      name: user.name,
      role: user.role
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async register(email: string, password: string, name: string, role: 'advisor' | 'employee'): Promise<UserSession> {
    seedInitialUsers();
    await delay(1200);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Cet email est déjà utilisé.");
    }

    const newUser: UserAuthData = { 
      id: Math.random().toString(36).substr(2, 9), 
      organizationId: 'ftc-paris', // Default to demo organization
      email, 
      name, 
      role 
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const session: UserSession = { 
      id: newUser.id, 
      organizationId: newUser.organizationId,
      email: newUser.email, 
      name: newUser.name, 
      role: newUser.role 
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async updateProfile(id: string, updates: Partial<UserSession>): Promise<UserSession> {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: any) => u.id === id);
    if (index === -1) throw new Error("Utilisateur introuvable.");
    
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session.id === id) {
        const updatedSession = { ...session, ...updates };
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
        return updatedSession;
      }
    }
    
    return users[index];
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentSession(): UserSession | null {
    seedInitialUsers();
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const latestUser = users.find((u: any) => u.email.toLowerCase() === session.email.toLowerCase());
    
    if (latestUser) {
      return {
        id: latestUser.id,
        organizationId: latestUser.organizationId,
        email: latestUser.email,
        name: latestUser.name,
        role: latestUser.role
      };
    }
    
    return session;
  }
};
