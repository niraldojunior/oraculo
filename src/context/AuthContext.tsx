import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Company, Department, Collaborator } from '../types';

export interface LoginResult {
  success: boolean;
  status: number;
  message?: string;
}

interface AuthContextType {
  user: Collaborator | null;
  isAdmin: boolean;
  canManageEntities: boolean;
  currentCompany: Company | null;
  currentDepartment: Department | null;
  availableCompanies: Company[];
  availableDepartments: Department[];
  setCurrentCompany: (company: Company) => void;
  setCurrentDepartment: (dept: Department) => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateUser: (data: Partial<Collaborator>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Collaborator | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManageEntities, setCanManageEntities] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const role = user.role;
      setCanManageEntities(isAdmin || role === 'Head' || role === 'Director' || role === 'Master');
    } else {
      setCanManageEntities(false);
    }
  }, [user, isAdmin]);

  const currentCompanyRef = React.useRef(currentCompany);
  const currentDepartmentRef = React.useRef(currentDepartment);

  React.useEffect(() => {
    currentCompanyRef.current = currentCompany;
  }, [currentCompany]);

  React.useEffect(() => {
    currentDepartmentRef.current = currentDepartment;
  }, [currentDepartment]);

  const fetchUserData = useCallback(async (email: string, forceReset = false) => {
    try {
      const collabRes = await fetch(`/api/collaborators/email/${encodeURIComponent(email)}`);
      if (!collabRes.ok) throw new Error('Collaborator not found');
      const collabData: Collaborator = await collabRes.json();
      setUser(collabData);
      setIsAdmin(collabData.isAdmin || false);

      const [compRes, deptRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/departments')
      ]);

      if (compRes.ok && deptRes.ok) {
        const allCompanies: Company[] = await compRes.json();
        const allDepts: Department[] = await deptRes.json();

        let filteredCompanies: Company[] = [];
        let filteredDepts: Department[] = [];

        if (collabData.isAdmin) {
          if (collabData.associatedCompanyIds && collabData.associatedCompanyIds.length > 0) {
            filteredCompanies = allCompanies.filter(c => collabData.associatedCompanyIds.includes(c.id));
            filteredDepts = allDepts.filter(d => collabData.associatedCompanyIds.includes(d.companyId));
          }
          
          // Fallback: if no associated companies found but user has a primary companyId, use it
          if (filteredCompanies.length === 0 && collabData.companyId) {
            filteredCompanies = allCompanies.filter(c => c.id === collabData.companyId);
            filteredDepts = allDepts.filter(d => d.companyId === collabData.companyId);
          }
          
          // If still empty and no associated IDs, global admin (see everything)
          if (filteredCompanies.length === 0 && (!collabData.associatedCompanyIds || collabData.associatedCompanyIds.length === 0)) {
            filteredCompanies = allCompanies;
            filteredDepts = allDepts;
          }
        } else {
          filteredCompanies = allCompanies.filter(c => c.id === collabData.companyId);
          filteredDepts = allDepts.filter(d => d.id === collabData.departmentId);
        }

        setAvailableCompanies(filteredCompanies);
        setAvailableDepartments(filteredDepts);

        // Update current selections
        const isCompValid = currentCompanyRef.current && filteredCompanies.some(c => c.id === currentCompanyRef.current?.id);
        if (filteredCompanies.length > 0 && (forceReset || !isCompValid)) {
          setCurrentCompany(filteredCompanies[0]);
        }

        const isDeptValid = currentDepartmentRef.current && filteredDepts.some(d => d.id === currentDepartmentRef.current?.id);
        if (filteredDepts.length > 0 && (forceReset || !isDeptValid)) {
          const companyToUse = (forceReset || !isCompValid) ? filteredCompanies[0] : currentCompanyRef.current;
          const deptToUse = filteredDepts.find(d => d.companyId === companyToUse?.id) || filteredDepts[0];
          setCurrentDepartment(deptToUse || null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem('oraculo_user_email');
    if (savedEmail) {
      fetchUserData(savedEmail);
    } else {
      setLoading(false);
    }

    const handleFocus = () => {
      const email = localStorage.getItem('oraculo_user_email');
      if (email) fetchUserData(email);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchUserData]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return { 
          success: false, 
          status: res.status, 
          message: errorData.error || 'Falha na autenticação'
        };
      }
      
      const { user: userData, isAdmin: adminFlag } = await res.json();
      
      localStorage.setItem('oraculo_user_email', email.trim().toLowerCase());
      
      setUser(userData);
      setIsAdmin(adminFlag);
      await fetchUserData(email.trim().toLowerCase(), true);
      return { success: true, status: 200 };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        status: 500, 
        message: 'Erro de rede ou conexão com o servidor' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('oraculo_user_email');
    setUser(null);
    setIsAdmin(false);
    setCurrentCompany(null);
    setCurrentDepartment(null);
    setAvailableCompanies([]);
    setAvailableDepartments([]);
  };

  const updateUser = async (data: Partial<Collaborator>) => {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/collaborators/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
      } else {
        throw new Error('Failed to update user in database');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erro ao sincronizar dados com o servidor.');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin,
      canManageEntities,
      currentCompany, 
      currentDepartment,
      availableCompanies,
      availableDepartments,
      setCurrentCompany,
      setCurrentDepartment,
      login, 
      logout, 
      updateUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

