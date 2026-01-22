import React, { useState, useEffect } from 'react';
import { QueryPreservingLink } from './QueryPreservingLink';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import type { FirebaseUser, FirebaseManifest } from '../manifest';

interface PageHeaderProps {
  children: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<FirebaseUser[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch Firebase users when authenticated
  useEffect(() => {
    if (!currentUser) {
      setUsersList([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('https://poppenhu-is-default-rtdb.firebaseio.com/.json');
        if (!response.ok) return;
        
        const data: FirebaseManifest | null = await response.json();
        if (!data) return;

        const users = Object.values(data)
          .filter((user: FirebaseUser) => user.creatorUid === currentUser.uid);
        
        setUsersList(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1>
      <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / {children}
      </h1>
      {!loading && (
      <span style={{ display: 'flex', gap: '1ch', alignItems: 'center' }}>
        {currentUser ? (
          <>
            {usersList.length > 0 && (
              <span style={{ display: 'flex', gap: '0.5ch' }}>
                {usersList.map((user) => (
                  <QueryPreservingLink key={user.id} to={`/${user.id}`}>
                    /{user.id}
                  </QueryPreservingLink>
                ))}
              </span>
            )}
            <QueryPreservingLink to="/new">+ new user</QueryPreservingLink>
            <QueryPreservingLink to="/auth">account?</QueryPreservingLink>
          </>
        ) : (
          <>
            <QueryPreservingLink to="/new">+ new user</QueryPreservingLink>
            <QueryPreservingLink to="/auth">sign in?</QueryPreservingLink>
          </>
        )}
      </span>
      )}
    </header>
  );
};
