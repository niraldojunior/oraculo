import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Company, Department, Collaborator } from '../types';

export interface LoginResult {
  success: boolean;
  status: number;
  message?: string;
}

interface AuthContextType {
  user: User | Collaborator | null;
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
  updateUser: (data: Partial<User | Collaborator>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | Collaborator | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManageEntities, setCanManageEntities] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const role = (user as any).role;
      setCanManageEntities(isAdmin || role === 'Head' || role === 'Director');
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

  const fetchUserData = useCallback(async (email: string, type: string) => {
    try {
      if (type === 'admin') {
        const userRes = await fetch(`/api/users/email/${encodeURIComponent(email)}`);
        if (!userRes.ok) throw new Error('Admin not found');
        const userData: User = await userRes.json();
        setUser(userData);
        setIsAdmin(true);

        const [compRes, deptRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/departments')
        ]);

        if (compRes.ok) {
          const companies: Company[] = await compRes.json();
          const associated = companies.filter(c => userData.associatedCompanyIds.includes(c.id));
          setAvailableCompanies(associated);
          if (associated.length > 0 && !currentCompanyRef.current) setCurrentCompany(associated[0]);
        }
        
        if (deptRes.ok) {
          const depts: Department[] = await deptRes.json();
          const filtered = depts.filter(d => userData.associatedCompanyIds.includes(d.companyId));
          setAvailableDepartments(filtered);
          if (filtered.length > 0 && !currentDepartmentRef.current) setCurrentDepartment(filtered[0]);
        }

      } else {
        const collabRes = await fetch(`/api/collaborators/email/${encodeURIComponent(email)}`);
        if (!collabRes.ok) throw new Error('Collaborator not found');
        const collabData: Collaborator = await collabRes.json();
        setUser(collabData);
        setIsAdmin(collabData.isAdmin || false);

        const [compRes, deptRes] = await Promise.all([
          fetch(`/api/companies`),
          fetch(`/api/departments`)
        ]);

        if (compRes.ok) {
          const companies: Company[] = await compRes.json();
          const comp = companies.find(c => c.id === collabData.companyId);
          if (comp) {
            setAvailableCompanies([comp]);
            if (!currentCompanyRef.current) setCurrentCompany(comp);
          }
        }

        if (deptRes.ok) {
          const departments: Department[] = await deptRes.json();
          const dept = departments.find(d => d.id === collabData.departmentId);
          if (dept) {
            setAvailableDepartments([dept]);
            if (!currentDepartmentRef.current) setCurrentDepartment(dept);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Don't call logout here to avoid redirect loops on network failure
    } finally {
      setLoading(false);
    }
  }, []); // Stable reference

  useEffect(() => {
    const savedEmail = localStorage.getItem('oraculo_user_email');
    const savedType = localStorage.getItem('oraculo_user_type');
    
    if (savedEmail && savedType) {
      fetchUserData(savedEmail, savedType);
    } else {
      setLoading(false);
    }

    const handleFocus = () => {
      const email = localStorage.getItem('oraculo_user_email');
      const type = localStorage.getItem('oraculo_user_type');
      if (email && type) fetchUserData(email, type);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      
      const { user: userData, isAdmin: adminFlag, type } = await res.json();
      
      localStorage.setItem('oraculo_user_email', email.trim().toLowerCase());
      localStorage.setItem('oraculo_user_type', type);
      
      setUser(userData);
      setIsAdmin(adminFlag);
      await fetchUserData(email.trim().toLowerCase(), type);
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
    localStorage.removeItem('oraculo_user_type');
    setUser(null);
    setIsAdmin(false);
    setCurrentCompany(null);
    setCurrentDepartment(null);
    setAvailableCompanies([]);
    setAvailableDepartments([]);
  };

  const updateUser = async (data: Partial<User | Collaborator>) => {
    if (!user) return;
    
    try {
      const endpoint = isAdmin ? `/api/users/${user.id}` : `/api/collaborators/${user.id}`;
      const res = await fetch(endpoint, {
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

