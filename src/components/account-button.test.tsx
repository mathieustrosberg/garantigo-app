import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import { AccountButton } from './account-button';

describe('AccountButton', () => {
  it('opens the account when pressed', async () => {
    const onPress = jest.fn();
    await render(
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <AccountButton onPress={onPress} />
      </HeroUINativeProvider>,
    );

    await fireEvent.press(screen.getByLabelText('Compte'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
