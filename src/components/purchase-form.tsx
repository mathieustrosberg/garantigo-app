import { Button, FieldError, Input, Label, TagGroup, TextField } from 'heroui-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { PurchaseCategory, PurchaseInput } from '@/purchases/purchase';
import { getToday } from '@/purchases/purchase-date';
import { CATEGORY_LABELS } from '@/purchases/purchase-labels';
import {
  validatePurchaseForm,
  type PurchaseFormErrors,
  type PurchaseFormValues,
} from '@/purchases/purchase-validation';
import { getStorageErrorMessage } from '@/storage/storage-error-message';

import { DateField } from './date-field';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as PurchaseCategory[];

type PurchaseFormProps = {
  initialValues: PurchaseFormValues;
  submitLabel: string;
  /** Saves the purchase. When it rejects, the form explains the error and stays open. */
  onSubmit: (input: PurchaseInput) => Promise<void>;
  onCancel: () => void;
};

/** Form shared by the "add" and "edit" screens. */
export function PurchaseForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: PurchaseFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PurchaseFormErrors>({});
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const today = getToday();

  function changeValue(changes: Partial<PurchaseFormValues>) {
    setValues((currentValues) => ({ ...currentValues, ...changes }));
  }

  async function handleSubmit() {
    const result = validatePurchaseForm(values, today);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSaveError(undefined);
    setIsSaving(true);
    try {
      await onSubmit(result.input);
    } catch (error) {
      setSaveError(getStorageErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  // "automatic" makes iOS start the content below the navigation header instead of under it.
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-6"
    >
      <TextField isRequired isInvalid={errors.name !== undefined}>
        <Label>Nom du produit</Label>
        <Input
          value={values.name}
          onChangeText={(name) => changeValue({ name })}
          placeholder="Ex. Casque audio"
          maxLength={70}
          returnKeyType="done"
        />
        <FieldError>{errors.name}</FieldError>
      </TextField>

      <DateField
        label="Date d’achat"
        value={values.purchaseDate}
        onChange={(purchaseDate) => changeValue({ purchaseDate })}
        maximumDate={today}
        errorMessage={errors.purchaseDate}
      />

      <TextField isRequired isInvalid={errors.warrantyMonths !== undefined}>
        <Label>Durée de garantie (en mois)</Label>
        <Input
          value={values.warrantyMonths}
          onChangeText={(warrantyMonths) => changeValue({ warrantyMonths })}
          placeholder="Ex. 24"
          keyboardType="number-pad"
          maxLength={3}
        />
        <FieldError>{errors.warrantyMonths}</FieldError>
      </TextField>

      <TextField isInvalid={errors.price !== undefined}>
        <Label>Prix (€)</Label>
        <Input
          value={values.price}
          onChangeText={(price) => changeValue({ price })}
          placeholder="Ex. 349,99"
          keyboardType="decimal-pad"
          maxLength={10}
        />
        <FieldError>{errors.price}</FieldError>
      </TextField>

      <View className="gap-1.5">
        <Label>Catégorie</Label>
        <TagGroup
          selectionMode="single"
          selectedKeys={values.category === undefined ? [] : [values.category]}
          onSelectionChange={(selectedKeys) => changeValue({ category: getCategory(selectedKeys) })}
        >
          <TagGroup.List>
            {CATEGORIES.map((category) => (
              <TagGroup.Item key={category} id={category}>
                {CATEGORY_LABELS[category]}
              </TagGroup.Item>
            ))}
          </TagGroup.List>
        </TagGroup>
      </View>

      {saveError !== undefined && <Text className="text-base text-danger">{saveError}</Text>}

      <View className="gap-3">
        <Button onPress={handleSubmit} isDisabled={isSaving}>
          {isSaving ? 'Enregistrement…' : submitLabel}
        </Button>
        <Button variant="secondary" onPress={onCancel} isDisabled={isSaving}>
          Annuler
        </Button>
      </View>
    </ScrollView>
  );
}

/** A single-selection tag group gives a set with zero or one key. */
function getCategory(selectedKeys: Set<string | number>): PurchaseCategory | undefined {
  const [selectedKey] = selectedKeys;
  return CATEGORIES.find((category) => category === selectedKey);
}
