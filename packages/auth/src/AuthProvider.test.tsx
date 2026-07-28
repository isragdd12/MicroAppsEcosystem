import { act, render, screen, waitFor } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';

import { AuthProvider, useAuth } from './AuthProvider';

function createFakeClient(): SupabaseClient {
  let authChangeCallback: ((event: string, session: unknown) => void) | null =
    null;

  const fakeSession = {
    user: { id: 'user-1', email: 'test@example.com' },
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_at: 9999999999,
  };

  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(
        (callback: (event: string, session: unknown) => void) => {
          authChangeCallback = callback;
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        },
      ),
      signUp: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockImplementation(() => {
        authChangeCallback?.('SIGNED_IN', fakeSession);
        return Promise.resolve({ error: null });
      }),
      signOut: jest.fn().mockImplementation(() => {
        authChangeCallback?.('SIGNED_OUT', null);
        return Promise.resolve({ error: null });
      }),
    },
  } as unknown as SupabaseClient;
}

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="status">{auth.status}</div>
      <div data-testid="email">{auth.session?.user.email ?? 'none'}</div>
      <button
        onClick={() => auth.signInWithEmail('test@example.com', 'password')}
      >
        Sign in
      </button>
      <button onClick={() => auth.signOut()}>Sign out</button>
    </div>
  );
}

describe('AuthProvider / useAuth', () => {
  it('starts at loading, then settles to signed-out with no existing session', async () => {
    const client = createFakeClient();
    render(
      <AuthProvider client={client}>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('signed-out');
    });
  });

  it('transitions to signed-in after signInWithEmail succeeds', async () => {
    const client = createFakeClient();
    render(
      <AuthProvider client={client}>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('signed-out'),
    );

    await act(async () => {
      screen.getByText('Sign in').click();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('signed-in');
    expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
  });

  it('transitions back to signed-out after signOut', async () => {
    const client = createFakeClient();
    render(
      <AuthProvider client={client}>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('signed-out'),
    );
    await act(async () => {
      screen.getByText('Sign in').click();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('signed-in');

    await act(async () => {
      screen.getByText('Sign out').click();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('signed-out');
  });

  it('useAuth throws when used outside an AuthProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      'useAuth must be used within an AuthProvider',
    );
    consoleError.mockRestore();
  });
});
