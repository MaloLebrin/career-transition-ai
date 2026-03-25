import type { Employee } from '~/types'

/**
 * Legacy API service used by a few deprecated hooks tests.
 * The product is Inertia-first; these methods are meant to be mocked in tests.
 */
export const apiService = {
  async fetchEmployeeById(_id: string): Promise<Employee> {
    throw new Error('apiService.fetchEmployeeById must be mocked in tests.')
  },

  async fetchEmployees(_organizationId: number, _userId: number): Promise<Employee[]> {
    throw new Error('apiService.fetchEmployees must be mocked in tests.')
  },
}

import type { Employee } from '~/types'

export const apiService = {
  async fetchEmployeeById(_id: string): Promise<Employee> {
    throw new Error('apiService.fetchEmployeeById is not implemented (Inertia-first app).')
  },

  async fetchEmployees(_organizationId: number, _userId: number): Promise<Employee[]> {
    throw new Error('apiService.fetchEmployees is not implemented (Inertia-first app).')
  },
}

