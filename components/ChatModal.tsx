// components/ChatModal.tsx - Landmark Chat Interface
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendChatMessage, getConversationHistory, formatChatMessage, startChatSession } from '../services/chatService';
import { PlaceInfo } from '../types';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  formattedTime: string;
}

interface ChatModalProps {
  visible: boolean;
  landmarkInfo: PlaceInfo;
  onClose: () => void;
}

export function ChatModal({ visible, landmarkInfo, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Initialize chat session when modal opens
  useEffect(() => {
    if (visible && landmarkInfo) {
      const sessionId = startChatSession(landmarkInfo);
      setChatSessionId(sessionId);
      
      // Load existing conversation history
      const history = getConversationHistory(sessionId);
      const formattedHistory = history.map(msg => 
        formatChatMessage(msg, msg.role === 'user')
      );
      setMessages(formattedHistory);

      // Add welcome message if no history
      if (history.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome_' + Date.now(),
          content: `Hello! I'm your personal guide for ${landmarkInfo.name}. Ask me anything about its history, architecture, significance, or interesting facts!`,
          isUser: false,
          timestamp: new Date().toISOString(),
          formattedTime: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [visible, landmarkInfo]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Dismiss keyboard properly after sending message
    inputRef.current?.blur();
    setTimeout(() => inputRef.current?.focus(), 100);

    // Add user message to UI immediately
    const userChatMessage: ChatMessage = formatChatMessage(userMessage, true);
    setMessages(prev => [...prev, userChatMessage]);

    setIsLoading(true);

    try {
      const response = await sendChatMessage(landmarkInfo, userMessage);

      if (response.success) {
        // Add AI response to UI
        const aiChatMessage: ChatMessage = formatChatMessage(response.message, false);
        setMessages(prev => [...prev, aiChatMessage]);
      } else {
        // Show error message
        const errorMessage: ChatMessage = {
          id: 'error_' + Date.now(),
          content: response.message || 'Sorry, I encountered an error. Please try again.',
          isUser: false,
          timestamp: new Date().toISOString(),
          formattedTime: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Chat Error', 'Unable to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up keyboard state properly
    inputRef.current?.blur();
    
    // Clear state
    setMessages([]);
    setInputText('');
    
    // Small delay to ensure keyboard is dismissed before closing modal
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble
        ]}
      >
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.aiText
        ]}>
          {message.content}
        </Text>
        <Text style={[
          styles.messageTime,
          message.isUser ? styles.userTime : styles.aiTime
        ]}>
          {message.formattedTime}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Chat about</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {landmarkInfo.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4A90E2" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about history, architecture, or fun facts..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
                enablesReturnKeyAutomatically={true}
                autoCorrect={true}
                spellCheck={true}
                textContentType="none"
                autoCapitalize="sentences"
                keyboardAppearance="default"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Text style={styles.sendButtonText}>
                  {isLoading ? '⏳' : '➤'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'ios' ? 44 : 24, // Manual status bar handling
  },
  keyboardContainer: {
    flex: 1,
  },
  
  // Header
  header: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },

  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: width * 0.8,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: '#f1f3f4',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  userTime: {
    color: '#ffffff',
    textAlign: 'right',
  },
  aiTime: {
    color: '#666666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    marginVertical: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },

  // Input
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12, // Handle home indicator area
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
    paddingVertical: 8,
    color: '#333333',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});