
import React, { useState } from 'react';
import { Employee, ExerciseType } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

interface Props {
  onClose: () => void;
  onAdd: (employee: Employee) => void;
}

const AddEmployeeModal: React.FC<Props> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    
    // Fixed: Added organizationId to match Employee interface
    const newEmployee: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      organizationId: 'ftc-paris', // Default mock organization
      name: fullName,
      email: formData.email,
      currentRole: 'En attente d\'onboarding',
      status: 'active',
      onboarded: false,
      experiences: [],
      educations: [],
      skills: [],
      exercises: [],
      plan: [
        { 
          id: Math.random().toString(36).substr(2, 9), 
          title: 'La courbe de vie', 
          description: 'Analyse rétrospective du parcours professionnel.', 
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
          completed: false, 
          associatedExercise: ExerciseType.LIFE_CURVE 
        },
        { 
          id: Math.random().toString(36).substr(2, 9), 
          title: 'Diagnostic DISC', 
          description: 'Comprendre votre style comportemental et de communication.', 
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
          completed: false, 
          associatedExercise: ExerciseType.DISC 
        },
        { 
          id: Math.random().toString(36).substr(2, 9), 
          title: 'Analyse Motivations', 
          description: 'Identifier vos leviers d\'engagement profond.', 
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
          completed: false, 
          associatedExercise: ExerciseType.MOTIVATION 
        }
      ]
    };

    onAdd(newEmployee);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg relative animate-slideUp">
        <Button 
          onClick={onClose} 
          variant="ghost" 
          size="sm" 
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
        />

        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inviter un Talent</h2>
          <p className="text-slate-500 mt-2">L'invitation sera envoyée par email pour qu'il complète son profil.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                required
                placeholder="Ex: Jean"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                label="Nom"
                required
                placeholder="Ex: Dupont"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <Input
              label="Email Professionnel"
              required
              type="email"
              placeholder="j.dupont@exemple.fr"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Envoyer l'invitation
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AddEmployeeModal;
