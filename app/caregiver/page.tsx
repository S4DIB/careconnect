// Comprehensive Caregiver Dashboard with Tabs
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';

interface LinkedUser {
  id: string;
  elderly_user: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
  };
  created_at: string;
}

interface HealthSummary {
  id: string;
  date: string;
  mood_summary: string | null;
  symptoms: string[];
  medication_adherence_rate: number | null;
  total_checkins: number;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  user: any;
  created_at: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  total_stock: number;
  low_stock_threshold: number;
}

interface CheckIn {
  id: string;
  transcript: string;
  detected_keywords: string[];
  mood: string;
  created_at: string;
}

export default function CaregiverDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LinkedUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'medications' | 'checkins' | 'alerts'>('overview');
  
  // Overview tab data
  const [userSummaries, setUserSummaries] = useState<HealthSummary[]>([]);
  
  // Medications tab data
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [adherencePeriod, setAdherencePeriod] = useState<'week' | 'month'>('week');
  
  // Check-ins tab data
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  
  // Alerts tab data (global, not per user)
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Link form
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    fetchLinkedUsers();
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (selectedUser && activeTab === 'overview') {
      fetchUserSummaries(selectedUser.elderly_user.id);
    } else if (selectedUser && activeTab === 'medications') {
      fetchMedications(selectedUser.elderly_user.id);
      fetchAdherence(selectedUser.elderly_user.id, adherencePeriod);
    } else if (selectedUser && activeTab === 'checkins') {
      fetchCheckins(selectedUser.elderly_user.id);
    }
  }, [selectedUser, activeTab, adherencePeriod]);

  const fetchLinkedUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/caregiver/links', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLinkedUsers(data.links || []);
      } else {
        setError(data.error || 'Failed to fetch linked users');
      }
    } catch (err) {
      console.error('Error fetching linked users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSummaries = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/summary?user_id=${userId}&limit=7`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUserSummaries(data.summaries || []);
      }
    } catch (err) {
      console.error('Error fetching summaries:', err);
    }
  };

  const fetchMedications = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/caregiver/medications?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error('Error fetching medications:', err);
    }
  };

  const fetchAdherence = async (userId: string, period: 'week' | 'month') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/caregiver/adherence?user_id=${userId}&period=${period}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAdherenceData(data);
      }
    } catch (err) {
      console.error('Error fetching adherence:', err);
    }
  };

  const fetchCheckins = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/caregiver/checkins?user_id=${userId}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCheckins(data.checkins || []);
      }
    } catch (err) {
      console.error('Error fetching check-ins:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/caregiver/alerts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const handleLinkUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLinkLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/caregiver/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ elderly_user_email: linkEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setLinkEmail('');
        setShowLinkForm(false);
        fetchLinkedUsers();
        fetchAlerts();
      } else {
        setError(data.error || 'Failed to link user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link user');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkUser = async (linkId: string) => {
    if (!confirm('Are you sure you want to unlink this user?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/caregiver/links?id=${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setSuccess('User unlinked successfully');
        setSelectedUser(null);
        fetchLinkedUsers();
        fetchAlerts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error unlinking user:', err);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      await fetch('/api/caregiver/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ alertId }),
      });

      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const handleSelectUser = (user: LinkedUser) => {
    setSelectedUser(user);
    setActiveTab('overview');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default: return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Caregiver Dashboard</h1>
        <Button onClick={() => setShowLinkForm(!showLinkForm)}>
          {showLinkForm ? 'Cancel' : '+ Link Elderly User'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Link User Form */}
      {showLinkForm && (
        <Card title="Link to Elderly User">
          <p className="text-gray-600 mb-4">
            Enter the email address of the elderly user you want to monitor. 
            They must have already signed up as an "Elderly User".
          </p>
          <form onSubmit={handleLinkUser} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="elderly.user@email.com"
                required
              />
            </div>
            <Button type="submit" disabled={linkLoading}>
              {linkLoading ? 'Linking...' : 'Link User'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Linked Users Sidebar */}
        <div className="lg:col-span-1">
          <Card title="Linked Users">
            {linkedUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-600 mb-4">No linked users yet</p>
                <Button onClick={() => setShowLinkForm(true)} size="sm">
                  Link Your First User
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedUsers.map((link) => (
                  <div
                    key={link.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === link.id
                        ? 'bg-primary-100 border-2 border-primary-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => handleSelectUser(link)}
                  >
                    <p className="font-medium text-gray-800">
                      {link.elderly_user.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {link.elderly_user.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Linked {format(new Date(link.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {selectedUser ? (
            <div className="space-y-6">
              {/* User Header */}
              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedUser.elderly_user.full_name || 'Unknown User'}
                    </h2>
                    <p className="text-gray-600">{selectedUser.elderly_user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/messages?user=${selectedUser.elderly_user.id}`)}
                      variant="primary"
                      size="sm"
                    >
                      💬 Send Message
                    </Button>
                    <Button
                      onClick={() => handleUnlinkUser(selectedUser.id)}
                      variant="danger"
                      size="sm"
                    >
                      Unlink
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {(['overview', 'medications', 'checkins', 'alerts'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab === 'overview' && '📊 Overview'}
                      {tab === 'medications' && '💊 Medications'}
                      {tab === 'checkins' && '🩺 Check-ins'}
                      {tab === 'alerts' && `🚨 Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}`}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <Card title="Recent Health Summaries">
                  {userSummaries.length === 0 ? (
                    <p className="text-gray-600">
                      No health summaries available. The user needs to complete daily check-ins.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {userSummaries.map((summary) => (
                        <div
                          key={summary.id}
                          className="border rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-800">
                              {format(new Date(summary.date), 'EEEE, MMM dd, yyyy')}
                            </span>
                            <span className="text-sm text-gray-500">
                              {summary.total_checkins} check-in(s)
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Mood:</span>
                              <p className="font-medium">
                                {summary.mood_summary || 'Not available'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Symptoms:</span>
                              <p className="font-medium">
                                {summary.symptoms?.length > 0
                                  ? summary.symptoms.join(', ')
                                  : 'None detected'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Medication:</span>
                              <p className="font-medium">
                                {summary.medication_adherence_rate?.toFixed(0) || 0}% adherence
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {activeTab === 'medications' && (
                <div className="space-y-6">
                  {/* Medications List */}
                  <Card title="Active Medications">
                    {medications.length === 0 ? (
                      <p className="text-gray-600">No active medications found.</p>
                    ) : (
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
                              <p className={`text-xs ${med.total_stock <= med.low_stock_threshold ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                Stock: {med.total_stock} {med.total_stock <= med.low_stock_threshold && '⚠️'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Adherence Report */}
                  <Card title="Medication Adherence Report">
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => setAdherencePeriod('week')}
                        className={`px-4 py-2 rounded ${
                          adherencePeriod === 'week'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        This Week
                      </button>
                      <button
                        onClick={() => setAdherencePeriod('month')}
                        className={`px-4 py-2 rounded ${
                          adherencePeriod === 'month'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        This Month
                      </button>
                    </div>

                    {adherenceData ? (
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded">
                          <p className="text-sm text-gray-600 mb-2">
                            Period: {adherenceData.startDate} to {adherenceData.endDate}
                          </p>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="text-2xl font-bold text-green-600">
                                {adherenceData.overall.adherenceRate}%
                              </p>
                              <p className="text-sm text-gray-600">Overall Adherence</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-gray-800">
                                {adherenceData.overall.takenCount}
                              </p>
                              <p className="text-sm text-gray-600">Taken</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-red-600">
                                {adherenceData.overall.skippedCount}
                              </p>
                              <p className="text-sm text-gray-600">Skipped</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-yellow-600">
                                {adherenceData.overall.laterCount}
                              </p>
                              <p className="text-sm text-gray-600">Later</p>
                            </div>
                          </div>
                        </div>

                        {adherenceData.byMedication.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-800 mb-3">By Medication</h4>
                            <div className="space-y-3">
                              {adherenceData.byMedication.map((medStat: any) => (
                                <div key={medStat.medication.id} className="bg-gray-50 p-3 rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-gray-800">
                                      {medStat.medication.name}
                                    </span>
                                    <span className={`font-bold ${
                                      medStat.adherenceRate >= 80 ? 'text-green-600' :
                                      medStat.adherenceRate >= 50 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {medStat.adherenceRate.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Taken: {medStat.taken} | Skipped: {medStat.skipped} | Later: {medStat.later}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">Loading adherence data...</p>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === 'checkins' && (
                <Card title="Health Check-in History">
                  {checkins.length === 0 ? (
                    <p className="text-gray-600">No check-ins available yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {checkins.map((checkin) => (
                        <div
                          key={checkin.id}
                          className="border rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-500">
                              {format(new Date(checkin.created_at), 'MMM dd, yyyy h:mm a')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              checkin.mood === 'good' ? 'bg-green-100 text-green-800' :
                              checkin.mood === 'bad' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {checkin.mood || 'neutral'}
                            </span>
                          </div>
                          <p className="text-gray-800 mb-2">{checkin.transcript}</p>
                          {checkin.detected_keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {checkin.detected_keywords.map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {activeTab === 'alerts' && (
                <Card title="All Alerts & Notifications">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">✅</div>
                      <p className="text-gray-600">No alerts! Everything looks good.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`border-l-4 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                                <span className="font-medium text-sm uppercase">
                                  {alert.type.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="font-medium mb-1">{alert.message}</p>
                              <p className="text-sm opacity-75">
                                {format(new Date(alert.created_at), 'MMM dd, yyyy h:mm a')}
                              </p>
                            </div>
                            {alert.type === 'low_stock' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleResolveAlert(alert.id)}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Select a User
                </h3>
                <p className="text-gray-600">
                  Click on a linked user to view their health information
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
