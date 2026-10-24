import ChatWindow from '../../components/chat/ChatWindow';
import Navbar from '../../components/layout/Navbar';

const ExpertChatPage = () => {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#1E315A]">
      <Navbar isWhite />

      <div className="pointer-events-none absolute inset-0 bg-[url('/assets/bg-pattern.webp')] bg-contain bg-repeat opacity-[0.035]" />
      <div className="pointer-events-none absolute -left-40 top-40 h-96 w-96 rounded-full bg-red-500/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-amber-300/[0.05] blur-3xl" />

      <main className="relative z-10 flex min-h-0 flex-1 items-start justify-center pt-20 sm:pt-24">
        <ChatWindow />
      </main>
    </div>
  );
};

export default ExpertChatPage;
