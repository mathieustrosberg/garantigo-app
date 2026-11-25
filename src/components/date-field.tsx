import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { FieldError, Input, Label } from 'heroui-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { formatStoredDate, fromStoredDate, toStoredDate } from '@/purchases/purchase-date';
import { useBrandTint } from '@/theme/brand-colors';

type DateFieldProps = {
  label: string;
  /** Day formatted as 'YYYY-MM-DD'. */
  value: string;
  onChange: (value: string) => void;
  /** Latest day that can be picked, formatted as 'YYYY-MM-DD'. */
  maximumDate: string;
  errorMessage?: string;
};

/**
 * Date input that looks like the other fields of the form.
 * Pressing it opens the native date picker of the phone.
 */
export function DateField({ label, value, onChange, maximumDate, errorMessage }: DateFieldProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const brandTint = useBrandTint();
  const pickerValue = fromStoredDate(value) ?? new Date();
  const pickerMaximumDate = fromStoredDate(maximumDate) ?? undefined;
  const formattedValue = formatStoredDate(value);

  function handlePickedDate(pickedDate: Date) {
    onChange(toStoredDate(pickedDate));
    setIsCalendarOpen(false);
  }

  function handlePress() {
    // Android shows the picker in its own dialog; iOS shows a calendar under the field.
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerValue,
        mode: 'date',
        maximumDate: pickerMaximumDate,
        onValueChange: (_event, pickedDate) => handlePickedDate(pickedDate),
      });
      return;
    }
    setIsCalendarOpen(!isCalendarOpen);
  }

  return (
    <View className="gap-1.5">
      <Label isRequired isInvalid={errorMessage !== undefined}>
        {label}
      </Label>

      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${formattedValue}`}
        accessibilityHint="Ouvre le calendrier"
      >
        {/* The input only displays the date: touches go to the Pressable around it. */}
        <View pointerEvents="none">
          <Input value={formattedValue} editable={false} isInvalid={errorMessage !== undefined} />
        </View>
      </Pressable>

      {isCalendarOpen && (
        <DateTimePicker
          testID="date-field-calendar"
          value={pickerValue}
          mode="date"
          display="inline"
          locale="fr-FR"
          accentColor={brandTint}
          maximumDate={pickerMaximumDate}
          onValueChange={(_event, pickedDate) => handlePickedDate(pickedDate)}
        />
      )}

      <FieldError isInvalid={errorMessage !== undefined}>{errorMessage}</FieldError>
    </View>
  );
}
