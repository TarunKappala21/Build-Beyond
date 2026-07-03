import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import io from "socket.io-client";
import "./FloatingChatWidget.css";

const FloatingChatWidget = ({
  chatSession,
  isOpen,
  isMinimized,
  onClose,
  onMinimize,
  onRestore,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatError, setChatError] = useState("");

  const socketRef = useRef(null);
  const sendingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const isMinimizedRef = useRef(isMinimized);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isOpen || !chatSession?.projectId || !chatSession?.projectType) {
        return;
      }

      try {
        setLoading(true);
        setChatError("");
        setChatData(null);
        setMessages([]);
        setIsOtherOnline(false);
        const response = await fetch(
          `/api/chat/room/${chatSession.projectId}/${chatSession.projectType}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to initialize chat");
        }

        const data = await response.json();
        if (!isMounted) return;

        setChatData(data);
        setMessages(data.messages || []);

        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        const socket = io("https://build-beyond.onrender.com", {
          withCredentials: true,
        });
        socketRef.current = socket;

        socket.emit("joinRoom", {
          roomId: data.roomId,
          userId: data.userId,
          userRole: data.userRole || chatSession.userRole,
        });

        socket.on("message", (messageData) => {
          setMessages((prev) => [...prev, messageData]);

          const ownMessage =
            messageData.sender?.toString() === data.userId?.toString();
          if (isMinimizedRef.current && !ownMessage) {
            setUnreadCount((prev) => prev + 1);
          }
        });

        socket.on("userStatus", ({ isOnline }) => {
          setIsOtherOnline(Boolean(isOnline));
        });
      } catch (error) {
        console.error("Error initializing global chat:", error);
        if (isMounted) {
          setChatError(error.message || "Failed to initialize chat.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [
    isOpen,
    chatSession?.projectId,
    chatSession?.projectType,
    chatSession?.userRole,
  ]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  useEffect(() => {
    setMessages([]);
    setChatData(null);
    setChatError("");
    setIsOtherOnline(false);
    setUnreadCount(0);
    setNewMessage("");
  }, [chatSession?.projectId, chatSession?.projectType]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !socketRef.current ||
      !chatData ||
      sendingRef.current
    ) {
      return;
    }

    sendingRef.current = true;
    const messageText = newMessage.trim();

    socketRef.current.emit("chatMessage", {
      roomId: chatData.roomId,
      senderId: chatData.userId,
      senderModel:
        chatData.userRole.charAt(0).toUpperCase() + chatData.userRole.slice(1),
      message: messageText,
    });

    setNewMessage("");
    setTimeout(() => {
      sendingRef.current = false;
    }, 250);
  };

  if (!isOpen || !chatSession) {
    return null;
  }

  if (isMinimized) {
    return createPortal(
      <button
        type="button"
        className="floating-chat-minimized"
        onClick={onRestore}
      >
        <span className="floating-chat-minimized-label">Chat</span>
        {unreadCount > 0 && (
          <span className="floating-chat-unread">{unreadCount}</span>
        )}
      </button>,
      document.body,
    );
  }

  return createPortal(
    <div className="floating-chat-panel" role="dialog" aria-label="Chat widget">
      <div className="floating-chat-header">
        <div className="floating-chat-header-text">
          <p className="floating-chat-project">
            {chatSession.projectName
              ? `Project: ${chatSession.projectName}`
              : "Project Chat"}
          </p>
          <h3>
            {chatSession.otherUserName || chatData?.otherUserName || "Chat"}
          </h3>
          <span
            className={`floating-chat-status ${isOtherOnline ? "online" : "offline"}`}
          >
            {isOtherOnline ? "Online" : "Offline"}
          </span>
        </div>
        <div className="floating-chat-actions">
          <button type="button" onClick={onMinimize} title="Minimize chat">
            -
          </button>
          <button type="button" onClick={onClose} title="Close chat">
            x
          </button>
        </div>
      </div>

      <div className="floating-chat-messages">
        {loading ? (
          <div className="floating-chat-state">Loading chat...</div>
        ) : chatError ? (
          <div className="floating-chat-state floating-chat-error">
            {chatError}
          </div>
        ) : messages.length === 0 ? (
          <div className="floating-chat-state">
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`${msg.timestamp || "t"}-${index}`}
              className={`floating-chat-message ${msg.sender?.toString() === chatData?.userId?.toString() ? "sent" : "received"}`}
            >
              <div className="floating-chat-bubble">
                <p>{msg.message}</p>
                <span>
                  {new Date(msg.timestamp || Date.now()).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="floating-chat-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!newMessage.trim() || loading}>
          Send
        </button>
      </form>
    </div>,
    document.body,
  );
};

export default FloatingChatWidget;
