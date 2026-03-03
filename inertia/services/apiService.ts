import {
  Employee,
  ExerciseResult,
  SupportPlanStep,
  ExerciseDraft,
  Organization,
  Advisor,
} from '../types'

/**
 * JSON API client. Dashboard create/update flows use Inertia (POST/PUT /dashboard/employees, etc.).
 * Remaining methods: org/employees fetch, employee update (onboarding/profile), exercise result/draft.
 */
export const apiService = {
  /** Fetches the authenticated user's organization (no id required). */
  async fetchCurrentOrganization(): Promise<Organization> {
    const response = await fetch('/api/organizations/current', {
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

  /** Dashboard create uses Inertia POST /dashboard/employees. API update used by onboarding, profile, advisor notes. */
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
    const response = await fetch(`/api/employees/${draft.employeeId}/exercises/draft`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: draft.employeeId,
        type: draft.type,
        data: draft.data,
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'enregistrement du brouillon.");
    }
  },

  async fetchExerciseDraft(employeeId: string, type: string): Promise<ExerciseDraft | null> {
    const response = await fetch(`/api/employees/${employeeId}/exercises/draft/fetch`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId,
        type,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Erreur lors du chargement du brouillon.');
    }

    const data = await response.json();
    if (!data) return null;

    return {
      employeeId: data.employeeId,
      type: data.type,
      lastUpdated: data.lastUpdated,
      data: data.data,
    } as ExerciseDraft;
  }
};
