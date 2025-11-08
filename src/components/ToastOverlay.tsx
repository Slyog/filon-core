export default function ToastOverlay({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-8 z-40 rounded-xl bg-cyan-900/70 px-4 py-2 text-cyan-200 shadow-lg backdrop-blur-sm animate-fade-in">
      {message}
    </div>
  );
}

