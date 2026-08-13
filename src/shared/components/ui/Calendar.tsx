import * as React from 'react';
import { DayPicker, type DayButtonProps } from 'react-day-picker';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { buttonVariants } from '@/shared/components/ui/Button';
import 'react-day-picker/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'h-8 w-8 p-0 font-normal aria-selected:opacity-100',
        modifiers.selected &&
          'bg-[var(--accent)] text-white hover:bg-[var(--accent)] hover:text-white dark:text-stone-950',
        modifiers.today && !modifiers.selected && 'bg-[var(--accent-soft)] text-[var(--accent)]',
        modifiers.outside && 'text-[var(--muted)] opacity-50',
        modifiers.disabled && 'text-[var(--muted)] opacity-40',
        className,
      )}
      {...props}
    />
  );
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn('bingo-calendar p-3 text-[var(--ink)]', className)}
      classNames={{
        months: 'relative flex flex-col gap-4 sm:flex-row',
        month: 'flex w-full flex-col gap-4',
        month_caption: 'flex h-8 items-center justify-center px-8',
        caption_label: 'text-sm font-medium text-[var(--ink)]',
        dropdowns: 'flex h-8 w-full items-center justify-center gap-2',
        dropdown_root: cn(
          'relative rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1',
          'text-sm text-[var(--ink)]',
        ),
        // Native <select> must use dark color-scheme so option text stays readable.
        dropdown: 'absolute inset-0 z-10 cursor-pointer opacity-0 bingo-calendar-select',
        months_dropdown: 'bingo-calendar-select',
        years_dropdown: 'bingo-calendar-select',
        nav: 'absolute inset-x-0 top-0 flex w-full items-center justify-between',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 text-[var(--muted)] hover:text-[var(--ink)]',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 text-[var(--muted)] hover:text-[var(--ink)]',
        ),
        month_grid: 'mt-1 w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-8 text-[0.75rem] font-normal text-[var(--muted)]',
        week: 'mt-1 flex w-full',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        range_start: 'rounded-l-md',
        range_middle: 'rounded-none',
        range_end: 'rounded-r-md',
        today: '',
        outside: '',
        disabled: '',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className={cn('size-4', chevronClass)} {...chevronProps} />;
          }
          if (orientation === 'right') {
            return <ChevronRightIcon className={cn('size-4', chevronClass)} {...chevronProps} />;
          }
          return <ChevronDownIcon className={cn('size-4', chevronClass)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}
