import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import { PageHeader } from '../components/PageHeader';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect after successful sign in
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from);
    } catch (err: any) {
      setError(err.message || 'an error occurred');
    } finally {
      setLoading(false);
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
        <PageHeader>loading...</PageHeader>
      </div>
    );
  }

  // If already logged in, show logout option
  if (currentUser) {
    return (
      <div>
        <PageHeader>account</PageHeader>
        <p>signed in as: <strong>{currentUser.email}</strong></p>
        {message && <div>{message}</div>}
        {error && <div>{error}</div>}
        <button type="button" onClick={handleLogout}>sign out</button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader>login</PageHeader>

      <form onSubmit={handleSubmit}>
        <div>
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

        <div>
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

        {error && <div>{error}</div>}
        {message && <div>{message}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'loading...' : 'login'}
        </button>
      </form>
    </div>
  );
}
