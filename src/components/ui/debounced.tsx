import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';


interface DebouncedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number;
  onDebouncedChange: (value: number) => void;
  delay?: number;
  onTotalCalculate: () => void;
}

const DebouncedInput = forwardRef<HTMLInputElement, DebouncedInputProps>(
  ({ value, onDebouncedChange, delay = 1500, onTotalCalculate, ...props }, ref) => {
    const [localValue, setLocalValue] = useState<string>(value === 0 ? '' : value.toString());
    const [debouncedValue] = useDebounce(localValue, delay);

    useEffect(() => {
      if (debouncedValue !== '' && debouncedValue !== value.toString()) {
        const numericValue = Number(debouncedValue);
        onDebouncedChange(numericValue);
        onTotalCalculate();
      }
    }, [debouncedValue]);

    useEffect(() => {
      setLocalValue(value === 0 ? '' : value.toString());
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
    );
  }
);

DebouncedInput.displayName = 'DebouncedInput';

export { DebouncedInput };