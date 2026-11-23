import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Button, FieldError, Label } from 'heroui-native';
import { Platform, View } from 'react-native';

import { formatStoredDate, fromStoredDate, toStoredDate } from '@/purchases/purchase-date';

type DateFieldProps = {
  label: string;
  /** Day formatted as 'YYYY-MM-DD'. */
  value: string;
  onChange: (value: string) => void;
  /** Latest day that can be picked, formatted as 'YYYY-MM-DD'. */
  maximumDate: string;
  errorMessage?: string;
};

/** Date input based on the native date picker of the phone. */
export function DateField({ label, value, onChange, maximumDate, errorMessage }: DateFieldProps) {
  const pickerValue = fromStoredDate(value) ?? new Date();
  const pickerMaximumDate = fromStoredDate(maximumDate) ?? undefined;

  function handlePickedDate(pickedDate: Date) {
    onChange(toStoredDate(pickedDate));
  }

  // Android shows the picker in a dialog that must be opened by hand.
  function openAndroidPicker() {
    DateTimePickerAndroid.open({
      value: pickerValue,
      mode: 'date',
      maximumDate: pickerMaximumDate,
      onValueChange: (_event, pickedDate) => handlePickedDate(pickedDate),
    });
  }

  return (
    <View className="gap-2">
      <Label isRequired isInvalid={errorMessage !== undefined}>
        {label}
      </Label>

      {Platform.OS === 'android' ? (
        <Button variant="secondary" onPress={openAndroidPicker}>
          {formatStoredDate(value)}
        </Button>
      ) : (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="compact"
          locale="fr-FR"
          maximumDate={pickerMaximumDate}
          onValueChange={(_event, pickedDate) => handlePickedDate(pickedDate)}
          accessibilityLabel={label}
          style={{ alignSelf: 'flex-start' }}
        />
      )}

      <FieldError isInvalid={errorMessage !== undefined}>{errorMessage}</FieldError>
    </View>
  );
}
