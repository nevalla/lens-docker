import { P, Span } from "@k8slens/element-components";
import { WarningIcon } from "@k8slens/icon";
import { PlainButton, PrimaryButton } from "@k8slens/input-components";
import { ModalContainer, ModalContent, ModalFooter, ModalHeader } from "@k8slens/modal-components";
import { getModalInjectableBunch, getModalKind, type ModalProps, useRespondFromModal } from "@k8slens/modal-contracts";

export const confirmRemovalModalKind = getModalKind<[noun: string, names: readonly string[], note: string], boolean>()(
  "confirm-docker-removal",
);

const ConfirmRemovalModal = ({ input: [noun, names, note] }: ModalProps<typeof confirmRemovalModalKind>) => {
  const respond = useRespondFromModal(confirmRemovalModalKind);

  return (
    <ModalContainer $style={{ maxWidth: "calc(var(--unit) * 140)" }}>
      <ModalHeader icon={<WarningIcon $color="critical" />}>Confirm</ModalHeader>

      <ModalContent>
        {names.length === 1 ? (
          <P>
            Remove {noun} <Span $font={{ bold: true }}>{names[0]}</Span>?
          </P>
        ) : (
          <P>
            Remove {names.length} {noun}s: <Span $font={{ bold: true }}>{names.join(", ")}</Span>?
          </P>
        )}
        <P $color="textMuted">{note}</P>
      </ModalContent>

      <ModalFooter>
        <PlainButton onClick={() => respond(false)}>Cancel</PlainButton>
        <PrimaryButton onClick={() => respond(true)}>Remove</PrimaryButton>
      </ModalFooter>
    </ModalContainer>
  );
};

export const confirmRemovalModal = getModalInjectableBunch({
  kind: confirmRemovalModalKind,
  Component: ConfirmRemovalModal,
  onClose: () => false,
});
