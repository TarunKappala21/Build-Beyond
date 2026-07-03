import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./ChatModal.css";

const ChatModal = ({
  projectId,
  projectType,
  projectName,
  otherUserName,
  onClose,
  userRole,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/chat/room/${projectId}/${projectType}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to initialize chat");
        }

        const data = await response.json();
        if (!isMounted) return;

        setChatData(data);
        setMessages(data.messages || []);

        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        socketRef.current = io("https://build-beyond.onrender.com", {
          withCredentials: true,
        });

        const handleMessage = (messageData) => {
          setMessages((prev) => [...prev, messageData]);
        };

        const handleUserStatus = ({ isOnline }) => {
          setIsOtherOnline(Boolean(isOnline));
        };

        socketRef.current.emit("joinRoom", {
          roomId: data.roomId,
          userId: data.userId,
          userRole: data.userRole || userRole,
        });

        socketRef.current.on("message", handleMessage);
        socketRef.current.on("userStatus", handleUserStatus);
      } catch (error) {
        console.error("Error initializing chat:", error);
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
  }, [projectId, projectType, userRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  if (loading) {
    return (
      <div className="chat-modal-overlay" onClick={onClose}>
        <div
          className="chat-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="chat-modal-loading">Loading chat...</div>
        </div>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="chat-modal-overlay" onClick={onClose}>
        <div
          className="chat-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="chat-modal-loading">Unable to load chat.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <div>
            <p className="chat-modal-project-name">
              {projectName ? `Project: ${projectName}` : "Project Chat"}
            </p>
            <h3>{otherUserName || chatData.otherUserName || "Chat"}</h3>
            <span
              className={`chat-modal-status ${isOtherOnline ? "online" : "offline"}`}
            >
              {isOtherOnline ? "Online" : "Offline"}
            </span>
          </div>
          <button className="chat-modal-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="chat-modal-messages">
          {messages.length === 0 ? (
            <div className="chat-modal-empty">
              No messages yet. Start the conversation.
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={`${msg.timestamp || "t"}-${index}`}
                className={`chat-modal-message ${msg.sender?.toString() === chatData.userId?.toString() ? "sent" : "received"}`}
              >
                <div className="chat-modal-bubble">
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

        <form className="chat-modal-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-modal-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="chat-modal-send"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
