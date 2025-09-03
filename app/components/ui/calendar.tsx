/* eslint-disable react/prop-types */

import { buttonVariants } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useDayPicker, useNavigation } from "react-day-picker";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        months: "flex max-sm:flex-col max-sm:space-y-4 sm:space-x-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        vhidden: "sr-only",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-sm",
        row: "flex w-full mt-2",
        cell: "size-9 text-center text-sm p-0 relative has-[[aria-selected].day-range-end]:rounded-r-md has-[[aria-selected].day-outside]:bg-accent/50 has-[[aria-selected]]:bg-accent first:has-[[aria-selected]]:rounded-l-md last:has-[[aria-selected]]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        caption_dropdowns: "flex items-center gap-2",
        dropdown:
          "absolute inset-0 appearance-none border-0 border-none bg-background opacity-0 [&>option]:p-2 hover:[&>option]:bg-accent-foreground focus-visible:[&>option]:bg-accent-foreground",
        dropdown_month: "relative",
        dropdown_year: "relative",
        caption_label: "inline-flex items-center gap-2 text-sm font-medium",
        ...classNames,
      }}
      components={{
        Dropdown: ({ name, value }) => {
          const { fromDate, fromMonth, fromYear, toDate, toMonth, toYear } =
            useDayPicker();
          const { currentMonth, goToMonth } = useNavigation();
          if (name === "months") {
            return (
              <MonthDropdown
                currentMonth={currentMonth}
                goToMonth={goToMonth}
                value={value}
              />
            );
          }
          return (
            <YearDropdown
              currentMonth={currentMonth}
              fromDate={fromDate}
              fromMonth={fromMonth}
              fromYear={fromYear}
              goToMonth={goToMonth}
              toDate={toDate}
              toMonth={toMonth}
              toYear={toYear}
              value={value}
            />
          );
        },
        IconLeft: ({ ...props }) => (
          <ChevronLeft className="size-4" {...props} />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRight className="size-4" {...props} />
        ),
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

function YearDropdown({
  currentMonth,
  fromDate,
  fromMonth,
  fromYear,
  toDate,
  toMonth,
  toYear,
  value,
  goToMonth,
}: {
  currentMonth: Date;
  fromDate?: Date;
  fromMonth?: Date;
  fromYear?: number;
  toDate?: Date;
  toMonth?: Date;
  toYear?: number;
  value?: string | number | readonly string[];
  goToMonth: (month: Date) => void;
}) {
  const startYear =
    fromYear || fromDate?.getFullYear() || fromMonth?.getFullYear();
  const endingYear = toYear || toDate?.getFullYear() || toMonth?.getFullYear();
  if (startYear && endingYear) {
    const years = Array.from(
      { length: endingYear - startYear + 1 },
      (_, i) => ({
        index: (startYear + i).toString(),
        value: (startYear + i).toString(),
      }),
    );
    return (
      <Select
        onValueChange={(date) => {
          const newDate = new Date(currentMonth);
          newDate.setFullYear(Number.parseInt(date));
          goToMonth(newDate);
        }}
        value={value?.toString()}>
        <SelectTrigger
          className="hover:bg-accent hover:text-accent-foreground h-fit gap-2 py-1 opacity-50 transition-[colors,opacity] hover:opacity-100"
          title="select-year">
          <span>{currentMonth.getFullYear()}</span>
        </SelectTrigger>
        <SelectContent className="bg-background">
          {years.map((year) => (
            <SelectItem key={year.index} value={year.index}>
              {year.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
}

function MonthDropdown({
  currentMonth,
  value,
  goToMonth,
}: {
  currentMonth: Date;
  value?: string | number | readonly string[];
  goToMonth: (month: Date) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    index: i.toString(),
    value: format(new Date(2024, i, 1), "MMM"),
  }));
  return (
    <Select
      onValueChange={(date) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(Number.parseInt(date));
        goToMonth(newDate);
      }}
      value={value?.toString()}>
      <SelectTrigger
        className="hover:bg-accent hover:text-accent-foreground h-fit gap-2 py-1 opacity-50 transition-[colors,opacity] hover:opacity-100"
        title="select-month">
        <span>{format(currentMonth, "MMM")}</span>
      </SelectTrigger>
      <SelectContent className="bg-background">
        {months.map((month) => (
          <SelectItem key={month.index} value={month.index}>
            {month.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { Calendar };
