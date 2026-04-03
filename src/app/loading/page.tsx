import LoadingMessage from "@/components/LoadingMessage";
import PageMain from "@/components/PageMain";

export default function LoadingPage() {
  return (
    <PageMain>
      <LoadingMessage message="지금 감정을 인식했어요. 어떤 변화가 가능할지, 함께 알아볼까요?" />
    </PageMain>
  );
}
