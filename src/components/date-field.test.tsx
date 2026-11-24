import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import { DateField } from './date-field';

async function renderDateField(errorMessage?: string) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <DateField
        label="Date d’achat"
        value="2026-11-18"
        onChange={() => {}}
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
});
