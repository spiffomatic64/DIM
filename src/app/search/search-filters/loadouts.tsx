import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { Loadout } from '../../loadout/loadout-types';
import { FilterDefinition } from '../filter-types';

const loadouts: Loadout[] = [];
const _loadoutItemIds: Set<string> = new Set();

const loadoutFilters: FilterDefinition[] = [
  {
    keywords: ['inloadout'],
    description: [tl('Filter.InLoadout')],
    format: 'simple',
    destinyVersion: 0,
    contextGenerator: collectItemsInLoadouts,
    filterFunction: (item: DimItem) => _loadoutItemIds.has(item.id),
  },
];

export default loadoutFilters;

function collectItemsInLoadouts() {
  _loadoutItemIds.clear();
  for (const loadout of loadouts) {
    for (const item of loadout.items) {
      if (item.id && item.id !== '0') {
        _loadoutItemIds.add(item.id);
      }
    }
  }
}
