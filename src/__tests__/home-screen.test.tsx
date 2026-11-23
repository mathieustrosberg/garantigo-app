import { render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import HomeScreen from '@/app/index';

describe('HomeScreen', () => {
  it('shows the application name', async () => {
    await render(
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <HomeScreen />
      </HeroUINativeProvider>,
    );

    expect(screen.getByText('GarantiGo')).toBeTruthy();
  });
});
