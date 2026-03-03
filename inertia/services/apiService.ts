
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
    const response = await fetch(`/api/organizations/${id}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('Organisation introuvable');
      if (response.status === 401) throw new Error('Non authentifié');
      throw new Error('Erreur lors du chargement de l’organisation.');
    }
    const data = await response.json();
    return data as Organization;
  },

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const response = await fetch(`/api/organizations/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('Organisation introuvable');
      if (response.status === 401) throw new Error('Non authentifié');
      throw new Error('Erreur lors de la sauvegarde.');
    }
    const data = await response.json();
    return data as Organization;
  },

  async fetchOrganizationAdvisors(organizationId: string): Promise<Advisor[]> {
    const response = await fetch(`/api/organizations/${organizationId}/advisors`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Non authentifié');
      throw new Error('Erreur lors du chargement des conseillers.');
    }
    const data = await response.json();
    return data as Advisor[];
  },

  async inviteAdvisor(organizationId: string, advisorData: { name: string, email: string, role: AdvisorRole }): Promise<Advisor> {
    const response = await fetch(`/api/organizations/${organizationId}/advisors`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(advisorData),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 400 && body?.message) throw new Error(body.message);
      if (response.status === 401) throw new Error('Non authentifié');
      throw new Error('Erreur lors de l’invitation.');
    }
    const data = await response.json();
    return data as Advisor;
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
    const response = await fetch('/api/employees', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la création du candidat.");
    }

    const data = await response.json();
    return data as Employee;
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
    const response = await fetch(`/api/employees/${employeeId}/exercises/result`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: result.type,
        status: 'completed',
        date: result.date,
        duration: result.duration,
        data: result.data,
        quantitativeScore: result.quantitativeScore,
        qualitativeAnalysis: result.qualitativeAnalysis,
        plan: plan.map((step) => ({
          id: step.id,
          completed: step.completed,
          lastUpdated: step.lastUpdated,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la sauvegarde du résultat.');
    }
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
