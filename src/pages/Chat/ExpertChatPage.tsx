import ChatWindow from '../../components/chat/ChatWindow';
import Navbar from '../../components/layout/Navbar';

const ExpertChatPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#243b6a] to-[#1E315A] overflow-hidden relative flex flex-col">
      <Navbar isWhite />

      <div className="absolute inset-0 bg-cover opacity-20 bg-[url('/assets/bg-experts-header.png')] pointer-events-none"></div>
      <div className="absolute left-0 right-0 bottom-0 h-[274px] bg-[url('/assets/footer-chat.svg')] bg-repeat opacity-100 pointer-events-none"></div>

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <ChatWindow />
      </main>
    </div>
  );
};

export default ExpertChatPage;
