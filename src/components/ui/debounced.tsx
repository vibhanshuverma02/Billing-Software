import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';

interface DebouncedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number;
  onDebouncedChange: (value: number) => void;
  delay?: number;
  onTotalCalculate: () => void;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value,
  onDebouncedChange,
  delay = 1500,
  onTotalCalculate,
  ...props
}) => {
  const [localValue, setLocalValue] = useState<string>(value === 0 ? '' : value.toString());
  const [debouncedValue] = useDebounce(localValue, delay);

  // Only trigger debounce logic if input is not empty
  useEffect(() => {
    if (debouncedValue !== '' && debouncedValue !== value.toString()) {
      const numericValue = Number(debouncedValue);
      onDebouncedChange(numericValue);
      onTotalCalculate();
    }
  }, [debouncedValue]);

  // Sync external value changes to local input
  useEffect(() => {
    setLocalValue(value === 0 ? '' : value.toString());
  }, [value]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
      }}
    />
  );
};

export { DebouncedInput };
