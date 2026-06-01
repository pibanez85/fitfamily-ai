import { useMemo, useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { CalendarDays, Check, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type DateOfBirthPickerProps<T extends FieldValues> = {
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

const monthShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function DateOfBirthPicker<T extends FieldValues>({
  control,
  name,
  label,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
}: DateOfBirthPickerProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState<number>(maxYear - 30);
  const [month, setMonth] = useState<number>(0);
  const [day, setDay] = useState<number>(1);
  const [draftInput, setDraftInput] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const daysInMonth = getDaysInMonth(year, month);
  const safeDay = Math.min(day, daysInMonth);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, index) => index + 1), [daysInMonth]);
  const previewDate = new Date(year, month, safeDay);
  const previewAge = calculateAge(previewDate);
  const previewValidation = validateBirthdateParts(safeDay, month + 1, year, minYear, maxYear);

  function syncDraftFromValue(value: unknown) {
    const selected = typeof value === "string" && value ? parseIsoDate(value) : null;
    const fallback = selected ?? new Date(maxYear - 30, 0, 1);
    setYear(clamp(fallback.getFullYear(), minYear, maxYear));
    setMonth(fallback.getMonth());
    setDay(fallback.getDate());
    setDraftInput(selected ? formatMaskedDate(selected) : "");
    setDraftError(null);
  }

  function applyDraftInput(text: string) {
    const masked = maskDateInput(text);
    setDraftInput(masked);

    if (!masked) {
      setDraftError(null);
      return;
    }

    if (masked.length < 10) {
      setDraftError("Completa la fecha en formato DD/MM/AAAA.");
      return;
    }

    const parsed = parseMaskedDate(masked);
    if (!parsed.ok) {
      setDraftError(parsed.error);
      return;
    }

    setDay(parsed.day);
    setMonth(parsed.month - 1);
    setYear(parsed.year);
    setDraftError(null);
  }

  function applyYear(nextYear: number) {
    const nextSafeDay = Math.min(day, getDaysInMonth(nextYear, month));
    setYear(nextYear);
    setDay(nextSafeDay);
    setDraftInput(formatMaskedFromParts(nextSafeDay, month + 1, nextYear));
    setDraftError(null);
  }

  function applyMonth(nextMonth: number) {
    const nextSafeDay = Math.min(day, getDaysInMonth(year, nextMonth));
    setMonth(nextMonth);
    setDay(nextSafeDay);
    setDraftInput(formatMaskedFromParts(nextSafeDay, nextMonth + 1, year));
    setDraftError(null);
  }

  function applyDay(nextDay: number) {
    setDay(nextDay);
    setDraftInput(formatMaskedFromParts(nextDay, month + 1, year));
    setDraftError(null);
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selected = typeof value === "string" && value ? parseIsoDate(value) : null;
        const age = selected ? calculateAge(selected) : null;
        const selectedText = selected ? formatMaskedDate(selected) : "";

        function openPicker() {
          syncDraftFromValue(value);
          setOpen(true);
        }

        function cancel() {
          syncDraftFromValue(value);
          setOpen(false);
        }

        function clear() {
          onChange("");
          setDraftInput("");
          setDraftError(null);
          setOpen(false);
        }

        function confirm() {
          const parsed = parseMaskedDate(draftInput || formatMaskedFromParts(safeDay, month + 1, year));
          if (!parsed.ok) {
            setDraftError(parsed.error);
            return;
          }
          const validation = validateBirthdateParts(parsed.day, parsed.month, parsed.year, minYear, maxYear);
          if (validation) {
            setDraftError(validation);
            return;
          }
          onChange(toIsoDate(new Date(parsed.year, parsed.month - 1, parsed.day)));
          setOpen(false);
        }

        return (
          <View style={styles.group}>
            <Text style={styles.label}>{label}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={openPicker}
              style={[styles.input, error ? styles.inputError : null]}
            >
              <CalendarDays size={18} color={colors.primary} />
              <View style={styles.inputTextCol}>
                <Text style={[styles.value, selected ? null : styles.placeholder]}>
                  {selected ? selectedText : "DD/MM/AAAA"}
                </Text>
                {selected ? <Text style={styles.inputHint}>{formatDisplayDate(selected)}</Text> : null}
              </View>
              {age !== null ? <Text style={styles.agePill}>{age} años</Text> : null}
            </Pressable>
            {error ? <Text style={styles.error}>{error.message}</Text> : null}

            <Modal visible={open} transparent animationType="slide" onRequestClose={cancel}>
              <View style={styles.backdrop}>
                <View style={styles.sheet}>
                  <View style={styles.handle} />
                  <View style={styles.sheetHeader}>
                    <View style={styles.sheetTitleCol}>
                      <Text style={styles.sheetTitle}>Fecha de nacimiento</Text>
                      <Text style={styles.sheetSubtitle}>Escribe o selecciona año, mes y día.</Text>
                    </View>
                    <Pressable style={styles.iconButton} onPress={cancel}>
                      <X size={20} color={colors.muted} />
                    </Pressable>
                  </View>

                  <View style={styles.maskedBox}>
                    <Text style={styles.sectionLabel}>Fecha</Text>
                    <TextInput
                      value={draftInput}
                      onChangeText={applyDraftInput}
                      keyboardType="number-pad"
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={colors.muted}
                      maxLength={10}
                      style={[styles.maskedInput, draftError ? styles.inputError : null]}
                    />
                    {draftError ? <Text style={styles.error}>{draftError}</Text> : null}
                  </View>

                  <View style={styles.previewCard}>
                    <Text style={styles.previewDate}>
                      {safeDay} de {monthNames[month]}, {year}
                    </Text>
                    <Text style={[styles.previewAge, previewValidation ? styles.previewWarning : null]}>
                      {previewValidation ?? `${previewAge} años`}
                    </Text>
                  </View>

                  <Text style={styles.sectionLabel}>Año</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearRow}>
                    {years.map((y) => {
                      const active = y === year;
                      return (
                        <Pressable
                          key={y}
                          onPress={() => applyYear(y)}
                          style={[styles.yearChip, active ? styles.chipActive : null]}
                        >
                          <Text style={[styles.yearText, active ? styles.chipTextActive : null]}>{y}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.sectionLabel}>Mes</Text>
                  <View style={styles.monthGrid}>
                    {monthShort.map((m, index) => {
                      const active = index === month;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => applyMonth(index)}
                          style={[styles.monthChip, active ? styles.chipActive : null]}
                        >
                          <Text style={[styles.monthText, active ? styles.chipTextActive : null]}>{m}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.sectionLabel}>Día</Text>
                  <ScrollView style={styles.dayScroll} contentContainerStyle={styles.dayGrid}>
                    {days.map((d) => {
                      const active = d === safeDay;
                      return (
                        <Pressable
                          key={d}
                          onPress={() => applyDay(d)}
                          style={[styles.dayCell, active ? styles.chipActive : null]}
                        >
                          <Text style={[styles.dayText, active ? styles.chipTextActive : null]}>{d}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.actions}>
                    <Pressable style={styles.cancelButton} onPress={cancel}>
                      <X size={16} color={colors.muted} />
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </Pressable>
                    <Pressable style={styles.clearButton} onPress={clear}>
                      <Text style={styles.clearText}>Limpiar</Text>
                    </Pressable>
                    <Pressable style={styles.doneButton} onPress={confirm}>
                      <Check size={18} color={colors.onPrimary} />
                      <Text style={styles.doneText}>Guardar</Text>
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

type ParsedDate =
  | { ok: true; day: number; month: number; year: number }
  | { ok: false; error: string };

function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join("/");
}

function parseMaskedDate(value: string): ParsedDate {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return { ok: false, error: "Usa el formato DD/MM/AAAA." };
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return { ok: false, error: "Fecha inválida." };
  }
  if (month < 1 || month > 12) return { ok: false, error: "Mes inválido." };
  const maxDay = getDaysInMonth(year, month - 1);
  if (day < 1 || day > maxDay) return { ok: false, error: "Día inválido para ese mes." };
  return { ok: true, day, month, year };
}

function validateBirthdateParts(
  day: number,
  month: number,
  year: number,
  minYear: number,
  maxYear: number,
): string | null {
  if (year < minYear) return `El año mínimo es ${minYear}.`;
  if (year > maxYear) return "La fecha no puede estar en el futuro.";
  const date = new Date(year, month - 1, day);
  const today = new Date();
  if (date.getTime() > today.getTime()) return "La fecha no puede estar en el futuro.";
  const age = calculateAge(date);
  if (age > 130) return "Revisa la fecha: edad mayor a 130 años.";
  return null;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? new Date().getFullYear(), (month ?? 1) - 1, day ?? 1);
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatMaskedDate(date: Date): string {
  return formatMaskedFromParts(date.getDate(), date.getMonth() + 1, date.getFullYear());
}

function formatMaskedFromParts(day: number, month: number, year: number): string {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
}

function calculateAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return Math.max(age, 0);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    group: { gap: 6 },
    label: { color: colors.text, fontSize: 13, fontWeight: "800" },
    input: {
      minHeight: 54,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    inputError: { borderColor: colors.danger },
    inputTextCol: { flex: 1, gap: 2 },
    value: { color: colors.text, fontSize: 16, fontWeight: "900" },
    placeholder: { color: colors.muted, fontWeight: "700" },
    inputHint: { color: colors.muted, fontSize: 11.5, fontWeight: "700" },
    agePill: {
      color: colors.primary,
      fontWeight: "900",
      fontSize: 13,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      overflow: "hidden",
    },
    error: { color: colors.danger, fontSize: 12, lineHeight: 16 },
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      gap: 12,
      maxHeight: "92%",
    },
    handle: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 2,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sheetTitleCol: { flex: 1, gap: 2 },
    sheetTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
    sheetSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 16 },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
    },
    maskedBox: { gap: 6 },
    maskedInput: {
      minHeight: 50,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 14,
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 0,
    },
    previewCard: {
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 12,
      gap: 3,
    },
    previewDate: { color: colors.text, fontSize: 16, fontWeight: "900" },
    previewAge: { color: colors.primary, fontSize: 13, fontWeight: "900" },
    previewWarning: { color: colors.warning },
    sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: "900", marginTop: 2 },
    yearRow: { gap: 8, paddingVertical: 2 },
    yearChip: {
      minWidth: 66,
      alignItems: "center",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    yearText: { color: colors.text, fontWeight: "900", fontSize: 15 },
    monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    monthChip: {
      width: "22%",
      minHeight: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingVertical: 10,
    },
    monthText: { color: colors.text, fontWeight: "900", fontSize: 13 },
    dayScroll: { maxHeight: 154 },
    dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingBottom: 2 },
    dayCell: {
      width: `${100 / 7 - 1.5}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
    },
    dayText: { color: colors.text, fontWeight: "900", fontSize: 14 },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    chipTextActive: { color: colors.onPrimary },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    cancelButton: {
      minHeight: 44,
      flex: 1,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    cancelText: { color: colors.muted, fontWeight: "900" },
    clearButton: {
      minHeight: 44,
      paddingHorizontal: 12,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
    },
    clearText: { color: colors.muted, fontWeight: "900" },
    doneButton: {
      minHeight: 44,
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
    },
    doneText: { color: colors.onPrimary, fontWeight: "900", fontSize: 15 },
  });
}
