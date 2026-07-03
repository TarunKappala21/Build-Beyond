import React, { createContext, useContext, useMemo, useState } from "react";
import FloatingChatWidget from "../components/Chat/FloatingChatWidget";

const GlobalChatContext = createContext(null);

export const GlobalChatProvider = ({ children }) => {
  const [chatSession, setChatSession] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const openChat = ({
    projectId,
    projectType,
    projectName,
    otherUserName,
    userRole,
  }) => {
    setChatSession({
      projectId,
      projectType,
      projectName,
      otherUserName,
      userRole,
    });
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    if (isOpen) {
      setIsMinimized(true);
    }
  };

  const restoreChat = () => {
    setIsMinimized(false);
  };

  const value = useMemo(
    () => ({
      openChat,
      closeChat,
      minimizeChat,
      restoreChat,
      isOpen,
      isMinimized,
      chatSession,
    }),
    [isOpen, isMinimized, chatSession],
  );

  return (
    <GlobalChatContext.Provider value={value}>
      {children}
      <FloatingChatWidget
        chatSession={chatSession}
        isOpen={isOpen}
        isMinimized={isMinimized}
        onClose={closeChat}
        onMinimize={minimizeChat}
        onRestore={restoreChat}
      />
    </GlobalChatContext.Provider>
  );
};

export const useGlobalChat = () => {
  const context = useContext(GlobalChatContext);
  if (!context) {
    throw new Error("useGlobalChat must be used within GlobalChatProvider");
  }
  return context;
};
