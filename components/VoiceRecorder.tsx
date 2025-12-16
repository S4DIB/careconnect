// Voice recorder component for messages
'use client';

import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import Button from './Button';
import { useEffect } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const {
    isRecording,
    audioBlob,
    audioURL,
    duration,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  useEffect(() => {
    if (audioBlob && duration > 0) {
      onRecordingComplete(audioBlob, duration);
    }
  }, [audioBlob, duration, onRecordingComplete]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-4">
        {!isRecording && !audioBlob && (
          <Button onClick={startRecording} variant="primary" size="lg">
            🎤 Start Recording
          </Button>
        )}

        {isRecording && (
          <Button onClick={stopRecording} variant="danger" size="lg">
            ⏹️ Stop Recording
          </Button>
        )}

        {audioBlob && (
          <div className="space-x-3">
            <audio 
              controls 
              src={audioURL} 
              className="h-10"
              preload="metadata"
              onError={(e) => {
                console.error('Preview playback error:', e);
                const target = e.target as HTMLAudioElement;
                console.error('Error:', target.error);
              }}
            />
            <Button onClick={resetRecording} variant="secondary" size="sm">
              Record Again
            </Button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center space-x-2 text-red-600">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="font-medium">Recording...</span>
        </div>
      )}
    </div>
  );
}

