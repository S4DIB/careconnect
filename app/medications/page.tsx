// Medications management page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Medication } from '@/lib/types';
import { requestNotificationPermission, showMedicationReminder } from '@/utils/notifications';

export default function MedicationsPage() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    total_stock: 0,
    low_stock_threshold: 5,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      fetchMedications();
      requestNotificationPermission();
      setupMedicationReminders();
    };
    checkAuth();
  }, [router]);

  const fetchMedications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/medications', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMedications(data.medications || []);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupMedicationReminders = () => {
    // Check every minute for medication reminders
    setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      medications.forEach((med) => {
        if (med.time === currentTime && med.is_active) {
          showMedicationReminder(med.name, med.dosage, med.id);
        }
      });
    }, 60000); // Check every minute
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/medications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add medication');
      }

      setSuccess('Medication added successfully!');
      setShowAddForm(false);
      setFormData({
        name: '',
        dosage: '',
        time: '',
        total_stock: 0,
        low_stock_threshold: 5,
      });
      fetchMedications();
    } catch (error: any) {
      setError(error.message || 'Failed to add medication');
    }
  };

  const handleLogMedication = async (
    medicationId: string,
    status: 'taken' | 'later' | 'skipped'
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/medications/log', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          medication_id: medicationId,
          status,
          scheduled_time: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log medication');
      }

      setSuccess(`Medication marked as ${status}!`);
      fetchMedications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to log medication');
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/medications?id=${medicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete medication');
      }

      setSuccess('Medication deleted successfully!');
      fetchMedications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete medication');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Medications</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Medication'}
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

      {showAddForm && (
        <Card title="Add New Medication">
          <form onSubmit={handleAddMedication}>
            <Input
              label="Medication Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Aspirin"
              required
            />

            <Input
              label="Dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="e.g., 100mg"
              required
            />

            <Input
              label="Time (24-hour format)"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />

            <Input
              label="Total Stock"
              type="number"
              value={formData.total_stock}
              onChange={(e) =>
                setFormData({ ...formData, total_stock: parseInt(e.target.value) })
              }
              min="0"
              required
            />

            <Input
              label="Low Stock Alert Threshold"
              type="number"
              value={formData.low_stock_threshold}
              onChange={(e) =>
                setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })
              }
              min="1"
              required
            />

            <Button type="submit" className="w-full">
              Add Medication
            </Button>
          </form>
        </Card>
      )}

      {medications.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💊</div>
            <p className="text-gray-600 mb-4">No medications added yet.</p>
            <Button onClick={() => setShowAddForm(true)}>Add Your First Medication</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {medications.map((med) => (
            <Card key={med.id}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">{med.name}</h3>
                  <p className="text-gray-600 mb-2">Dosage: {med.dosage}</p>
                  <p className="text-primary-600 font-medium mb-2">Time: {med.time}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span
                      className={`font-medium ${
                        med.total_stock <= med.low_stock_threshold
                          ? 'text-red-600'
                          : 'text-gray-700'
                      }`}
                    >
                      Stock: {med.total_stock}
                      {med.total_stock <= med.low_stock_threshold && ' ⚠️'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={() => handleLogMedication(med.id, 'taken')}
                    variant="success"
                    size="sm"
                  >
                    ✓ Taken
                  </Button>
                  <Button
                    onClick={() => handleLogMedication(med.id, 'skipped')}
                    variant="secondary"
                    size="sm"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={() => handleDeleteMedication(med.id)}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

