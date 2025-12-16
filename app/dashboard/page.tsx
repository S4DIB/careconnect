// Main dashboard page
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { User, DailySummary, Medication, StockAlert } from '@/lib/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async (authUser: any) => {
      if (!isMounted) return;
      
      try {
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User profile doesn't exist, create it
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email!,
              role: 'elderly_user',
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
            })
            .select()
            .single();
          
          if (!createError && isMounted) {
            setUser(newUser);
          }
        } else if (userData && isMounted) {
          setUser(userData);
        }

        const currentUser = userData || { role: 'elderly_user' };

        if (currentUser?.role === 'elderly_user' && isMounted) {
          // Fetch today's summary
          const today = format(new Date(), 'yyyy-MM-dd');
          const { data: summaryData } = await supabase
            .from('daily_summaries')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('date', today)
            .single();

          if (isMounted) setSummary(summaryData);

          // Fetch medications
          const { data: medsData } = await supabase
            .from('medications')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('is_active', true)
            .order('time');

          if (isMounted) setMedications(medsData || []);

          // Fetch unresolved alerts
          const { data: alertsData } = await supabase
            .from('stock_alerts')
            .select('*, medication:medications(*)')
            .eq('user_id', authUser.id)
            .eq('is_resolved', false)
            .order('created_at', { ascending: false });

          if (isMounted) setAlerts(alertsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const initAuth = async () => {
      // First try to get session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        fetchData(session.user);
        return;
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Dashboard auth event:', event, session?.user?.email);
          
          if (session?.user) {
            fetchData(session.user);
          } else if (event === 'SIGNED_OUT') {
            router.push('/auth/signin');
          }
        }
      );

      // Wait a moment and check again
      setTimeout(async () => {
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession?.user) {
          fetchData(retrySession.user);
        } else {
          // No session after waiting, redirect to signin
          if (isMounted) {
            setLoading(false);
            router.push('/auth/signin');
          }
        }
      }, 1000);

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user.full_name || user.email}!
        </h1>
      </div>

      {user.role === 'elderly_user' ? (
        <>
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded flex justify-between items-center"
                >
                  <p className="text-yellow-800 font-medium">⚠️ {alert.message}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) return;
                        
                        await supabase
                          .from('stock_alerts')
                          .update({ is_resolved: true })
                          .eq('id', alert.id);
                        
                        // Refresh alerts
                        const { data: alertsData } = await supabase
                          .from('stock_alerts')
                          .select('*, medication:medications(*)')
                          .eq('user_id', user!.id)
                          .eq('is_resolved', false)
                          .order('created_at', { ascending: false });
                        
                        setAlerts(alertsData || []);
                      } catch (err) {
                        console.error('Error resolving alert:', err);
                      }
                    }}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-2">🎤</div>
                <h3 className="text-lg font-semibold mb-2">Daily Check-In</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Share how you're feeling today
                </p>
                <Button onClick={() => router.push('/checkin')} className="w-full">
                  Start Check-In
                </Button>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-2">💊</div>
                <h3 className="text-lg font-semibold mb-2">Medications</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {medications.length} active medication{medications.length !== 1 ? 's' : ''}
                </p>
                <Button onClick={() => router.push('/medications')} className="w-full">
                  View Medications
                </Button>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <h3 className="text-lg font-semibold mb-2">Messages</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect with your caregiver
                </p>
                <Button onClick={() => router.push('/messages')} className="w-full">
                  View Messages
                </Button>
              </div>
            </Card>
          </div>

          {/* Today's Summary */}
          <Card title="Today's Summary">
            {summary ? (
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Mood:</span>{' '}
                  <span className="text-gray-900">{summary.mood_summary || 'Not available'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Symptoms:</span>{' '}
                  <span className="text-gray-900">
                    {summary.symptoms?.length > 0 ? summary.symptoms.join(', ') : 'None detected'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Medication Adherence:</span>{' '}
                  <span className="text-gray-900">
                    {summary.medication_adherence_rate?.toFixed(0) || 0}%
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Check-ins:</span>{' '}
                  <span className="text-gray-900">{summary.total_checkins}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                No summary available yet. Complete your first check-in to generate a summary!
              </p>
            )}
          </Card>

          {/* Upcoming Medications */}
          {medications.length > 0 && (
            <Card title="Today's Medications">
              <div className="space-y-3">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className="flex justify-between items-center border-b pb-2 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.dosage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary-600 font-medium">{med.time}</p>
                      <p className="text-xs text-gray-500">Stock: {med.total_stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Caregiver - redirect to caregiver dashboard */}
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-semibold mb-4">Caregiver Dashboard</h2>
              <p className="text-gray-600 mb-6">
                View and manage your linked elderly users
              </p>
              <div className="space-x-4">
                <Button onClick={() => router.push('/caregiver')}>
                  Go to Caregiver Dashboard
                </Button>
                <Button onClick={() => router.push('/messages')} variant="secondary">
                  View Messages
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

