import React, { useState, useEffect } from 'react';
import { QueryPreservingLink } from './QueryPreservingLink';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

interface PageHeaderProps {
  children: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <header>
      <h1 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / {children}
        </span>
        {!loading && (
          <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>
            {currentUser ? (
              <QueryPreservingLink to="/login">{currentUser.email}</QueryPreservingLink>
            ) : (
              <QueryPreservingLink to="/login">login?</QueryPreservingLink>
            )}
          </span>
        )}
      </h1>
    </header>
  );
};
