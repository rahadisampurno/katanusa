import { Send } from 'lucide-react';
import type { ChangeEvent, JSX } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLoaderData } from 'react-router';
import useChatActions from '../../pages/Chat/hooks/useChatActions';

type ChatInputForm = {
  userInput: string;
};

const ChatInput = (): JSX.Element => {
  const { data: expert } = useLoaderData();
  const { sendMessage, isLoading } = useChatActions(expert);

  const { handleSubmit, control, resetField } = useForm<ChatInputForm>({
    defaultValues: {
      userInput: '',
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
      className="bg-white p-4 rounded-b-3xl border-t border-gray-100"
    >
      <div className="relative">
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
                placeholder="Ketik pertanyaanmu disini..."
                className="w-full py-4 pl-6 pr-12 bg-gray-50 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                onBlur={onBlur}
                onChange={handleChange}
                value={value}
              />
            );
          }}
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-transparent hover:bg-blue-50 text-accent-red rounded-full transition">
          <Send className="w-5 h-5 rotate-45" fill="currentColor" />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
