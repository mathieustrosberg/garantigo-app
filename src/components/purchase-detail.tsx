import { Button, Surface } from 'heroui-native';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';

import type { Purchase } from '@/purchases/purchase';
import { formatStoredDate } from '@/purchases/purchase-date';
import { CATEGORY_LABELS, formatPrice } from '@/purchases/purchase-labels';
import { getWarranty } from '@/purchases/warranty';
import { getRemainingDaysLabel } from '@/purchases/warranty-labels';
import { getStorageErrorMessage } from '@/storage/storage-error-message';

import { WarrantyStatusChip } from './warranty-status-chip';

type PurchaseDetailProps = {
  purchase: Purchase;
  /** 'YYYY-MM-DD', passed by the screen so that tests never depend on the real date. */
  today: string;
  /** Address of the receipt photo, or undefined when the file is missing from the phone. */
  receiptUri: string | undefined;
  onEdit: () => void;
  /** Deletes the purchase once confirmed. When it rejects, the detail explains the error. */
  onDelete: () => Promise<void>;
};

/** Everything about one purchase: its warranty first, then the information typed in the form. */
export function PurchaseDetail({
  purchase,
  today,
  receiptUri,
  onEdit,
  onDelete,
}: PurchaseDetailProps) {
  const warranty = getWarranty(purchase, today);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  async function deletePurchase() {
    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await onDelete();
    } catch (error) {
      setDeleteError(getStorageErrorMessage(error));
      setIsDeleting(false);
    }
  }

  function confirmDeletion() {
    const deleted =
      purchase.receiptFileName === undefined
        ? `« ${purchase.name} » sera supprimé.`
        : `« ${purchase.name} » et la photo de son ticket seront supprimés.`;

    Alert.alert('Supprimer cet achat ?', `${deleted} Cette action est définitive.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: deletePurchase },
    ]);
  }

  // "automatic" makes iOS start the content below the navigation header instead of under it.
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
    >
      <View className="gap-3">
        <View className="flex-row">
          <WarrantyStatusChip status={warranty.status} />
        </View>
        <Text className="text-2xl font-bold text-foreground">{purchase.name}</Text>
      </View>

      <Surface className="gap-1.5">
        <Text className="text-sm text-muted">Fin de garantie</Text>
        <Text className="text-lg font-bold text-foreground">
          {formatStoredDate(warranty.endDate)}
        </Text>
        <Text className="text-base text-muted">
          {getRemainingDaysLabel(warranty.remainingDays)}
        </Text>
      </Surface>

      <Surface className="gap-3">
        <DetailRow label="Date d’achat" value={formatStoredDate(purchase.purchaseDate)} />
        <DetailRow label="Durée de garantie" value={`${purchase.warrantyMonths} mois`} />
        <DetailRow
          label="Prix"
          value={purchase.price === undefined ? 'Non renseigné' : formatPrice(purchase.price)}
        />
        <DetailRow
          label="Catégorie"
          value={
            purchase.category === undefined ? 'Non renseignée' : CATEGORY_LABELS[purchase.category]
          }
        />
      </Surface>

      <Surface className="gap-3">
        <Text className="text-sm text-muted">Ticket de caisse</Text>
        <ReceiptPhoto hasReceipt={purchase.receiptFileName !== undefined} uri={receiptUri} />
      </Surface>

      {deleteError !== undefined && <Text className="text-base text-danger">{deleteError}</Text>}

      <View className="gap-3">
        <Button onPress={onEdit} isDisabled={isDeleting}>
          Modifier
        </Button>
        <Button variant="danger-soft" onPress={confirmDeletion} isDisabled={isDeleting}>
          {isDeleting ? 'Suppression…' : 'Supprimer'}
        </Button>
      </View>
    </ScrollView>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View className="flex-row gap-3" accessible accessibilityLabel={`${label} : ${value}`}>
      <Text className="flex-1 text-base text-muted">{label}</Text>
      <Text className="text-base text-foreground">{value}</Text>
    </View>
  );
}

type ReceiptPhotoProps = {
  hasReceipt: boolean;
  uri: string | undefined;
};

function ReceiptPhoto({ hasReceipt, uri }: ReceiptPhotoProps) {
  if (!hasReceipt) {
    return <Text className="text-base text-foreground">Aucune photo du ticket</Text>;
  }
  if (uri === undefined) {
    return (
      <Text className="text-base text-foreground">
        La photo du ticket est introuvable sur ce téléphone.
      </Text>
    );
  }
  return (
    <Image
      source={{ uri }}
      accessibilityLabel="Photo du ticket de caisse"
      resizeMode="contain"
      className="aspect-[3/4] w-full rounded-xl"
    />
  );
}
