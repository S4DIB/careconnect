// Two-way voice messaging page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import VoiceRecorder from '@/components/VoiceRecorder';
import { User, VoiceMessage, LinkedUser } from '@/lib/types';
import { format } from 'date-fns';

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [linkedUsers, setLinkedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recordedAudio, setRecordedAudio] = useState<{
    blob: Blob;
    duration: number;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/auth/signin');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(userData);
      fetchMessages();
      
      if (userData?.role === 'caregiver') {
        fetchLinkedUsers();
      }
    };
    checkAuth();
  }, [router]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedUsers = async () => {
    try {
      const response = await fetch('/api/caregiver/links');
      const data = await response.json();
      if (response.ok) {
        setLinkedUsers(data.links || []);
      }
    } catch (error) {
      console.error('Error fetching linked users:', error);
    }
  };

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    setRecordedAudio({ blob: audioBlob, duration });
  };

  const handleSendMessage = async () => {
    if (!recordedAudio || !selectedRecipient) {
      setError('Please record a message and select a recipient');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('audio', recordedAudio.blob, 'voice-message.webm');
      formData.append('recipient_id', selectedRecipient);
      formData.append('duration_seconds', recordedAudio.duration.toString());

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess('Message sent successfully!');
      setShowRecorder(false);
      setRecordedAudio(null);
      setSelectedRecipient('');
      fetchMessages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to send message');
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, is_read: true }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Get available recipients
  const recipients =
    user.role === 'caregiver'
      ? linkedUsers.map((link) => link.elderly_user)
      : []; // Elderly users will see caregivers who have sent them messages

  // Get unique caregivers who sent messages (for elderly users)
  const caregiverSenders = user.role === 'elderly_user' 
    ? Array.from(
        new Map(
          messages
            .filter((m) => m.sender_id !== user.id)
            .map((m) => [m.sender.id, m.sender])
        ).values()
      )
    : [];

  const allRecipients = user.role === 'caregiver' ? recipients : caregiverSenders;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Voice Messages</h1>
        {allRecipients.length > 0 && (
          <Button onClick={() => setShowRecorder(!showRecorder)}>
            {showRecorder ? 'Cancel' : '🎤 New Message'}
          </Button>
        )}
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

      {showRecorder && (
        <Card title="Record Voice Message">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to:
              </label>
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select recipient...</option>
                {allRecipients.map((recipient: any) => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.full_name || recipient.email}
                  </option>
                ))}
              </select>
            </div>

            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

            {recordedAudio && selectedRecipient && (
              <Button onClick={handleSendMessage} className="w-full" size="lg">
                Send Message
              </Button>
            )}
          </div>
        </Card>
      )}

      {user.role === 'caregiver' && linkedUsers.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 mb-4">
              You haven't linked any elderly users yet.
            </p>
            <p className="text-gray-500 text-sm">
              Contact your administrator to link elderly users to your account.
            </p>
          </div>
        </Card>
      )}

      {messages.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-600 mb-4">No messages yet.</p>
            {allRecipients.length > 0 && (
              <Button onClick={() => setShowRecorder(true)}>Send Your First Message</Button>
            )}
          </div>
        </Card>
      ) : (
        <Card title="All Messages">
          <div className="space-y-4">
            {messages.map((message) => {
              const isSent = message.sender_id === user.id;
              const isUnread = !message.is_read && !isSent;

              return (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 ${
                    isUnread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-800">
                        {isSent ? (
                          <>To: {message.recipient.full_name || message.recipient.email}</>
                        ) : (
                          <>From: {message.sender.full_name || message.sender.email}</>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(message.created_at), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        New
                      </span>
                    )}
                  </div>

                  <audio
                    controls
                    src={message.audio_url}
                    className="w-full mt-2"
                    onPlay={() => {
                      if (isUnread) {
                        handleMarkAsRead(message.id);
                      }
                    }}
                  />

                  {message.duration_seconds && (
                    <p className="text-xs text-gray-500 mt-2">
                      Duration: {message.duration_seconds}s
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

