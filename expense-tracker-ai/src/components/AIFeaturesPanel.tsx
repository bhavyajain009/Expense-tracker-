import { useState, useRef, useCallback, ChangeEvent } from 'react';
import { startVoiceRecognition, VoiceRecognitionResult } from '@/lib/speech';
import { processVoiceInput, processReceiptOCR, processExpenseQuery } from '@/lib/openai';
import Tesseract from 'tesseract.js';
import type { Expense } from '@/pages/index';

interface AIFeaturesPanelProps {
  expenses: Expense[];
}

export default function AIFeaturesPanel({ expenses }: AIFeaturesPanelProps) {
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<{
    description: string;
    amount: number;
    date: string;
    category?: string;
    subcategory?: string;
  } | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  
  // OCR state
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [ocrResult, setOCRResult] = useState<{
    description: string;
    amount: number;
    date: string;
    category?: string;
    subcategory?: string;
  } | null>(null);
  
  // Chat assistant state
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{
    role: 'user' | 'assistant';
    content: string;
  }[]>([]);
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'voice' | 'ocr' | 'chat'>('voice');
  
  // Handle voice recognition results
  const handleVoiceResult = useCallback((result: VoiceRecognitionResult) => {
    setTranscript(result.text);
    
    if (result.isFinal) {
      // Auto-stop after getting final result
      if (stopListeningRef.current) {
        stopListeningRef.current();
        setIsListening(false);
      }
    }
  }, []);
  
  // Start listening
  const startListening = useCallback(() => {
    setTranscript('');
    setVoiceResult(null);
    setIsListening(true);
    
    try {
      const stopListening = startVoiceRecognition(
        handleVoiceResult,
        (error) => {
          console.error('Voice recognition error:', error);
          setIsListening(false);
        }
      );
      
      stopListeningRef.current = stopListening;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setIsListening(false);
    }
  }, [handleVoiceResult]);
  
  // Stop listening
  const stopListening = useCallback(() => {
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    setIsListening(false);
  }, []);
  
  // Process voice input
  const processVoice = useCallback(async () => {
    if (!transcript) return;
    
    setVoiceProcessing(true);
    
    try {
      const result = await processVoiceInput(transcript);
      setVoiceResult(result);
    } catch (error) {
      console.error('Voice processing error:', error);
      alert('Failed to process voice input');
    } finally {
      setVoiceProcessing(false);
    }
  }, [transcript]);
  
  // Handle file upload for OCR
  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setOCRResult(null);
    
    // Read the file as data URL
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Process receipt with OCR
  const processReceipt = useCallback(async () => {
    if (!receiptImage) return;
    
    setIsOCRProcessing(true);
    
    try {
      // Step 1: Extract text from image using Tesseract.js
      const { data: { text } } = await Tesseract.recognize(
        receiptImage,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      // Step 2: Process OCR text with OpenAI
      const result = await processReceiptOCR(text);
      setOCRResult(result);
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('Failed to process receipt');
    } finally {
      setIsOCRProcessing(false);
    }
  }, [receiptImage]);
  
  // Submit chat query
  const submitChatQuery = useCallback(async () => {
    if (!chatQuery.trim()) return;
    
    const userMessage = chatQuery.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatQuery('');
    setIsChatProcessing(true);
    
    try {
      const response = await processExpenseQuery(userMessage, expenses);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat processing error:', error);
      setChatHistory(prev => [
        ...prev, 
        { role: 'assistant', content: "I'm sorry, I couldn't process your query. Please try again." }
      ]);
    } finally {
      setIsChatProcessing(false);
    }
  }, [chatQuery, expenses]);
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-dark border-b border-light pb-3 mb-4">AI Features</h2>
      
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('voice')}
          className={`py-2 px-4 ${activeTab === 'voice' ? 'border-b-2 border-primary font-semibold' : 'text-gray-500'}`}
        >
          Voice Input
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={`py-2 px-4 ${activeTab === 'ocr' ? 'border-b-2 border-primary font-semibold' : 'text-gray-500'}`}
        >
          Receipt Scanner
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`py-2 px-4 ${activeTab === 'chat' ? 'border-b-2 border-primary font-semibold' : 'text-gray-500'}`}
        >
          Chat Assistant
        </button>
      </div>
      
      {/* Voice Input Tab */}
      {activeTab === 'voice' && (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            Speak your expense details like: "Spent 120 on metro on April 1"
          </p>
          
          <div className="mb-4">
            <div className="relative bg-gray-50 p-3 rounded-lg min-h-20">
              {transcript ? (
                <p>{transcript}</p>
              ) : (
                <p className="text-gray-400">
                  {isListening ? 'Listening...' : 'Press "Start Listening" to speak'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex-1 py-2 px-4 rounded font-medium ${
                isListening ? 'bg-danger text-white' : 'bg-primary text-white'
              }`}
            >
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
            
            <button
              onClick={processVoice}
              disabled={!transcript || voiceProcessing}
              className="flex-1 py-2 px-4 rounded bg-secondary text-white font-medium disabled:opacity-50"
            >
              {voiceProcessing ? 'Processing...' : 'Process Voice'}
            </button>
          </div>
          
          {voiceResult && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Extracted Expense:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Description:</span>
                </div>
                <div>{voiceResult.description}</div>
                
                <div>
                  <span className="font-medium">Amount:</span>
                </div>
                <div>₹{voiceResult.amount.toFixed(2)}</div>
                
                <div>
                  <span className="font-medium">Date:</span>
                </div>
                <div>{voiceResult.date}</div>
                
                {voiceResult.category && (
                  <>
                    <div>
                      <span className="font-medium">Category:</span>
                    </div>
                    <div className="capitalize">{voiceResult.category}</div>
                  </>
                )}
                
                {voiceResult.subcategory && (
                  <>
                    <div>
                      <span className="font-medium">Subcategory:</span>
                    </div>
                    <div>{voiceResult.subcategory}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* OCR Tab */}
      {activeTab === 'ocr' && (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            Upload a photo of your receipt to automatically extract expense details
          </p>
          
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white"
            />
          </div>
          
          {receiptImage && (
            <div className="mb-4">
              <div className="bg-gray-100 p-2 rounded">
                <img
                  src={receiptImage}
                  alt="Receipt"
                  className="max-h-40 mx-auto object-contain"
                />
              </div>
              
              <button
                onClick={processReceipt}
                disabled={isOCRProcessing}
                className="w-full mt-2 py-2 px-4 rounded bg-primary text-white font-medium disabled:opacity-50"
              >
                {isOCRProcessing ? 'Processing Receipt...' : 'Scan Receipt'}
              </button>
            </div>
          )}
          
          {ocrResult && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Extracted from Receipt:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Vendor:</span>
                </div>
                <div>{ocrResult.description}</div>
                
                <div>
                  <span className="font-medium">Amount:</span>
                </div>
                <div>₹{ocrResult.amount.toFixed(2)}</div>
                
                <div>
                  <span className="font-medium">Date:</span>
                </div>
                <div>{ocrResult.date}</div>
                
                {ocrResult.category && (
                  <>
                    <div>
                      <span className="font-medium">Category:</span>
                    </div>
                    <div className="capitalize">{ocrResult.category}</div>
                  </>
                )}
                
                {ocrResult.subcategory && (
                  <>
                    <div>
                      <span className="font-medium">Subcategory:</span>
                    </div>
                    <div>{ocrResult.subcategory}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Chat Assistant Tab */}
      {activeTab === 'chat' && (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            Ask questions about your expenses like "How much did I spend on food last month?"
          </p>
          
          <div className="bg-gray-50 p-3 rounded-lg mb-4 h-64 overflow-y-auto flex flex-col">
            {chatHistory.length === 0 ? (
              <div className="text-gray-400 text-center my-auto">
                Start a conversation with the expense assistant
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-white ml-auto'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
                
                {isChatProcessing && (
                  <div className="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-[80%] flex space-x-1">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask about your expenses..."
              className="flex-1 p-2 border rounded"
              onKeyDown={(e) => e.key === 'Enter' && submitChatQuery()}
            />
            
            <button
              onClick={submitChatQuery}
              disabled={!chatQuery.trim() || isChatProcessing}
              className="py-2 px-4 rounded bg-primary text-white font-medium disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 