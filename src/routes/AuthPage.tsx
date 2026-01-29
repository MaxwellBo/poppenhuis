import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  sendPasswordResetEmail,
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

type AuthMode = 'signin' | 'signup' | 'emaillink' | 'forgot';

function formatError(err: unknown): string {
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const parts: string[] = [];
    if (obj.code != null) parts.push(`code: ${obj.code}`);
    if (obj.message != null) parts.push(`message: ${obj.message}`);
    if (obj.stack != null) parts.push(`stack: ${obj.stack}`);
    if (parts.length) return parts.join('\n');
    return JSON.stringify(err, null, 2);
  }
  if (err instanceof Error) return [err.message, err.stack].filter(Boolean).join('\n');
  return String(err);
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
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
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('check your email for a link to reset your password.');
        setEmail('');
      }
    } catch (err: unknown) {
      setError('Error sending email:\n\n' + formatError(err));
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
    } catch (err: unknown) {
      setError('Sign in failed:\n\n' + formatError(err));
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
    } catch (err: unknown) {
      setError('Sign up failed:\n\n' + formatError(err));
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
    } catch (err: unknown) {
      console.error('Error completing email link sign in:', err);
      setError('Failed to complete sign in:\n\n' + formatError(err));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMessage('signed out successfully');
    } catch (err: unknown) {
      console.error('Logout failed:', err);
      setError('Failed to sign out:\n\n' + formatError(err));
    }
  };

  if (authLoading) {
    return (
      <div>
        <Helmet><title>auth - poppenhuis</title></Helmet>
        <PageHeader>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / loading...
        </PageHeader>
      </div>
    );
  }

  // If already logged in, show logout option
  if (currentUser) {
    return (
      <div>
        <Helmet><title>account - poppenhuis</title></Helmet>
        <PageHeader>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / account
        </PageHeader>
        {message && <span style={{ padding: '1ch', margin: '1ch', border: "1px dotted black"}}>{message}</span>}
        {error && <pre style={{ padding: '1ch', margin: '1ch', border: "1px dotted black"}}>{error}</pre>}
        <dl>
          <dt>email</dt>
          <dd>{currentUser.email}</dd>
          <dt>firebase uid</dt>
          <dd><code>{currentUser.uid}</code></dd>
        </dl>

        <button type="button" onClick={handleLogout}>sign out</button>

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
            <>
            <p>you haven't created any users yet.</p>
            <p>
              create a user, then you can create your first collection and add items to it.
            </p>
            </>
          )}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1ch' }}>
          <QueryPreservingLink to="/new">+ new user</QueryPreservingLink>
        </div>

      </div>
    );
  }

  return (
    <div>
      <Helmet><title>auth - poppenhuis</title></Helmet>
      <PageHeader>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / auth
      </PageHeader>

      <form onSubmit={handleSubmit} className="table-form">
        <div className="table-form-row">
          <label>mode</label>
          <div style={{ display: 'table-cell' }}>
            <label>
              <input
                type="radio"
                name="authMode"
                checked={mode === 'signin'}
                onChange={() => setMode('signin')}
              />
              sign in
            </label>
            <label>
              <input
                type="radio"
                name="authMode"
                checked={mode === 'signup'}
                onChange={() => setMode('signup')}
              />
              sign up
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
            <label>
              <input
                type="radio"
                name="authMode"
                checked={mode === 'forgot'}
                onChange={() => setMode('forgot')}
              />
              forgot password
            </label>
          </div>
        </div>
        <div className="table-form-row">
          <label htmlFor="email">email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {(mode === 'signin' || mode === 'signup') && (
          <div className="table-form-row">
            <label htmlFor="password">password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        )}

        {error && (
          <div className="table-form-row">
            <label />
            <pre style={{ display: 'table-cell' }}>{error}</pre>
          </div>
        )}
        {message && (
          <div className="table-form-row">
            <label />
            <div style={{ display: 'table-cell' }}>{message}</div>
          </div>
        )}

        {mode === 'signin' ? (
          <div className="table-form-row">
            <label />
            <button type="button" onClick={handleSignIn} disabled={loading}>
              sign in
            </button>
          </div>
        ) : mode === 'signup' ? (
          <div className="table-form-row">
            <label />
            <button type="button" onClick={handleSignUp} disabled={loading}>
              sign up
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <div className="table-form-row">
            <label />
            <button type="submit" disabled={loading}>
              {loading ? 'loading...' : 'send reset link'}
            </button>
          </div>
        ) : (
          <div className="table-form-row">
            <label />
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

      {mode === 'forgot' && (
        <p style={{ marginTop: "0.5ch" }}>
          enter your email and we'll send you a link to reset your password.
        </p>
      )}
    </div>
  );
}
