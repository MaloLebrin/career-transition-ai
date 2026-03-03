
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '../types';
import { apiService } from '../services/apiService';

export function useEmployee(id: string | null) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setEmployee(null);
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.fetchEmployeeById(id);
      setEmployee(data);
    } catch (err) {
      setError("Erreur lors de la récupération du profil.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = async (updates: Partial<Employee>) => {
    if (!id) return;
    try {
      const updated = await apiService.updateEmployee(id, updates);
      setEmployee(updated);
      return updated;
    } catch (err) {
      setError("Erreur lors de la mise à jour.");
      throw err;
    }
  };

  const updateAdvisorNotes = async (notes: string) => {
    return updateProfile({ advisorNotes: notes });
  };

  return { 
    employee, 
    loading, 
    error, 
    updateProfile, 
    updateAdvisorNotes, 
    refreshEmployee: load 
  };
}
