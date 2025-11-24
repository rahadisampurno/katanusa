import useExpertTalkStore, {
  CallStatusEnum,
} from '../../pages/Chat/hooks/useExpertTalkStore.ts';
import Button from '../ui/Button.tsx';

interface TalkEndProps {
  endCall: () => Promise<void>;
}

const TalkEnd: React.FC<TalkEndProps> = ({ endCall }) => {
  const { callStatus } = useExpertTalkStore();

  return (
    <div className="bg-white p-4 min-h-16 rounded-b-3xl border-t border-gray-100">
      {callStatus === CallStatusEnum.CONNECTING ||
      callStatus === CallStatusEnum.IDLE ? (
        <></>
      ) : (
        <div
          className="flex justify-center items-center"
          onClick={async () => await endCall()}
        >
          <Button type="button" variant="primary">
            Akhir panggilan
          </Button>
        </div>
      )}
    </div>
  );
};

export default TalkEnd;
