import { useState } from "react";
import ChatSidebar from "../pages/ChatSidebar";
import ChatThread from "../pages/ChatThread";
import { useChatStore } from "../store/useChat";

export default function ChatPage() {
  const currentChat = useChatStore((s) => s.currentChat);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const handleSelectChat = () => {
    setMobileChatOpen(true);
  };

  const handleBack = () => setMobileChatOpen(false);

  return (
    <div className="h-[calc(100vh-32px)] min-h-[600px] bg-[#f5f7fb] p-4 md:p-6">
      <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <ChatSidebar
          selectedChatId={activeChatId}
          onSelectChat={handleSelectChat}
          hiddenOnMobile={mobileChatOpen}
        />

        <ChatThread
          chat={currentChat}
          onBack={handleBack}
          visibleOnMobile={mobileChatOpen}
        />
      </div>
    </div>
  );
}