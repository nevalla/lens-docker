import { P } from "@k8slens/element-components";
import { WarningIcon } from "@k8slens/icon";
import { PlainButton, PrimaryButton } from "@k8slens/input-components";
import { ModalContainer, ModalContent, ModalFooter, ModalHeader } from "@k8slens/modal-components";
import { getModalInjectableBunch, getModalKind, type ModalProps, useRespondFromModal } from "@k8slens/modal-contracts";

// A question that cannot be taken back once answered yes, asked the way removing is confirmed.
export const confirmModalKind = getModalKind<[question: string, note: string, confirm: string], boolean>()(
  "confirm-docker-action",
);

const ConfirmModal = ({ input: [question, note, confirm] }: ModalProps<typeof confirmModalKind>) => {
  const respond = useRespondFromModal(confirmModalKind);

  return (
    <ModalContainer $style={{ maxWidth: "calc(var(--unit) * 140)" }}>
      <ModalHeader icon={<WarningIcon $color="critical" />}>Confirm</ModalHeader>

      <ModalContent>
        <P>{question}</P>
        <P $color="textMuted">{note}</P>
      </ModalContent>

      <ModalFooter>
        <PlainButton onClick={() => respond(false)}>Cancel</PlainButton>
        <PrimaryButton onClick={() => respond(true)}>{confirm}</PrimaryButton>
      </ModalFooter>
    </ModalContainer>
  );
};

export const confirmModal = getModalInjectableBunch({
  kind: confirmModalKind,
  Component: ConfirmModal,
  onClose: () => false,
});
