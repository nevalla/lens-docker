import { dropDownMenu, getDropDownMenuItemInjectableBunch, getDropDownMenuKind } from "@k8slens/drop-down-menu-contracts";
import { DropDownMenuItemRow } from "@k8slens/drop-down-menu-items";
import { DeleteIcon, MoreVerticalIcon } from "@k8slens/icon";
import { getInjectable2, getInjectableBunch, type Injectable2 } from "@k8slens/injectable";
import { PlainButton } from "@k8slens/input-components";
import { openModalInjectionToken } from "@k8slens/modal-contracts";
import { useInject } from "@k8slens/use-inject";
import type { SelectionActionsProps } from "../list/get-docker-list";
import { IconAction } from "../list/icon-action";
import { confirmRemovalModalKind } from "./confirm-removal-modal.injectable";
import { describeItems, runDockerCommandInjectable } from "./run-docker-command.injectable";

interface RemoveActionsParams<Item> {
  readonly id: string;
  // "container", "image": what the confirmation and the notifications call one.
  readonly noun: string;
  // The shell script removing the items.
  readonly scriptFor: (items: readonly Item[]) => string;
  // What the confirmation says beyond the question.
  readonly note: string;
  readonly nameOf: (item: Item) => string;
  readonly refresh: Injectable2<() => () => void>;
}

// Removing items of a kind after confirming: the action, a row menu holding it, and the toolbar's button.
// Call at module scope only, so the components it makes keep their identity.
export const getRemoveActions = <Item,>({ id, noun, scriptFor, note, nameOf, refresh }: RemoveActionsParams<Item>) => {
  // Answers whether the user went ahead.
  const remove = getInjectable2({
    id: `docker-remove-${id}`,
    consumptions: [openModalInjectionToken],

    instantiate: (di) => {
      const confirmRemoval = di.inject(openModalInjectionToken.for(confirmRemovalModalKind).for(di.scopeIds))();
      const runDockerCommand = di.inject(runDockerCommandInjectable)();
      const refreshItems = di.inject(refresh)();

      return () => async (items: readonly Item[]) => {
        const names = items.map(nameOf);

        if (items.length === 0 || !(await confirmRemoval(noun, names, note))) {
          return false;
        }

        await runDockerCommand({
          script: scriptFor(items),
          subject: describeItems(noun, names),
          done: "Removed",
          verb: "remove",
        });
        refreshItems();

        return true;
      };
    },
  });

  const rowMenuKind = getDropDownMenuKind<{ readonly item: Item }>()(`docker-${id}-row-menu`);

  const RemoveMenuItem = ({ data }: { data: { readonly item: Item } }) => {
    const removeItems = useInject(remove)();

    return (
      <DropDownMenuItemRow Icon={DeleteIcon} $onClick={() => void removeItems([data.item])}>
        Remove
      </DropDownMenuItemRow>
    );
  };

  // Vertical dots, as at the end of the rows of Lens's own lists.
  const RowActions = ({ row }: { row: Item }) => (
    <IconAction label="Actions" Icon={MoreVerticalIcon} menu={dropDownMenu(rowMenuKind, { data: { item: row } })} />
  );

  const RemoveSelected = ({ rows, clearSelection }: SelectionActionsProps<Item>) => {
    const removeItems = useInject(remove)();

    return (
      <PlainButton Icon={DeleteIcon} onClick={() => void removeItems(rows).then((removed) => removed && clearSelection())}>
        Remove
      </PlainButton>
    );
  };

  // For a drawer's title bar: closes the drawer once removed.
  const RemoveIcon = ({ item, close }: { item: Item; close: () => void }) => {
    const removeItems = useInject(remove)();

    return (
      <IconAction
        label="Remove"
        Icon={DeleteIcon}
        size="l"
        onClick={() => void removeItems([item]).then((removed) => removed && close())}
      />
    );
  };

  return getInjectableBunch({
    remove,
    removeMenuItem: getDropDownMenuItemInjectableBunch({
      id: `docker-${id}-remove`,
      kind: rowMenuKind,
      orderNumber: 100,
      Component: RemoveMenuItem,
    }),
    rowMenuKind,
    RowActions,
    RemoveSelected,
    RemoveIcon,
  });
};
