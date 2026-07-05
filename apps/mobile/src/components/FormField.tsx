import { useMemo, useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

type FormFieldProps<T extends FieldValues> = TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

export function FormField<T extends FieldValues>({ control, name, label, ...props }: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <FieldInput
          label={label}
          value={value === undefined || value === null ? "" : String(value)}
          onChangeText={onChange}
          onBlurField={onBlur}
          errorMessage={error?.message}
          {...props}
        />
      )}
    />
  );
}

function FieldInput({
  label,
  errorMessage,
  onBlurField,
  ...props
}: TextInputProps & { label: string; errorMessage?: string | undefined; onBlurField: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, focused ? styles.inputFocused : null, errorMessage ? styles.inputError : null]}
        placeholderTextColor={colors.subtle}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlurField();
        }}
        {...props}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    group: {
      gap: 7,
    },
    label: {
      color: colors.muted,
      fontSize: 12.5,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    input: {
      minHeight: 52,
      minWidth: 0,
      borderRadius: radius.sm + 2,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 14,
      color: colors.text,
      fontSize: 15.5,
      fontWeight: "600",
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.backgroundElevated,
      shadowColor: colors.primary,
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
    },
    inputError: {
      borderColor: colors.danger,
    },
    error: {
      color: colors.danger,
      fontSize: 12,
    },
  });
}
