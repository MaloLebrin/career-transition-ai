import { Employee, ExerciseResult, SupportPlanStep, ExerciseDraft } from '../types'

/**
 * JSON API client pour les opérations purement JSON (exercices, rafraîchissements ponctuels).
 * Tous les écrans et formulaires principaux passent par Inertia (router.* + props).
 */
export const apiService = {
  async fetchEmployees(organizationId?: string | number, advisorId?: string | number): Promise<Employee[]> {
    const url = new URL('/api/employees', window.location.origin);
    if (organizationId !== undefined && organizationId !== '') {
      url.searchParams.set('organizationId', String(organizationId));
    }
    if (advisorId !== undefined && advisorId !== '') {
      url.searchParams.set('advisorId', String(advisorId));
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

  async fetchEmployeeById(id: string | number): Promise<Employee> {
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

  async saveExerciseResult(employeeId: string | number, result: ExerciseResult, plan: SupportPlanStep[]): Promise<void> {
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

  async fetchExerciseDraft(employeeId: string | number, type: string): Promise<ExerciseDraft | null> {
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
