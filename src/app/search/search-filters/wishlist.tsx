import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { FilterDefinition } from '../filter-types';
import { checkIfIsDupe, computeDupes, makeDupeID } from './dupes';

const checkIfIsWishlist = (
  item: DimItem,
  wishListFunction: (item: DimItem) => InventoryWishListRoll | undefined
) => {
  const roll = wishListFunction(item);
  return roll && !roll.isUndesirable;
};

const wishlistFilters: FilterDefinition[] = [
  {
    keywords: 'wishlist',
    description: tl('Filter.Wishlist'),
    filter:
      ({ wishListFunction }) =>
      (item) =>
        checkIfIsWishlist(item, wishListFunction),
  },
  {
    keywords: 'wishlistdupe',
    description: tl('Filter.WishlistDupe'),
    filter: ({ wishListFunction, allItems }) => {
      const duplicates = computeDupes(allItems);
      return (item) => {
        const dupeId = makeDupeID(item);
        if (!checkIfIsDupe(duplicates, dupeId, item)) {
          return false;
        }
        const itemDupes = duplicates?.[dupeId];
        return itemDupes?.some((d) => checkIfIsWishlist(d, wishListFunction));
      };
    },
  },
  {
    keywords: 'wishlistnotes',
    description: tl('Filter.WishlistNotes'),
    format: 'freeform',
    filter:
      ({ wishListFunction, filterValue }) =>
      (item) =>
        wishListFunction(item)?.notes?.toLocaleLowerCase().includes(filterValue),
  },
  {
    keywords: 'trashlist',
    description: tl('Filter.Trashlist'),
    filter:
      ({ wishListFunction }) =>
      (item) =>
        wishListFunction(item)?.isUndesirable,
  },
];

export default wishlistFilters;
