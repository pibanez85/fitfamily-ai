import { useMemo, useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { CalendarDays } from "lucide-react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
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

// Fecha de nacimiento escrita directo (DD/MM/AAAA), sin calendario ni
// selectores de año. Emite la fecha en ISO (AAAA-MM-DD) o "" mientras
// esta incompleta o invalida.
export function DateOfBirthPicker<T extends FieldValues>({
  control,
  name,
  label,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
}: DateOfBirthPickerProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <DateOfBirthField
          label={label}
          isoValue={typeof value === "string" ? value : ""}
          onChangeIso={onChange}
          minYear={minYear}
          maxYear={maxYear}
          errorMessage={error?.message}
        />
      )}
    />
  );
}

function DateOfBirthField({
  label,
  isoValue,
  onChangeIso,
  minYear,
  maxYear,
  errorMessage,
}: {
  label: string;
  isoValue: string;
  onChangeIso: (value: string) => void;
  minYear: number;
  maxYear: number;
  errorMessage?: string | undefined;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [draft, setDraft] = useState(() => (isoValue ? formatMaskedDate(parseIsoDate(isoValue)) : ""));
  const [localError, setLocalError] = useState<string | null>(null);

  const complete = draft.length === 10 ? parseMaskedDate(draft) : null;
  const validation =
    complete && complete.ok
      ? validateBirthdateParts(complete.day, complete.month, complete.year, minYear, maxYear)
      : null;
  const age =
    complete && complete.ok && !validation
      ? calculateAge(new Date(complete.year, complete.month - 1, complete.day))
      : null;

  function handleChange(text: string) {
    const masked = maskDateInput(text);
    setDraft(masked);

    if (masked.length < 10) {
      setLocalError(null);
      onChangeIso("");
      return;
    }

    const parsed = parseMaskedDate(masked);
    if (!parsed.ok) {
      setLocalError(parsed.error);
      onChangeIso("");
      return;
    }

    const invalid = validateBirthdateParts(parsed.day, parsed.month, parsed.year, minYear, maxYear);
    if (invalid) {
      setLocalError(invalid);
      onChangeIso("");
      return;
    }

    setLocalError(null);
    onChangeIso(toIsoDate(new Date(parsed.year, parsed.month - 1, parsed.day)));
  }

  const shownError = localError ?? errorMessage ?? null;

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, shownError ? styles.inputError : null]}>
        <CalendarDays size={18} color={colors.primary} />
        <TextInput
          value={draft}
          onChangeText={handleChange}
          keyboardType="number-pad"
          placeholder="DD/MM/AAAA"
          placeholderTextColor={colors.subtle}
          maxLength={10}
          style={styles.input}
        />
        {age !== null ? <Text style={styles.agePill}>{age} años</Text> : null}
      </View>
      {shownError ? (
        <Text style={styles.error}>{shownError}</Text>
      ) : (
        <Text style={styles.hint}>Escribe tu fecha, por ejemplo 05/12/1990.</Text>
      )}
    </View>
  );
}

type ParsedDate = { ok: true; day: number; month: number; year: number } | { ok: false; error: string };

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
  if (month < 1 || month > 12) return { ok: false, error: "Mes invalido." };
  const maxDay = getDaysInMonth(year, month - 1);
  if (day < 1 || day > maxDay) return { ok: false, error: "Dia invalido para ese mes." };
  return { ok: true, day, month, year };
}

function validateBirthdateParts(
  day: number,
  month: number,
  year: number,
  minYear: number,
  maxYear: number,
): string | null {
  if (year < minYear) return `El año minimo es ${minYear}.`;
  if (year > maxYear) return "La fecha no puede estar en el futuro.";
  const date = new Date(year, month - 1, day);
  if (date.getTime() > Date.now()) return "La fecha no puede estar en el futuro.";
  if (calculateAge(date) > 130) return "Revisa la fecha: edad mayor a 130 años.";
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
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
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

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    group: { gap: 7 },
    label: { color: colors.muted, fontSize: 12.5, fontWeight: "800", letterSpacing: 0.3 },
    inputRow: {
      minHeight: 52,
      borderRadius: radius.sm + 2,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    inputError: { borderColor: colors.danger },
    input: {
      flex: 1,
      minWidth: 0,
      minHeight: 52,
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 1,
    },
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
    hint: { color: colors.subtle, fontSize: 11.5 },
  });
}
