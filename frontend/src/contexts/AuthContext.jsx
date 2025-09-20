import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    signInWithGoogle, 
     createUserDocument,
    database, 
    auth
  } from '../config/firebase';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    const auth = getAuth();
  
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(database, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            ...userData
          });
        } else {
          await createUserDocument(firebaseUser);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'normal_user',
            roleName: 'Normal User'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  

  const login = async (username) => {
    try {
      // For demo purposes, keep the mock login for existing users
      const mockUsers = {
        'admin': {
          id: 1,
          username: 'admin',
          name: 'System Administrator',
          role: 'hospital_admin',
          roleName: 'Hospital Admin'
        },
        'doctor': {
          id: 2,
          username: 'doctor',
          name: 'Dr. Sarah Johnson',
          role: 'doctor',
          roleName: 'Doctor'
        },
        'ambulance': {
          id: 3,
          username: 'ambulance',
          name: 'Mike Wilson',
          role: 'ambulance_driver',
          roleName: 'Ambulance Driver'
        },
        'volunteer': {
          id: 4,
          username: 'volunteer',
          name: 'John Smith',
          role: 'relief_volunteer',
          roleName: 'Relief Volunteer'
        },
        'normal': {
          id: 5,
          username: 'normal',
          name: 'Jane Doe',
          role: 'normal_user',
          roleName: 'Normal User'
        }
      };
      
      const user = mockUsers[username];
      if (user) {
        setUser(user);
        localStorage.setItem('optiroute_user', JSON.stringify(user));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid username' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const signInWithGoogleAuth = async () => {
    try {
      const result = await signInWithGoogle();
      const { user: firebaseUser } = result;
      
      // Create or update user document
      await createUserDocument(firebaseUser, {
        role: 'normal_user',
        roleName: 'Normal User'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      // For demo purposes, keep the mock signup
      const newUser = {
        id: Date.now(),
        username: userData.username,
        name: userData.name,
        role: userData.role,
        roleName: userData.roleName,
        organization: userData.organization || '',
        phone: userData.phone || ''
      };
      
      setUser(newUser);
      localStorage.setItem('optiroute_user', JSON.stringify(newUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };
  const signOutUser = () => signOut(auth);
  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      localStorage.removeItem('optiroute_user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
      const userRef = doc(database, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });
      
      setUser(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  const value = {
    user,
    login,
    signInWithGoogle: signInWithGoogleAuth,
    signup,
    logout,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
