import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import { Platform } from 'react-native';

import { DateField } from './date-field';

async function renderDateField(
  errorMessage?: string,
  onChange: (value: string) => void = () => {},
) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <DateField
        label="Date d’achat"
        value="2026-11-18"
        onChange={onChange}
        maximumDate="2026-11-23"
        errorMessage={errorMessage}
      />
    </HeroUINativeProvider>,
  );
}

describe('DateField', () => {
  it('shows the date in French, like a text field', async () => {
    await renderDateField();

    expect(screen.getByDisplayValue('18 novembre 2026')).toBeTruthy();
    expect(screen.queryByTestId('date-field-calendar')).toBeNull();
  });

  it('opens the calendar when pressed, and closes it when pressed again', async () => {
    await renderDateField();
    const field = screen.getByLabelText('Date d’achat : 18 novembre 2026');

    await fireEvent.press(field);
    expect(screen.getByTestId('date-field-calendar')).toBeTruthy();

    await fireEvent.press(field);
    expect(screen.queryByTestId('date-field-calendar')).toBeNull();
  });

  it('shows the error message under the field', async () => {
    await renderDateField('La date d’achat ne peut pas être dans le futur.');

    expect(await screen.findByText('La date d’achat ne peut pas être dans le futur.')).toBeTruthy();
  });

  it('gives the picked day as text and closes the calendar', async () => {
    const onChange = jest.fn();
    await renderDateField(undefined, onChange);
    await fireEvent.press(screen.getByLabelText('Date d’achat : 18 novembre 2026'));

    // The native calendar reports the picked day as a timestamp.
    await fireEvent(screen.getByTestId('date-field-calendar'), 'change', {
      nativeEvent: { timestamp: new Date(2026, 10, 10).getTime() },
    });

    expect(onChange).toHaveBeenCalledWith('2026-11-10');
    expect(screen.queryByTestId('date-field-calendar')).toBeNull();
  });
});

describe('DateField on Android', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens the system dialog, limited to the maximum date, and gives the picked day', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const open = jest.spyOn(DateTimePickerAndroid, 'open').mockImplementation(() => {});
    const onChange = jest.fn();
    await renderDateField(undefined, onChange);

    await fireEvent.press(screen.getByLabelText('Date d’achat : 18 novembre 2026'));

    expect(open).toHaveBeenCalledTimes(1);
    const dialogOptions = open.mock.calls[0][0];
    expect(dialogOptions.value).toEqual(new Date(2026, 10, 18));
    expect(dialogOptions.maximumDate).toEqual(new Date(2026, 10, 23));
    expect(screen.queryByTestId('date-field-calendar')).toBeNull();

    dialogOptions.onValueChange?.(
      { nativeEvent: { timestamp: 0, utcOffset: 0 } },
      new Date(2026, 10, 5),
    );

    expect(onChange).toHaveBeenCalledWith('2026-11-05');
  });
});
