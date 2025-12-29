import React, {useCallback, useRef, useState} from 'react';
import {
  Button,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {useAuth} from '../auth/AuthContext';
import {API_BASE} from '../config/api';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AgentScreen() {
  const {token} = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming || !token) {
      if (!token) {
        setError('Please sign in to use the AI agent.');
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setStreaming(true);
    setError(null);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const controller =
        typeof AbortController !== 'undefined' ? new AbortController() : null;
      controllerRef.current = controller;

      const response = await fetch(`${API_BASE}/api/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({prompt: userMessage.content}),
        signal: controller?.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      while (true) {
        const {value, done} = await reader.read();
        if (done) {
          break;
        }

        const text = decoder.decode(value, {stream: true});
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? {...m, content: m.content + text}
              : m,
          ),
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  }, [input, streaming, token]);

  const handleClear = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
  }, []);

  const renderMessage = useCallback(
    ({item}: {item: Message}) => (
      <View
        style={[
          styles.message,
          item.role === 'user' ? styles.userMessage : styles.assistantMessage,
        ]}>
        <Text
          style={[
            styles.messageText,
            item.role === 'user'
              ? styles.userMessageText
              : styles.assistantMessageText,
          ]}>
          {item.content || 'Thinking...'}
        </Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Agent</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Demo</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Chat with an AI agent that can use tools to get weather and time
          information.
        </Text>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about weather, time..."
            editable={!streaming}
          />
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button
              title={streaming ? 'Sending...' : 'Send'}
              onPress={handleSend}
              disabled={streaming || !input.trim()}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Clear" onPress={handleClear} disabled={streaming} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#f8fafc'},
  container: {flex: 1, padding: 16},
  header: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  title: {fontSize: 24, fontWeight: '700', color: '#0f172a'},
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  description: {fontSize: 14, color: '#64748b', marginBottom: 16},
  messageList: {flex: 1, marginBottom: 16},
  messageListContent: {gap: 12},
  message: {padding: 12, borderRadius: 12, maxWidth: '85%'},
  userMessage: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  messageText: {fontSize: 14},
  userMessageText: {color: '#fff'},
  assistantMessageText: {color: '#0f172a'},
  errorText: {color: '#b91c1c', marginBottom: 8},
  inputRow: {marginBottom: 12},
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonRow: {flexDirection: 'row', gap: 12},
  buttonWrapper: {flex: 1},
});
