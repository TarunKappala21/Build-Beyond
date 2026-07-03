import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './Chat.css';

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatData();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatData = async () => {
    try {
      const response = await fetch(`/api/chat/${roomId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setChatData(data);
        setMessages(data.messages || []);
        initializeSocket(data);
      } else {
        alert('Failed to load chat');
        navigate(-1);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      alert('Error loading chat');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = (data) => {
    socketRef.current = io('https://build-beyond.onrender.com', {
      withCredentials: true
    });

    socketRef.current.emit('joinRoom', {
      roomId: data.roomId,
      userId: data.userId,
      userRole: data.userRole
    });

    socketRef.current.on('message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    socketRef.current.on('userStatus', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('chatMessage', {
      roomId: chatData.roomId,
      senderId: chatData.userId,
      senderModel: chatData.userRole.charAt(0).toUpperCase() + chatData.userRole.slice(1),
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">Loading chat...</div>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="chat-container">
        <div className="chat-error">Chat not found</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="chat-header-info">
          <h2>{chatData.otherUserName}</h2>
          <span className="chat-status">
            {onlineUsers.has(chatData.userId) ? (
              <><i className="fas fa-circle online"></i> Online</>
            ) : (
              <><i className="fas fa-circle offline"></i> Offline</>
            )}
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <i className="fas fa-comments"></i>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.sender?.toString() === chatData.userId?.toString() ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{msg.message}</p>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default Chat;
