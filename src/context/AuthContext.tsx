import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import type { User, Company, Department, AppRole } from '../types';
import { mockUsers, mockCompanies } from '../data/mockDb';

interface AuthContextType {
  user: User | null;
  currentCompany: Company | null;
  currentDepartment: Department | null;
  departments: Department[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchCompany: (companyId: string) => void;
  switchDepartment: (deptId: string) => void;
  switchRole: (role: AppRole) => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('oraculo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => {
    const saved = localStorage.getItem('oraculo_company');
    if (saved) return JSON.parse(saved);
    
    // Fallback: if user is logged in, try to find their first company
    const savedUser = localStorage.getItem('oraculo_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as User;
        if (u && Array.isArray(u.associatedCompanyIds)) {
          const firstCompany = mockCompanies.find(c => u.associatedCompanyIds.includes(c.id));
          return firstCompany || mockCompanies.find(c => c.id === 'c_vtal') || mockCompanies[0];
        }
      } catch (e) {
        console.error('AuthContext: Failed to parse saved user', e);
      }
    }
    return mockCompanies.find(c => c.id === 'c_vtal') || mockCompanies[0];
  });

  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(() => {
    const saved = localStorage.getItem('oraculo_department');
    return saved ? JSON.parse(saved) : null;
  });

  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (currentCompany) {
      fetch('/api/departments')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch departments');
          return res.json();
        })
        .then(data => {
          const companyDepts = (Array.isArray(data) ? data : []).filter(d => d.companyId === currentCompany.id);
          setDepartments(companyDepts);
          
          if (!currentDepartment || currentDepartment.companyId !== currentCompany.id) {
            const firstDept = companyDepts[0] || null;
            setCurrentDepartment(firstDept);
            if (firstDept) localStorage.setItem('oraculo_department', JSON.stringify(firstDept));
          }
        })
        .catch(err => {
          console.error('AuthContext: Failed to fetch departments', err);
          // Don't crash, just set empty
          setDepartments([]);
        });
    } else {
      setDepartments([]);
      setCurrentDepartment(null);
    }
  }, [currentCompany, currentDepartment?.id]);

  // Sync user with DB whenever email is available and potentially changed
  useEffect(() => {
    if (user?.email) {
      fetch(`/api/users/email/${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(dbUser => {
          if (dbUser && dbUser.id && (dbUser.photoUrl !== user.photoUrl || dbUser.fullName !== user.fullName)) {
            setUser(prev => prev ? { ...prev, ...dbUser } : dbUser);
            localStorage.setItem('oraculo_user', JSON.stringify({ ...user, ...dbUser }));
          }
        })
        .catch(err => console.error('AuthContext: Failed to sync user with DB', err));
    }
  }, [user?.email]);

  const login = async (email: string, password: string) => {
    // 1. Try to find user in DB first
    try {
      const response = await fetch(`/api/users/email/${encodeURIComponent(email)}`);
      if (response.ok) {
        const dbUser = await response.json();
        // Simple password check (this is a demo, so we'll allow 123)
        if (dbUser && (password === '123' || dbUser.password === password)) {
          setUser(dbUser);
          localStorage.setItem('oraculo_user', JSON.stringify(dbUser));
          
          const firstCompany = mockCompanies.find(c => dbUser.associatedCompanyIds?.includes(c.id));
          const companyToSet = firstCompany || mockCompanies[0];
          setCurrentCompany(companyToSet);
          localStorage.setItem('oraculo_company', JSON.stringify(companyToSet));
          return true;
        }
      }
    } catch (dbErr) {
      console.warn('AuthContext: DB login failed, falling back to mock', dbErr);
    }

    // 2. Fallback to mock data
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('oraculo_user', JSON.stringify(foundUser));
      
      const firstCompany = mockCompanies.find(c => foundUser.associatedCompanyIds.includes(c.id));
      const companyToSet = firstCompany || mockCompanies[0];
      setCurrentCompany(companyToSet);
      localStorage.setItem('oraculo_company', JSON.stringify(companyToSet));
      return true;
    }

    return false;
  };

  const switchCompany = (companyId: string) => {
    const company = mockCompanies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('oraculo_company', JSON.stringify(company));
    }
  };

  const switchDepartment = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (dept) {
      setCurrentDepartment(dept);
      localStorage.setItem('oraculo_department', JSON.stringify(dept));
    }
  };

  const switchRole = (role: AppRole) => {
    const names: Record<AppRole, string> = {
      'VP': 'Vinícius (VP)',
      'Director': 'Niraldo (Diretor)',
      'Manager': 'Ricardo (Gerente)',
      'Lead Engineer': 'Roberta (Líder Técnico)',
      'Engineer/Analyst': 'Juliana (Engenheiro)'
    };
    const roleId = role.toLowerCase().replace(' ', '_').replace('/', '_');
    const newUser: User = {
      id: `u_${roleId}`,
      fullName: names[role],
      email: `${roleId.replace('_', '')}@vtal.com`,
      role,
      associatedCompanyIds: ['c_vtal', 'c_btg', 'c_nio']
    };
    setUser(newUser);
    localStorage.setItem('oraculo_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setCurrentCompany(null);
    setCurrentDepartment(null);
    localStorage.removeItem('oraculo_user');
    localStorage.removeItem('oraculo_company');
    localStorage.removeItem('oraculo_department');
  };

  const updateUser = async (data: Partial<User>) => {
    if (user) {
      // 1. Update local state immediately for UI responsiveness
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('oraculo_user', JSON.stringify(updatedUser));

      // 2. Persist to DB if user has a real ID (starts with u_ or uuid)
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update user in database');
        }
        
        const savedUser = await response.json();
        // Update state again with final DB data
        setUser(prev => prev ? { ...prev, ...savedUser } : savedUser);
        localStorage.setItem('oraculo_user', JSON.stringify({ ...updatedUser, ...savedUser }));
      } catch (error) {
        console.error('AuthContext: Update user DB error', error);
        // We could revert local state here, but usually it's better to log it for now
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      currentCompany, 
      currentDepartment, 
      departments, 
      login, 
      logout, 
      switchCompany, 
      switchDepartment,
      switchRole, 
      updateUser 
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
