import { useCardStore } from "../stores/cardStore";
import { formatDateTime } from "../lib/timezone";

interface Props {
  isoString: string | null;
}

export default function TimeDisplay({ isoString }: Props) {
  const settings = useCardStore((s) => s.settings);
  const formatted = formatDateTime(isoString, settings.timezone);
  return <span>{formatted}</span>;
}
