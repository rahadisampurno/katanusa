import { Send } from 'lucide-react';
import type { ChangeEvent, JSX } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLoaderData, useSearchParams } from 'react-router';
import useChatActions from '../../pages/Chat/hooks/useChatActions';
import type { Expert } from '../../types/expert';

type ChatInputForm = {
  userInput: string;
};

interface ChatInputProps {
  expert?: Expert | null;
}

const ChatInput: React.FC<ChatInputProps> = ({ expert: propExpert }): JSX.Element => {
  const loaderData = useLoaderData() as { data?: Expert } | undefined;
  const [searchParams] = useSearchParams();
  const expert = propExpert ?? loaderData?.data ?? null;
  const { sendMessage, isLoading } = useChatActions(expert);

  const { handleSubmit, control, resetField } = useForm<ChatInputForm>({
    defaultValues: {
      userInput: searchParams.get('q') || '',
    },
  });

  const onSubmit = async (value: ChatInputForm): Promise<void> => {
    const trimmedInput = value.userInput.trim();
    if (!trimmedInput || isLoading) return;

    resetField('userInput');
    await sendMessage(trimmedInput);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-gradient-to-t from-[#F8F2E7] via-[#F8F2E7] to-[#F8F2E7]/70 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6"
    >
      <div className="relative mx-auto max-w-4xl">
        <Controller
          control={control}
          name={'userInput'}
          render={({ field: { name, onBlur, onChange, value } }) => {
            const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
              onChange(e.target.value);
            };

            return (
              <input
                name={name}
                type="text"
                autoComplete="off"
                placeholder="Tanyakan sesuatu tentang budaya..."
                className="w-full rounded-3xl border border-[#1E315A]/15 bg-white py-3.5 pl-5 pr-14 text-base text-slate-800 shadow-[0_8px_30px_rgba(30,49,90,0.08)] outline-none transition placeholder:text-slate-400 focus:border-amber-500/60 focus:ring-4 focus:ring-amber-400/10"
                onBlur={onBlur}
                onChange={handleChange}
                value={value}
              />
            );
          }}
        />
        <button
          type="submit"
          aria-label="Kirim pesan"
          disabled={isLoading}
          className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-4xl px-1 text-center text-[11px] text-slate-500 sm:text-left">
        AI dapat membuat kekeliruan. Periksa kembali informasi penting.
      </p>
    </form>
  );
};

export default ChatInput;
