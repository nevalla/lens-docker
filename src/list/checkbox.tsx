import { Button, type ButtonProps } from "@k8slens/element-components";
import { CheckIcon } from "@k8slens/icon";

interface CheckboxProps extends Omit<ButtonProps, "children"> {
  readonly checked: boolean;
  readonly onToggle: () => void;
  readonly label: string;
}

// Drawn the way Lens's own lists draw their row checkboxes, at the start of its cell.
export const Checkbox = ({ checked, onToggle, label, ...rest }: CheckboxProps) => (
  <Button
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    $size="s"
    $flex={{ horizontalAlign: "center", verticalAlign: "center" }}
    $border={{ radius: "s", width: "xxs", color: { normal: "grey20", disabled: "grey25" } }}
    $color="primary"
    $onClick={onToggle}
    {...rest}
  >
    {checked && <CheckIcon $size="s" />}
  </Button>
);
