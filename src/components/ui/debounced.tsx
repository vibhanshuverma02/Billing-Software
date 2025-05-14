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
  const [localValue, setLocalValue] = useState<number>(value);
  const [debouncedValue] = useDebounce(localValue, delay);

  useEffect(() => {
    if (debouncedValue !== value) {
      onDebouncedChange(debouncedValue);
    }

    // Trigger total calculation after debounce settles (always debounced)
    onTotalCalculate();
  }, [debouncedValue, value, onDebouncedChange, onTotalCalculate]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <Input
      {...props}
      value={localValue === 0 ? '' : localValue.toString()}
      onChange={(e) => {
        const newValue = e.target.value === '' ? 0 : Number(e.target.value);
        setLocalValue(newValue);
      }}
    />
  );
};

export { DebouncedInput };
