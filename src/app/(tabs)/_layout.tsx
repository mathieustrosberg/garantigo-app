import { NativeTabs } from 'expo-router/native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Mes achats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bag.fill" md="shopping_bag" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="warranties">
        <NativeTabs.Trigger.Label>Mes garanties</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checkmark.shield.fill" md="verified_user" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
