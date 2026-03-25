import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Company, Department } from '../types';

interface AuthContextType {
  user: User | null;
  currentCompany: Company | null;
  currentDepartment: Department | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (email: string) => {
    try {
      // 1. Fetch User
      const userRes = await fetch(`/api/users/email/${encodeURIComponent(email)}`);
      if (!userRes.ok) throw new Error('User not found');
      const userData: User = await userRes.json();
      setUser(userData);

      // 2. Fetch Companies to find the current one
      const companiesRes = await fetch('/api/companies');
      if (companiesRes.ok) {
        const companies: Company[] = await companiesRes.json();
        const associated = companies.filter(c => userData.associatedCompanyIds.includes(c.id));
        if (associated.length > 0) {
          setCurrentCompany(associated[0]);
        }
      }

      // 3. Fetch Departments
      if (userData.departmentId) {
        const deptsRes = await fetch('/api/departments');
        if (deptsRes.ok) {
          const depts: Department[] = await deptsRes.json();
          const dept = depts.find(d => d.id === userData.departmentId);
          if (dept) setCurrentDepartment(dept);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If user not found in DB, we should probably logout
      if (email) {
          // localStorage.removeItem('oraculo_user_email');
          // setUser(null);
      }
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

    // focus sync: re-fetch data when window gets focus to ensure cross-device/tab sync
    const handleFocus = () => {
      const email = localStorage.getItem('oraculo_user_email');
      if (email) fetchUserData(email);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchUserData]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users/email/${encodeURIComponent(email)}`);
      if (!res.ok) return false;
      
      const userData = await res.json();
      // Simple password check (for demo purposes)
      if (password === '123' || userData.password === password) {
        localStorage.setItem('oraculo_user_email', email);
        await fetchUserData(email);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('oraculo_user_email');
    setUser(null);
    setCurrentCompany(null);
    setCurrentDepartment(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
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
      currentCompany, 
      currentDepartment, 
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
