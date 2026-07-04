import { useMemo } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

export type ChoiceOption = {
  label: string;
  value: string;
  description?: string;
};

type ChoiceGroupProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: ChoiceOption[];
};

export function ChoiceGroup<T extends FieldValues>({ control, name, label, options }: ChoiceGroupProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Sin descripciones: chips compactos. Con descripciones: tarjetas apiladas.
  const compact = options.every((option) => !option.description);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.group}>
          <Text style={styles.label}>{label}</Text>
          <View style={compact ? styles.chipRow : styles.options}>
            {options.map((option) => {
              const selected = value === option.value;
              if (compact) {
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => onChange(option.value)}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => onChange(option.value)}
                  style={[styles.option, selected ? styles.selected : null]}
                >
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, selected ? styles.selectedText : null]}>
                      {option.label}
                    </Text>
                    {option.description ? <Text style={styles.description}>{option.description}</Text> : null}
                  </View>
                  {selected ? <Check size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
          {error ? <Text style={styles.error}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    group: {
      gap: 8,
    },
    label: {
      color: colors.muted,
      fontSize: 12.5,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      minHeight: 42,
      justifyContent: "center",
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    chipLabel: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "800",
    },
    chipLabelSelected: {
      color: colors.primary,
    },
    options: {
      gap: 8,
    },
    option: {
      minHeight: 54,
      borderRadius: radius.sm + 2,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    optionText: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
    },
    selectedText: {
      color: colors.primary,
    },
    description: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
    },
    error: {
      color: colors.danger,
      fontSize: 12,
    },
  });
}
