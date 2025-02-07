import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { updateLoadout } from 'app/loadout-drawer/actions';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { DimLoadoutItem, Loadout, LoadoutItem } from 'app/loadout-drawer/loadout-types';
import { convertToLoadoutItem } from 'app/loadout-drawer/loadout-utils';
import LoadoutView from 'app/loadout/LoadoutView';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ArmorSet, LockableBucketHashes } from '../types';
import styles from './CompareDrawer.m.scss';

interface Props {
  set: ArmorSet;
  selectedStore: DimStore;
  loadouts: Loadout[];
  initialLoadoutId?: string;
  subclass: DimLoadoutItem | undefined;
  classType: DestinyClass;
  params: LoadoutParameters;
  notes?: string;
  onClose(): void;
}

function chooseInitialLoadout(
  setItems: DimItem[],
  useableLoadouts: Loadout[],
  initialLoadoutId?: string
): Loadout | undefined {
  const loadoutFromInitialId = useableLoadouts.find((lo) => lo.id === initialLoadoutId);
  if (loadoutFromInitialId) {
    return loadoutFromInitialId;
  }
  const exotic = setItems.find((i) => i.isExotic);
  return (
    (exotic && useableLoadouts.find((l) => l.items.some((i) => i.hash === exotic.hash))) ||
    (useableLoadouts.length ? useableLoadouts[0] : undefined)
  );
}

function createLoadoutUsingLOItems(
  setItems: DimItem[],
  subclass: DimLoadoutItem | undefined,
  loadout: Loadout | undefined,
  loadoutItems: DimItem[],
  loadoutSubclass: DimLoadoutItem | undefined,
  params: LoadoutParameters,
  notes: string | undefined
) {
  return produce(loadout, (draftLoadout) => {
    if (draftLoadout) {
      const newItems: LoadoutItem[] = setItems.map((item) => convertToLoadoutItem(item, true));

      if (subclass) {
        newItems.push(convertToLoadoutItem(subclass, true));
      }

      for (const item of draftLoadout.items) {
        const dimItem = loadoutItems.find((i) => i.id === item.id);
        const hasBeenReplaced =
          (dimItem && setItems.some((i) => i.bucket.hash === dimItem.bucket.hash)) ||
          (subclass && item.id === loadoutSubclass?.id);
        if (!hasBeenReplaced) {
          newItems.push(item);
        }
      }

      draftLoadout.items = newItems;
      draftLoadout.parameters = params;
      draftLoadout.notes = notes || draftLoadout.notes;
    }
  });
}

export default function CompareDrawer({
  loadouts,
  selectedStore,
  initialLoadoutId,
  set,
  subclass,
  classType,
  params,
  notes,
  onClose,
}: Props) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const useableLoadouts = loadouts.filter((l) => l.classType === classType);

  const setItems = set.armor.map((items) => items[0]);

  const [selectedLoadout, setSelectedLoadout] = useState<Loadout | undefined>(() =>
    chooseInitialLoadout(setItems, useableLoadouts, initialLoadoutId)
  );

  const allItems = useSelector(allItemsSelector);

  // This probably isn't needed but I am being cautious as it iterates over the stores.
  const { loadoutItems, loadoutSubclass } = useMemo(() => {
    const equippedItems = selectedLoadout?.items.filter((item) => item.equipped);
    const [items] = getItemsFromLoadoutItems(equippedItems, defs, buckets, allItems);
    const loadoutItems = _.sortBy(
      items.filter((item) => LockableBucketHashes.includes(item.bucket.hash)),
      (item) => LockableBucketHashes.indexOf(item.bucket.hash)
    );
    const loadoutSubclass = items.find(
      (item) => item.bucket.hash === BucketHashes.Subclass && item.classType === classType
    );
    return { loadoutItems, loadoutSubclass };
  }, [selectedLoadout?.items, defs, buckets, allItems, classType]);

  if (!set) {
    return null;
  }

  const generatedLoadout = createLoadoutUsingLOItems(
    setItems,
    subclass,
    selectedLoadout,
    loadoutItems,
    loadoutSubclass,
    params,
    notes
  );

  const onSaveLoadout = (e: React.MouseEvent) => {
    e.preventDefault();

    if (
      selectedLoadout &&
      !confirm(t('LoadoutBuilder.ConfirmOverwrite', { name: selectedLoadout.name }))
    ) {
      return;
    }

    if (!generatedLoadout) {
      return;
    }

    dispatch(updateLoadout(generatedLoadout));
    onClose();
  };

  const header = <div className={styles.header}>{t('LoadoutBuilder.CompareLoadout')}</div>;

  // This is likely never to happen but since it is disconnected to the button its here for safety.
  if (!selectedLoadout || !generatedLoadout) {
    return (
      <Sheet onClose={onClose} header={header}>
        <div className={styles.noLoadouts}>{t('LoadoutBuilder.NoLoadoutsToCompare')}</div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} header={header}>
      <div className={styles.content}>
        <div>
          <div className={clsx(styles.fillRow, styles.setHeader)}>
            <div className={styles.setTitle}>{t('LoadoutBuilder.OptimizerSet')}</div>
          </div>
          <LoadoutView
            loadout={generatedLoadout}
            store={selectedStore}
            hideOptimizeArmor={true}
            actionButtons={[
              <button key="save" className="dim-button" type="button" onClick={onSaveLoadout}>
                {t('LoadoutBuilder.SaveAs')}{' '}
                <span className={styles.loadoutName}>{selectedLoadout.name}</span>
              </button>,
            ]}
          />
        </div>
        <div>
          <div className={clsx(styles.fillRow, styles.setHeader)}>
            <div className={styles.setTitle}>{t('LoadoutBuilder.ExistingLoadout')}</div>
          </div>
          <LoadoutView
            loadout={selectedLoadout}
            store={selectedStore}
            hideOptimizeArmor={true}
            actionButtons={[
              <select
                key="select-loadout"
                value={selectedLoadout.id}
                onChange={(event) => {
                  const selected = useableLoadouts.find((l) => l.id === event.target.value);
                  setSelectedLoadout(selected);
                }}
              >
                {useableLoadouts.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>,
            ]}
          />
        </div>
      </div>
    </Sheet>
  );
}
