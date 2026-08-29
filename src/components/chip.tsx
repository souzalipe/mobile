import { Pressable, Text, View } from 'react-native';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
};

export function Chip({ label, selected, onPress, color }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
        selected
          ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
          : 'border-neutral-300 bg-transparent dark:border-neutral-700'
      }`}
    >
      {color ? (
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-white dark:text-neutral-900' : 'text-neutral-700 dark:text-neutral-300'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
