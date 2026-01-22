import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { Helmet } from 'react-helmet';
import { auth } from '../firebase';
import { PageHeader } from '../components/PageHeader';
import { QueryPreservingLink } from '../components/QueryPreservingLink';
import { Size } from '../components/Size';
import { ModelViewerWrapper } from '../components/ModelViewerWrapper';
import type { FirebaseUser, FirebaseManifest } from '../manifest';

type AuthMode = 'password' | 'emaillink';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [usersList, setUsersList] = useState<FirebaseUser[]>([]);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
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

  // Check if URL is an email link sign-in on mount
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        completeEmailLinkSignIn(email);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'emaillink') {
        await sendEmailLink(email);
        setMessage('check your email for a sign in link!');
        setEmail('');
      }
    } catch (err: any) {
      setError(err.message || 'an error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/auth');
    } catch (err: any) {
      setError(err.message || 'an error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage('account created successfully!');
      navigate('/auth');
    } catch (err: any) {
      setError(err.message || 'an error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailLink = async (email: string) => {
    const actionCodeSettings = {
      url: window.location.origin + '/auth',
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  };

  const completeEmailLinkSignIn = async (email: string) => {
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      window.history.replaceState(null, '', '/auth');
      navigate('/auth');
    } catch (error) {
      console.error('Error completing email link sign in:', error);
      setError('Failed to complete sign in');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMessage('signed out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Failed to sign out');
    }
  };

  if (authLoading) {
    return (
      <div>
        <Helmet><title>auth - poppenhuis</title></Helmet>
        <PageHeader>loading...</PageHeader>
      </div>
    );
  }

  // If already logged in, show logout option
  if (currentUser) {
    return (
      <div>
        <Helmet><title>account - poppenhuis</title></Helmet>
        <PageHeader>account</PageHeader>
        {message && <div style={{ padding: '1ch', margin: '1ch', border: "1px dotted black"}}>{message}</div>}
        {error && <div style={{ padding: '1ch', margin: '1ch', border: "1px dotted black"}}>{error}</div>}
        <dl>
          <dt>email</dt>
          <dd>{currentUser.email}</dd>
          <dt>firebase uid</dt>
          <dd><code>{currentUser.uid}</code></dd>
        </dl>

        <div style={{ marginTop: '1ch' }}>
          {usersList.length > 0 ? (
            <ul>
              {usersList.map((user) => (
                <li key={user.id}>
                  <QueryPreservingLink to={`/${user.id}`}>{user.name || user.id}</QueryPreservingLink> <Size ts={user.collections ? Object.values(user.collections) : []} t="collection" />
                  <ul>
                    {user.collections && Object.entries(user.collections).map(([collectionId, collection]) => (
                      <li key={collectionId}>
                        <QueryPreservingLink to={`/${user.id}/${collectionId}`}>{collection.name}</QueryPreservingLink> <Size ts={collection.items ? Object.values(collection.items) : []} t="item" />
                        <div>
                          {collection.items && Object.values(collection.items)[0] && (
                            <ModelViewerWrapper item={Object.values(collection.items)[0]} size="small" />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p>you haven't created any users yet.</p>
          )}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1ch' }}>
          <QueryPreservingLink to="/new">+ new user</QueryPreservingLink>
          <button type="button" onClick={handleLogout}>sign out</button>
        </div>

      </div>
    );
  }

  return (
    <div>
      <Helmet><title>auth - poppenhuis</title></Helmet>
      <PageHeader>auth</PageHeader>

      <form onSubmit={handleSubmit} className="table-form">
        <div className="table-form-row">
          <label>
            <input
              type="radio"
              name="authMode"
              checked={mode === 'password'}
              onChange={() => setMode('password')}
            />
            email / password
          </label>
          <label>
            <input
              type="radio"
              name="authMode"
              checked={mode === 'emaillink'}
              onChange={() => setMode('emaillink')}
            />
            email link
          </label>
        </div>
        <div className="table-form-row">
          <label htmlFor="email">email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {mode === 'password' && (
          <div className="table-form-row">
            <label htmlFor="password">password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        )}

        {error && <div>{error}</div>}
        {message && <div>{message}</div>}

        {mode === 'password' ? (
          <div className="table-form-row">
            <button type="button" onClick={handleSignIn} disabled={loading}>
              sign in
            </button>
            <button type="button" onClick={handleSignUp} disabled={loading}>
              sign up
            </button>
          </div>
        ) : (
          <div className="table-form-row">
            <button type="submit" disabled={loading}>
              {loading ? 'loading...' : 'send email link'}
            </button>
          </div>
        )}
      </form>

      {mode === 'emaillink' && (
        <p style={{ marginTop: "0.5ch" }}>
          you'll receive an email with a link to sign in.
        </p>
      )}
    </div>
  );
}
