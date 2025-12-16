// Custom hook for audio recording using MediaRecorder API
'use client';

import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      // Use the most compatible format for Chrome/Edge
      // audio/webm with opus codec is widely supported
      let mimeType = 'audio/webm';
      let options: MediaRecorderOptions = {};
      
      // Try different formats in order of compatibility
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
        options = { mimeType, audioBitsPerSecond: 128000 };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
        options = { mimeType, audioBitsPerSecond: 128000 };
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
        options = { mimeType };
      } else {
        // Fallback to default
        options = {};
      }
      
      // Create MediaRecorder with best supported format
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      console.log('Recording with MIME type:', mimeType);
      console.log('MediaRecorder options:', options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        
        // Calculate duration
        const endTime = Date.now();
        const durationInSeconds = Math.floor((endTime - startTimeRef.current) / 1000);
        setDuration(durationInSeconds);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please grant permission.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioURL('');
    setDuration(0);
    setError('');
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    audioBlob,
    audioURL,
    duration,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}

