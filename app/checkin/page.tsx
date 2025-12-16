// Daily health check-in page with voice
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CheckInPage() {
  const router = useRouter();
  const [step, setStep] = useState<'ready' | 'listening' | 'processing' | 'complete'>('ready');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const { speak, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  const {
    isListening,
    transcript: liveTranscript,
    isSupported: asrSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (finalTranscript) => {
      setTranscript((prev) => prev + ' ' + finalTranscript);
    },
    onError: (error) => {
      setError(`Speech recognition error: ${error}`);
      setStep('ready');
    },
  });

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
      }
    };
    checkAuth();
  }, [router]);

  const handleStartCheckIn = () => {
    setTranscript('');
    setError('');
    setStep('listening');

    // Speak the greeting
    speak('Hello, how are you feeling today?');

    // Start listening after speech finishes
    setTimeout(() => {
      startListening();
    }, 3000);
  };

  const handleStopListening = () => {
    stopListening();
    if (transcript || liveTranscript) {
      setStep('processing');
      submitCheckIn(transcript + ' ' + liveTranscript);
    } else {
      setError('No speech detected. Please try again.');
      setStep('ready');
    }
  };

  const submitCheckIn = async (fullTranscript: string) => {
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Session expired. Please sign in again.');
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transcript: fullTranscript.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save check-in');
      }

      // Show confirmation
      speak('Thank you! Your check-in has been recorded.');
      setStep('complete');

      // Generate today's summary
      await fetch('/api/summary', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save check-in');
      setStep('ready');
    }
  };

  if (!asrSupported || !ttsSupported) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-2xl font-semibold mb-4 text-red-600">
              Browser Not Supported
            </h2>
            <p className="text-gray-600 mb-4">
              Your browser doesn't support speech recognition or synthesis.
            </p>
            <p className="text-gray-600">
              Please use a modern browser like Chrome, Edge, or Safari.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="mt-6">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Daily Health Check-In</h1>
          <p className="text-gray-600">Share how you're feeling today</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {step === 'ready' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🎤</div>
              <p className="text-gray-700 mb-6 text-lg">
                Click the button below to start your daily check-in.
                <br />
                You'll be asked how you're feeling today.
              </p>
              <Button onClick={handleStartCheckIn} size="lg" className="px-8">
                Start Daily Check-In
              </Button>
            </div>
          )}

          {step === 'listening' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6 animate-pulse">🎤</div>
              {isSpeaking ? (
                <p className="text-xl text-primary-600 font-medium mb-4">
                  🔊 Listening to greeting...
                </p>
              ) : (
                <>
                  <p className="text-xl text-red-600 font-medium mb-4">
                    🔴 Recording... Speak now!
                  </p>
                  <p className="text-gray-600 mb-6">
                    Tell me about how you're feeling. Mention any pain, symptoms, or concerns.
                  </p>
                </>
              )}

              {(transcript || liveTranscript) && (
                <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-500 mb-2">What you said:</p>
                  <p className="text-gray-800">{transcript + ' ' + liveTranscript}</p>
                </div>
              )}

              {/* Always show stop button when in listening step */}
              <Button 
                onClick={handleStopListening} 
                variant="danger" 
                size="lg"
                className="mt-4"
              >
                ⏹️ Stop & Submit
              </Button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="text-gray-700 mt-4 text-lg">Processing your check-in...</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">✅</div>
              <p className="text-xl text-green-600 font-medium mb-4">
                Check-in completed successfully!
              </p>
              <p className="text-gray-600">
                Your responses have been recorded and analyzed.
              </p>
              {transcript && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-6 text-left">
                  <p className="text-sm text-green-700 mb-2 font-medium">Your check-in:</p>
                  <p className="text-gray-800">{transcript}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 text-center">
        <Button onClick={() => router.push('/dashboard')} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

