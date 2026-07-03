import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import API_BASE from "../../../../api/backendBase";
import './CompanyChat.css';

const CompanyChat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/chat/${roomId}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to load chat');
        const data = await response.json();
        setChatData(data);
        setMessages(data.messages || []);
        initializeSocket(data);
      } catch (error) {
        console.error('Error loading chat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  const initializeSocket = (data) => {
    const userId = data.userId;
    const userRole = data.userRole || 'company';

    socketRef.current = io('https://build-beyond.onrender.com', {
      withCredentials: true,
    });

    socketRef.current.emit('joinRoom', {
      roomId,
      userId,
      userRole,
    });

    socketRef.current.on('message', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    socketRef.current.on('userStatus', ({ userId: statusUserId, status }) => {
      setChatData((prev) => ({
        ...prev,
        otherUserOnline: status === 'online',
      }));
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    const senderId = chatData.userId;
    const senderModel = chatData.userRole.charAt(0).toUpperCase() + chatData.userRole.slice(1);

    socketRef.current.emit('chatMessage', {
      roomId,
      senderId,
      senderModel,
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  if (loading) {
    return <div className="compchat-loading">Loading chat...</div>;
  }

  const otherUserName = chatData?.otherUserName || 'User';

  return (
    <div className="compchat-container">
      <div className="compchat-header">
        <button onClick={() => navigate(-1)} className="compchat-back-btn">
          ← Back
        </button>
        <div className="compchat-user-info">
          <h2>{otherUserName}</h2>
          <span className={`compchat-status ${chatData?.otherUserOnline ? 'online' : 'offline'}`}>
            {chatData?.otherUserOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="compchat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`compchat-message ${
              msg.sender?.toString() === chatData.userId?.toString()
                ? 'sent'
                : 'received'
            }`}
          >
            <div className="compchat-message-content">{msg.message}</div>
            <div className="compchat-message-time">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="compchat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="compchat-input"
        />
        <button type="submit" className="compchat-send-btn">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default CompanyChat;
