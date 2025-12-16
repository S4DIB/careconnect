// OAuth callback page
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

function CallbackContent() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Checking authentication...');
        
        // Check for hash fragment with tokens (OAuth implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          setStatus('Setting up session...');
          
          // Set session from tokens in URL
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (setSessionError) {
            console.error('Set session error:', setSessionError);
            setError('Failed to set session');
            setTimeout(() => router.push('/auth/signin'), 2000);
            return;
          }
          
          if (data.session) {
            await setupUserProfile(data.session.user);
            return;
          }
        }
        
        // Try to get existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        if (session && session.user) {
          await setupUserProfile(session.user);
          return;
        }

        // No session found, wait for auth state change
        setStatus('Waiting for authentication...');
        
        let handled = false;
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('Auth event:', event, newSession?.user?.email);
          
          if (!handled && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession) {
            handled = true;
            subscription.unsubscribe();
            await setupUserProfile(newSession.user);
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!handled) {
            subscription.unsubscribe();
            setError('Authentication timeout. Please try again.');
            setTimeout(() => router.push('/auth/signin'), 2000);
          }
        }, 5000);

      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => router.push('/auth/signin'), 3000);
      }
    };

    const setupUserProfile = async (user: any) => {
      try {
        setStatus('Session found, setting up profile...');

        // Get role from multiple sources (URL params, localStorage, sessionStorage)
        let pendingRole: string | null = null;
        if (typeof window !== 'undefined') {
          // Try URL params first
          const urlParams = new URLSearchParams(window.location.search);
          const urlRole = urlParams.get('role');
          
          // Try localStorage second (more persistent)
          const localRole = localStorage.getItem('pending_role');
          
          // Try sessionStorage third
          const sessionRole = sessionStorage.getItem('pending_role');
          
          pendingRole = urlRole || localRole || sessionRole;
          
          console.log('Role detection:', { urlRole, localRole, sessionRole, pendingRole });
          
          // Clean up storage
          localStorage.removeItem('pending_role');
          sessionStorage.removeItem('pending_role');
        }

        // Check if user profile exists
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch user error:', fetchError);
        }

        if (!existingUser) {
          setStatus('Creating your profile...');
          
          const role = pendingRole || 'elderly_user';

          // Create user profile
          const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            role: role as 'elderly_user' | 'caregiver',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          });

          if (insertError) {
            console.error('Insert user error:', insertError);
          } else {
            console.log('User profile created with role:', role);
          }
        } else if (pendingRole && existingUser.role !== pendingRole) {
          // User exists but signed up with different role - update it
          setStatus('Updating your role...');
          console.log('Updating role from', existingUser.role, 'to', pendingRole);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: pendingRole })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('Update role error:', updateError);
          } else {
            console.log('Role updated to:', pendingRole);
          }
        }

        setStatus('Redirecting to dashboard...');
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      } catch (err) {
        console.error('Setup profile error:', err);
        // Still try to redirect - user might be authenticated
        router.push('/dashboard');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="text-red-600 text-xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to sign in...</p>
          </>
        ) : (
          <>
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Completing Sign In</h2>
            <p className="text-gray-600">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

