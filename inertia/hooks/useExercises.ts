
import { useState, useCallback } from 'react';
import { ExerciseType, ExerciseResult, Employee, ExerciseDraft } from '../types';
import { analyzeExerciseResult } from '../services/geminiService';
import { apiService } from '../services/apiService';

export function useExercises(employee: Employee | null, onComplete: () => void) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const loadDraft = useCallback(async (type: ExerciseType) => {
    if (!employee) return null;
    return await apiService.fetchExerciseDraft(employee.id, type);
  }, [employee]);

  const saveDraft = async (type: ExerciseType, data: any) => {
    if (!employee) return;
    setIsSavingDraft(true);
    try {
      const draft: ExerciseDraft = {
        employeeId: employee.id,
        type,
        lastUpdated: new Date().toISOString(),
        data
      };
      await apiService.saveExerciseDraft(draft);
    } catch (err) {
      console.error("Draft save error:", err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const saveResult = async (type: ExerciseType, data: any, quantScore: number, duration: number) => {
    if (!employee) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeExerciseResult(type, data);
      const now = new Date().toLocaleString('fr-FR', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });

      const newResult: ExerciseResult = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        date: new Date().toISOString().split('T')[0],
        duration,
        data,
        quantitativeScore: quantScore,
        qualitativeAnalysis: analysis
      };

      const updatedPlan = employee.plan.map(step => 
        step.associatedExercise === type ? { ...step, completed: true, lastUpdated: now } : step
      );

      await apiService.saveExerciseResult(employee.id, newResult, updatedPlan);
      onComplete();
    } catch (err) {
      console.error("Exercise save error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { isAnalyzing, isSavingDraft, saveResult, saveDraft, loadDraft };
}
