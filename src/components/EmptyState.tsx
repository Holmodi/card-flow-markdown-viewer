interface Props {
  message: string;
}

export default function EmptyState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p className="text-slate-400 text-lg font-medium">{message}</p>
      <p className="text-slate-600 text-sm mt-2">开始创建你的第一张卡片吧</p>
    </div>
  );
}
