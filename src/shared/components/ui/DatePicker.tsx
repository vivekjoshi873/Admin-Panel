import { useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/components/ui/Button';
import { Calendar } from '@/shared/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover';

function parseYmd(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : undefined;
}

function toYmd(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

type DatePickerProps = {
  value?: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Cap selectable dates (inclusive). */
  toDate?: Date;
  fromDate?: Date;
};

/** shadcn-style date picker. `value` / `onChange` use API-friendly `yyyy-MM-dd`. */
export function DatePicker({
  value,
  onChange,
  placeholder = 'dd-mm-yyyy',
  className,
  disabled,
  toDate,
  fromDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          className={cn(
            'h-10 w-[168px] justify-between px-3 font-normal',
            !selected && 'text-[var(--muted)]',
            className,
          )}
        >
          <span className="truncate">
            {selected ? format(selected, 'dd-MM-yyyy') : placeholder}
          </span>
          <CalendarIcon className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bingo-calendar w-auto border-[var(--line)] bg-[var(--surface)] p-0 text-[var(--ink)]"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2032, 11)}
          disabled={[
            ...(fromDate ? [{ before: fromDate }] : []),
            ...(toDate ? [{ after: toDate }] : []),
          ]}
          onSelect={(date) => {
            onChange(date ? toYmd(date) : '');
            setOpen(false);
          }}
        />
        <div className="flex items-center justify-between border-t border-[var(--line)] px-3 py-2">
          <button
            type="button"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
            onClick={() => {
              onChange(toYmd(new Date()));
              setOpen(false);
            }}
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
