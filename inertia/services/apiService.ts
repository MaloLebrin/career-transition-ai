
import { Employee, ExerciseResult, SupportPlanStep, ExerciseDraft, Organization, Advisor, AdvisorRole } from '../types';
import { MOCK_EMPLOYEES } from '../mocks/employees';

const STORAGE_KEY = 'ftc_portal_data';
const DRAFT_KEY = 'ftc_portal_drafts';
const ORG_KEY = 'ftc_organizations';
const USERS_KEY = 'ftc_portal_users';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getInitialData = (): Employee[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  let currentData: Employee[] = [];
  
  if (saved) {
    currentData = JSON.parse(saved);
  } else {
    currentData = [...MOCK_EMPLOYEES];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
    return currentData;
  }

  let modified = false;
  
  // Ensure all mock employees are present in the data
  MOCK_EMPLOYEES.forEach(mockEmp => {
    const exists = currentData.find(e => String(e.id) === String(mockEmp.id));
    if (!exists) {
      currentData.push(mockEmp);
      modified = true;
    } else {
      // Update existing mock entries if they differ in critical fields
      const index = currentData.findIndex(e => String(e.id) === String(mockEmp.id));
      if (
        currentData[index].advisorId !== mockEmp.advisorId || 
        currentData[index].organizationId !== mockEmp.organizationId ||
        currentData[index].nextAppointment !== mockEmp.nextAppointment
      ) {
        currentData[index] = { 
          ...currentData[index], 
          advisorId: mockEmp.advisorId, 
          organizationId: mockEmp.organizationId,
          nextAppointment: mockEmp.nextAppointment
        };
        modified = true;
      }
    }
  });

  if (modified) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
  }
  
  return currentData;
};

const getOrgs = (): Organization[] => {
  const saved = localStorage.getItem(ORG_KEY);
  if (saved) return JSON.parse(saved);
  const initialOrgs: Organization[] = [
    { id: 'ftc-paris', name: 'FTC Paris Étoile', slug: 'ftc-paris', createdAt: '2024-01-01' },
    { id: 'new-org', name: 'Nouveau Cabinet', slug: 'nouveau-cabinet', createdAt: '2025-01-01' }
  ];
  localStorage.setItem(ORG_KEY, JSON.stringify(initialOrgs));
  return initialOrgs;
};

const getUsers = (): Advisor[] => {
  const saved = localStorage.getItem(USERS_KEY);
  return saved ? JSON.parse(saved) : [];
};

const getDrafts = (): ExerciseDraft[] => {
  const saved = localStorage.getItem(DRAFT_KEY);
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
    await delay(300);
    let data = getInitialData();
    if (organizationId) {
      data = data.filter(e => e.organizationId === organizationId);
    }
    if (advisorId) {
      // Show candidates assigned to this advisor OR mock candidates if they are in the same organization
      data = data.filter(e => e.advisorId === advisorId || (['1', '2'].includes(e.id) && (!organizationId || e.organizationId === organizationId)));
    }
    return data;
  },

  async fetchEmployeeById(id: string): Promise<Employee> {
    await delay(300);
    const data = getInitialData();
    const emp = data.find(e => e.id === id);
    if (!emp) throw new Error("Candidat introuvable");
    return emp;
  },

  async createEmployee(employee: Employee): Promise<Employee> {
    await delay(300);
    const data = getInitialData();
    data.push(employee);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return employee;
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    await delay(500);
    const data = getInitialData();
    const index = data.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Candidat introuvable");
    data[index] = { ...data[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data[index];
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
