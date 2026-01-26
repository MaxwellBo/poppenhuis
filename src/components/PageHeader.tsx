import React, { useState, useEffect } from 'react';
import { QueryPreservingLink } from './QueryPreservingLink';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import type { FirebaseUser, FirebaseManifest } from '../manifest';

// Module-level cache to persist state across component remounts
let cachedCurrentUser: User | null = null;
let cachedLoading = true;
let cachedAccountUsers: FirebaseUser[] = [];

interface PageHeaderProps {
  children: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(cachedCurrentUser);
  const [loading, setLoading] = useState(cachedLoading);
  const [accountUsers, setAccountUsers] = useState<FirebaseUser[]>(cachedAccountUsers);

  const totalCollections = accountUsers.reduce((count, user) => {
    return count + (user.collections ? Object.keys(user.collections).length : 0);
  }, 0);

  const getNewCollectionLink = () => {
    if (accountUsers.length === 1) {
      return `/${accountUsers[0].id}/new`;
    }
    return '/auth';
  };

  const getNewItemLink = () => {
    if (accountUsers.length === 1 && totalCollections === 1) {
      const user = accountUsers[0];
      const collectionId = user.collections ? Object.keys(user.collections)[0] : null;
      if (collectionId) {
        return `/${user.id}/${collectionId}/new`;
      }
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      cachedCurrentUser = user;
      cachedLoading = false;
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch Firebase users when authenticated
  useEffect(() => {
    if (!currentUser) {
      cachedAccountUsers = [];
      setAccountUsers([]);
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
        
        cachedAccountUsers = users;
        setAccountUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  return (
    <header className="page-header">
      <div className="page-header-auth">
        {loading ? (
          <span>loading</span>
        ) : (
          <span style={{ display: 'flex', gap: '1ch', alignItems: 'center' }}>
            {currentUser ? (
              <>
                {getNewItemLink() ? (
                  <QueryPreservingLink to={getNewItemLink()!}>+ new item</QueryPreservingLink>
                ) : totalCollections === 0 ? (
                  <abbr title="create a collection first"><s>+ new item</s></abbr>
                ) : (
                  <abbr title="more than one collection"><s>+ new item</s></abbr>
                )}
                {accountUsers.length === 1 ? (
                  <QueryPreservingLink to={getNewCollectionLink()}>+ new collection</QueryPreservingLink>
                ) : (
                  <abbr title="more than one user"><s>+ new collection</s></abbr>
                )}
                {accountUsers.length > 0 && (
                  <span style={{ display: 'flex', gap: '0.5ch' }}>
                    {accountUsers.map((user) => (
                      <QueryPreservingLink key={user.id} to={`/${user.id}`}>
                        /{user.id}
                      </QueryPreservingLink>
                    ))}
                  </span>
                )}
                <QueryPreservingLink to="/auth">account?</QueryPreservingLink>
              </>
            ) : (
              <>
                <abbr title="sign in to create an item"><s>+ new item</s></abbr>
                <abbr title="sign in to create a collection"><s>+ new collection</s></abbr>
                <span>→</span>
                <QueryPreservingLink to="/auth">sign in?</QueryPreservingLink>
              </>
            )}
          </span>
        )}
      </div>
      <h1>{children}</h1>
    </header>
  );
};
