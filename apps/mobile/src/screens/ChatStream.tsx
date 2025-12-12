import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type StreamReader = {
  read: () => Promise<{done: boolean; value?: Uint8Array}>;
};

type StreamLike = {
  getReader: () => StreamReader;
};

type StreamDecoder = {
  decode: (input?: Uint8Array, options?: {stream?: boolean}) => string;
};

const API_BASE = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

async function streamChat(prompt: string, onChunk: (text: string) => void, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({prompt}),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} ${errorText}`);
  }

  const stream = (response as {body?: StreamLike | null}).body;

  if (!stream || typeof stream.getReader !== 'function') {
    throw new Error('Streaming not supported in this environment');
  }

  const reader = stream.getReader();
  const decoder =
    typeof (globalThis as {TextDecoder?: new () => StreamDecoder}).TextDecoder !== 'undefined'
      ? new (globalThis as unknown as {TextDecoder: new () => StreamDecoder}).TextDecoder()
      : null;

  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      break;
    }

    if (value && decoder) {
      const text = decoder.decode(value, {stream: true});
      onChunk(text);
    }
  }

  if (decoder) {
    const finalText = decoder.decode();
    if (finalText) {
      onChunk(finalText);
    }
  }
}

export default function ChatStream() {
  const [prompt, setPrompt] = useState('Hello from RN');
  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const apiBaseLabel = useMemo(() => API_BASE.replace('http://', ''), []);

  const handleStart = useCallback(async () => {
    if (streaming) {
      return;
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    controllerRef.current = controller;

    setStreaming(true);
    setOutput('');
    setError(null);

    try {
      await streamChat(prompt, chunk => {
        setOutput(prev => prev + chunk);
      }, controller?.signal);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  }, [prompt, streaming]);

  const handleClear = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }

    setOutput('');
    setError(null);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Streaming Chat Demo</Text>
        <Text style={styles.subtitle}>Endpoint: {API_BASE}/api/chat/stream ({apiBaseLabel})</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prompt</Text>
          <TextInput
            multiline
            value={prompt}
            onChangeText={setPrompt}
            style={styles.input}
            placeholder="Ask me anything"
          />
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button title={streaming ? 'Streaming…' : 'Start Stream'} onPress={handleStart} disabled={streaming} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Clear" onPress={handleClear} />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.outputContainer}>
          <Text style={styles.outputLabel}>Streamed Output</Text>
          <Text style={styles.outputText}>{output || 'Awaiting output…'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  outputContainer: {
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    padding: 12,
    gap: 6,
    minHeight: 160,
  },
  outputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  outputText: {
    fontFamily: 'Menlo',
    fontSize: 14,
    color: '#0f172a',
  },
});
