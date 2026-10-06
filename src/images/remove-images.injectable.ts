import { dockerScript } from "../actions/run-docker-command.injectable";
import { getRemoveActions } from "../actions/get-remove-actions";
import { type DockerImage, dockerImageRows, imageReference } from "./image-rows.injectable";

export const imageRemoval = getRemoveActions<DockerImage>({
  id: "images",
  noun: "image",
  scriptFor: (images) => dockerScript("rmi", images.map(imageReference)),
  note: "An image with other tags only loses this one. Images containers were made from stay until the containers are removed.",
  nameOf: imageReference,
  refresh: dockerImageRows.refresh,
});
