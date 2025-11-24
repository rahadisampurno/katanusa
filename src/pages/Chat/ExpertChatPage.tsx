import ChatWindow from '../../components/chat/ChatWindow';
import Navbar from '../../components/layout/Navbar';

const ExpertChatPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-400 overflow-hidden relative flex flex-col">
      <Navbar />

      {/* Background Overlay Image (Batik/Texture tipis di background biru utama) */}
      <div className="absolute inset-0 bg-cover opacity-10 bg-[url('/assets/2-bg-landing-jumbotron.png')] pointer-events-none"></div>

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <ChatWindow />
      </main>
    </div>
  );
};

export default ExpertChatPage;
