import React, { useState, useEffect } from 'react';
import { QueryPreservingLink } from './NextQueryPreservingLink';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

interface PageHeaderProps {
  children: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1>
      <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / {children}
      </h1>
      {!loading && (
      <span>
        {currentUser ? (
        <QueryPreservingLink to="/auth">account?</QueryPreservingLink>
        ) : (
        <QueryPreservingLink to="/auth">sign in?</QueryPreservingLink>
        )}
      </span>
      )}
    </header>
  );
};
