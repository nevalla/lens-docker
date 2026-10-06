import { dockerScript } from "../actions/run-docker-command.injectable";
import { getRemoveActions } from "../actions/get-remove-actions";
import { type DockerVolume, dockerVolumeRows } from "./volume-rows.injectable";

export const volumeRemoval = getRemoveActions<DockerVolume>({
  id: "volumes",
  noun: "volume",
  scriptFor: (volumes) => dockerScript("volume rm", volumes.map((volume) => volume.Name)),
  note: "Its data is lost for good. Volumes containers mount stay until the containers are removed.",
  nameOf: (volume) => volume.Name,
  refresh: dockerVolumeRows.refresh,
});
