import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { radius, type ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type DatePickerFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  minYear?: number;
  maxYear?: number;
};

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const weekdayLabels = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

export function DatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  minYear = 1920,
  maxYear = new Date().getFullYear(),
}: DatePickerFieldProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [visibleDate, setVisibleDate] = useState(() => new Date());

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selected = typeof value === "string" && value ? parseIsoDate(value) : null;
        const days = buildCalendarDays(visibleDate);

        function selectDate(day: number) {
          const next = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), day);
          onChange(toIsoDate(next));
          setOpen(false);
        }

        function moveMonth(direction: -1 | 1) {
          const next = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + direction, 1);
          const year = next.getFullYear();
          if (year < minYear || year > maxYear) return;
          setVisibleDate(next);
        }

        return (
          <View style={styles.group}>
            <Text style={styles.label}>{label}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (selected) setVisibleDate(selected);
                setOpen(true);
              }}
              style={[styles.input, error ? styles.inputError : null]}
            >
              <Calendar size={18} color={colors.primary} />
              <Text style={[styles.value, selected ? null : styles.placeholder]}>
                {selected ? formatDisplayDate(selected) : "Seleccionar fecha"}
              </Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error.message}</Text> : null}

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Pressable style={styles.iconButton} onPress={() => moveMonth(-1)}>
                      <ChevronLeft size={20} color={colors.text} />
                    </Pressable>
                    <View style={styles.monthTitle}>
                      <Text style={styles.monthText}>
                        {monthNames[visibleDate.getMonth()] ?? ""} {visibleDate.getFullYear()}
                      </Text>
                    </View>
                    <Pressable style={styles.iconButton} onPress={() => moveMonth(1)}>
                      <ChevronRight size={20} color={colors.text} />
                    </Pressable>
                  </View>

                  <View style={styles.weekdays}>
                    {weekdayLabels.map((weekday) => (
                      <Text key={weekday} style={styles.weekday}>
                        {weekday}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.grid}>
                    {days.map((day, index) => {
                      if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                      const isSelected =
                        selected?.getFullYear() === visibleDate.getFullYear() &&
                        selected?.getMonth() === visibleDate.getMonth() &&
                        selected?.getDate() === day;
                      return (
                        <Pressable
                          key={`${visibleDate.getMonth()}-${day}`}
                          accessibilityRole="button"
                          onPress={() => selectDate(day)}
                          style={[styles.dayCell, isSelected ? styles.selectedDay : null]}
                        >
                          <Text style={[styles.dayText, isSelected ? styles.selectedDayText : null]}>{day}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.actions}>
                    <Pressable style={styles.clearButton} onPress={() => onChange("")}>
                      <X size={16} color={colors.muted} />
                      <Text style={styles.clearText}>Limpiar</Text>
                    </Pressable>
                    <Pressable style={styles.doneButton} onPress={() => setOpen(false)}>
                      <Text style={styles.doneText}>Listo</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        );
      }}
    />
  );
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [...Array(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? new Date().getFullYear(), (month ?? 1) - 1, day ?? 1);
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  group: {
    gap: 6,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputError: {
    borderColor: colors.danger,
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  placeholder: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  monthTitle: {
    flex: 1,
    alignItems: "center",
  },
  monthText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  weekdays: {
    flexDirection: "row",
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDay: {
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.text,
    fontWeight: "800",
  },
  selectedDayText: {
    color: colors.onPrimary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
  },
  clearText: {
    color: colors.muted,
    fontWeight: "800",
  },
  doneButton: {
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  doneText: {
    color: colors.onPrimary,
    fontWeight: "900",
  },
  });
}
