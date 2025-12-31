import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DateRange,
  DatePreset,
  getDateRangeForPreset,
  detectPresetFromRange,
  getPresetLabel,
  formatDateRange,
  parseInputDate,
  formatDateToInput,
} from "@/lib/date-utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { fr } from "date-fns/locale/fr";
import { enUS } from "date-fns/locale/en-US";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const { language } = useLanguage();
  const [preset, setPreset] = useState<DatePreset>(
    value.preset || detectPresetFromRange(value)
  );
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    value.startDate ? parseInputDate(value.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    value.endDate ? parseInputDate(value.endDate) : undefined
  );

  // Update internal state when value prop changes
  useEffect(() => {
    if (value.startDate && value.endDate) {
      setStartDate(parseInputDate(value.startDate));
      setEndDate(parseInputDate(value.endDate));
      const detectedPreset = value.preset || detectPresetFromRange(value);
      setPreset(detectedPreset);
    }
  }, [value.startDate, value.endDate, value.preset]);

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);

    if (newPreset === "custom") {
      setIsCustomOpen(true);
      return;
    }

    const range = getDateRangeForPreset(newPreset);
    setStartDate(parseInputDate(range.startDate));
    setEndDate(parseInputDate(range.endDate));
    onChange(range);
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      const range: DateRange = {
        startDate: formatDateToInput(startDate),
        endDate: formatDateToInput(endDate),
        preset: "custom",
      };
      onChange(range);
      setIsCustomOpen(false);
    }
  };

  const presets: DatePreset[] = [
    "today",
    "yesterday",
    "thisWeek",
    "lastWeek",
    "thisMonth",
    "lastMonth",
    "thisYear",
    "lastYear",
    "custom",
  ];

  const displayText =
    preset === "custom" && startDate && endDate
      ? formatDateRange(
          {
            startDate: formatDateToInput(startDate),
            endDate: formatDateToInput(endDate),
            preset: "custom",
          },
          language
        )
      : getPresetLabel(preset, language);

  const calendarLocale = language === "fr" ? fr : enUS;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={preset} onValueChange={(val) => handlePresetChange(val as DatePreset)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p} value={p}>
              {getPresetLabel(p, language)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !startDate && !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {displayText || (language === "fr" ? "Sélectionner une plage" : "Pick a range")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <Calendar
                mode="range"
                defaultMonth={startDate || new Date()}
                selected={{
                  from: startDate,
                  to: endDate,
                }}
                onSelect={(range) => {
                  if (range?.from) setStartDate(range.from);
                  if (range?.to) setEndDate(range.to);
                }}
                numberOfMonths={2}
                locale={calendarLocale}
              />
            </div>
            <div className="p-3 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomOpen(false)}
              >
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={handleCustomDateChange}
                disabled={!startDate || !endDate}
              >
                {language === "fr" ? "Appliquer" : "Apply"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {preset !== "custom" && (
        <span className="text-sm text-muted-foreground">
          {formatDateRange(value, language)}
        </span>
      )}
    </div>
  );
}

