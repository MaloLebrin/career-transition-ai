
import { Employee, ExerciseResult, SupportPlanStep, ExerciseDraft, Organization, Advisor, AdvisorRole } from '../types';

const DRAFT_KEY = 'ftc_portal_drafts';
const ORG_KEY = 'ftc_organizations';
const USERS_KEY = 'ftc_portal_users';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getOrgs = (): Organization[] => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(ORG_KEY) : null;
  if (saved) return JSON.parse(saved);
  const initialOrgs: Organization[] = [
    { id: 'ftc-paris', name: 'FTC Paris Étoile', slug: 'ftc-paris', createdAt: '2024-01-01' },
    { id: 'new-org', name: 'Nouveau Cabinet', slug: 'nouveau-cabinet', createdAt: '2025-01-01' }
  ];
  if (typeof window !== 'undefined') {
    localStorage.setItem(ORG_KEY, JSON.stringify(initialOrgs));
  }
  return initialOrgs;
};

const getUsers = (): Advisor[] => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(USERS_KEY) : null;
  return saved ? JSON.parse(saved) : [];
};

const getDrafts = (): ExerciseDraft[] => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
  return saved ? JSON.parse(saved) : [];
};

export const apiService = {
  async fetchOrganization(id: string): Promise<Organization> {
    await delay(300);
    const orgs = getOrgs();
    const org = orgs.find(o => o.id === id);
    if (!org) throw new Error("Organisation introuvable");
    return org;
  },

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    await delay(500);
    const orgs = getOrgs();
    const index = orgs.findIndex(o => o.id === id);
    if (index === -1) throw new Error("Organisation introuvable");
    orgs[index] = { ...orgs[index], ...updates };
    localStorage.setItem(ORG_KEY, JSON.stringify(orgs));
    return orgs[index];
  },

  async fetchOrganizationAdvisors(organizationId: string): Promise<Advisor[]> {
    await delay(400);
    const users = getUsers();
    return users.filter(u => u.organizationId === organizationId);
  },

  async inviteAdvisor(organizationId: string, advisorData: { name: string, email: string, role: AdvisorRole }): Promise<Advisor> {
    await delay(800);
    const users = getUsers();
    
    if (users.find(u => u.email.toLowerCase() === advisorData.email.toLowerCase())) {
      throw new Error("Cet email est déjà utilisé par un compte existant.");
    }

    const newAdvisor: Advisor = {
      id: Math.random().toString(36).substr(2, 9),
      organizationId,
      email: advisorData.email,
      name: advisorData.name,
      role: advisorData.role
    };

    users.push(newAdvisor);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newAdvisor;
  },

  async fetchEmployees(organizationId?: string, advisorId?: string): Promise<Employee[]> {
    const url = new URL('/api/employees', window.location.origin);
    if (organizationId) {
      url.searchParams.set('organizationId', organizationId);
    }
    if (advisorId) {
      url.searchParams.set('advisorId', advisorId);
    }

    const response = await fetch(url.toString(), {
      credentials: 'include',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Erreur lors du chargement des candidats.");
    }

    const data = await response.json();
    return data as Employee[];
  },

  async fetchEmployeeById(id: string): Promise<Employee> {
    const response = await fetch(`/api/employees/${id}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Candidat introuvable");
    }

    const data = await response.json();
    return data as Employee;
  },

  async createEmployee(employee: Employee): Promise<Employee> {
    // TODO: brancher sur une route backend de création quand l'API sera disponible.
    await delay(300);
    return employee;
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour du candidat.');
    }

    const data = await response.json();
    return data as Employee;
  },

  async saveExerciseResult(employeeId: string, result: ExerciseResult, plan: SupportPlanStep[]): Promise<void> {
    await delay(800);
    const data = getInitialData();
    const index = data.findIndex(e => e.id === employeeId);
    if (index === -1) throw new Error("Candidat introuvable");
    
    const existingResultIndex = data[index].exercises.findIndex(r => r.type === result.type);
    if (existingResultIndex !== -1) {
      data[index].exercises[existingResultIndex] = result;
    } else {
      data[index].exercises.push(result);
    }
    
    data[index].plan = plan;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const drafts = getDrafts().filter(d => !(d.employeeId === employeeId && d.type === result.type));
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  },

  async saveExerciseDraft(draft: ExerciseDraft): Promise<void> {
    await delay(100);
    const drafts = getDrafts();
    const index = drafts.findIndex(d => d.employeeId === draft.employeeId && d.type === draft.type);
    
    if (index !== -1) {
      drafts[index] = draft;
    } else {
      drafts.push(draft);
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  },

  async fetchExerciseDraft(employeeId: string, type: string): Promise<ExerciseDraft | null> {
    await delay(100);
    const drafts = getDrafts();
    return drafts.find(d => d.employeeId === employeeId && d.type === type) || null;
  }
};
