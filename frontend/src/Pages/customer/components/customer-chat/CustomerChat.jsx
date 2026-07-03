import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import CustomerPageLoader from "../common/CustomerPageLoader";
import "./CustomerChat.css";

const CustomerChat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const response = await fetch(`/api/chat/${roomId}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load chat");
        const data = await response.json();
        setChatData(data);
        setMessages(data.messages || []);
        initializeSocket(data);
      } catch (error) {
        console.error("Error loading chat:", error);
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
    const userRole = data.userRole || "customer";

    socketRef.current = io("https://build-beyond.onrender.com", {
      withCredentials: true,
    });

    socketRef.current.emit("joinRoom", {
      roomId,
      userId,
      userRole,
    });

    socketRef.current.on("message", (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    socketRef.current.on("userStatus", ({ userId: statusUserId, status }) => {
      setChatData((prev) => ({
        ...prev,
        otherUserOnline: status === "online",
      }));
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    const senderId = chatData.userId;
    const senderModel =
      chatData.userRole.charAt(0).toUpperCase() + chatData.userRole.slice(1);

    socketRef.current.emit("chatMessage", {
      roomId,
      senderId,
      senderModel,
      message: newMessage.trim(),
    });

    setNewMessage("");
  };

  if (loading) {
    return <CustomerPageLoader message="Loading chat..." />;
  }

  const otherUserName = chatData?.otherUserName || "User";

  return (
    <div className="custchat-container">
      <div className="custchat-header">
        <button onClick={() => navigate(-1)} className="custchat-back-btn">
          ← Back
        </button>
        <div className="custchat-user-info">
          <h2>{otherUserName}</h2>
          <span
            className={`custchat-status ${chatData?.otherUserOnline ? "online" : "offline"}`}
          >
            {chatData?.otherUserOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="custchat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`custchat-message ${
              msg.sender?.toString() === chatData.userId?.toString()
                ? "sent"
                : "received"
            }`}
          >
            <div className="custchat-message-content">{msg.message}</div>
            <div className="custchat-message-time">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="custchat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="custchat-input"
        />
        <button type="submit" className="custchat-send-btn">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default CustomerChat;
