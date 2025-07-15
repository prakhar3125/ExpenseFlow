import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app load
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Helper function to get all registered users with default user always included
  const getAllUsers = () => {
    const users = localStorage.getItem('registeredUsers');
    const storedUsers = users ? JSON.parse(users) : [];
    
    // Default user that's always available
    const defaultUser = {
      id: 1,
      email: 'user@example.com',
      password: 'password',
      name: 'Demo User',
      createdAt: '2024-01-01T00:00:00.000Z',
      isDefault: true
    };
    
    // Check if default user already exists in stored users
    const hasDefaultUser = storedUsers.some(u => u.email === 'user@example.com');
    
    if (!hasDefaultUser) {
      // Add default user to the beginning of the array
      storedUsers.unshift(defaultUser);
      localStorage.setItem('registeredUsers', JSON.stringify(storedUsers));
    }
    
    return storedUsers;
  };

  // Helper function to save a new user to the registry
  const saveUser = (userData) => {
    const users = getAllUsers();
    const existingUserIndex = users.findIndex(u => u.email === userData.email);
    
    if (existingUserIndex > -1) {
      // Don't allow overwriting the default user
      if (users[existingUserIndex].isDefault) {
        throw new Error('Cannot modify default user account');
      }
      // Update existing user
      users[existingUserIndex] = userData;
    } else {
      // Add new user
      users.push(userData);
    }
    
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  };

  const login = async (credentials) => {
    try {
      // Check against all registered users (including default)
      const users = getAllUsers();
      const foundUser = users.find(u => 
        u.email === credentials.email && u.password === credentials.password
      );

      if (foundUser) {
        // Remove password from user object for security
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return { success: true };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (credentials) => {
    try {
      // Basic validation
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      
      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if user already exists
      const users = getAllUsers();
      const existingUser = users.find(u => u.email === credentials.email);
      
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user
      const userData = {
        id: Date.now(),
        email: credentials.email,
        password: credentials.password,
        name: credentials.name || 'New User',
        createdAt: new Date().toISOString(),
        isDefault: false
      };
      
      // Save user to registry
      saveUser(userData);
      
      // Set as current user (without password)
      const { password, ...userWithoutPassword } = userData;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  // Optional: Add function to get all registered users for debugging
  const getRegisteredUsers = () => {
    return getAllUsers().map(({ password, ...user }) => user);
  };

  // Optional: Reset to default users only
  const resetToDefaults = () => {
    localStorage.removeItem('registeredUsers');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    getRegisteredUsers,
    resetToDefaults
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
